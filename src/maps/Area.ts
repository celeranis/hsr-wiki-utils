import { Dictionary } from '../Shared.js'
import { textMap } from '../TextMap.js'
import { LazyExcelData, getFile, getFileSafe } from '../files/GameFile.js'
import { LevelFloor, LevelGroupData, LevelGroupReference, MazeFloor, MazePlane, PlaneType, WorldData } from '../files/graph/MapData.js'
import type { LevelGroup } from './LevelGroup.js'
// import { AreaMap } from './AreaMap.js'

const world_data = await getFile<Dictionary<WorldData>>('ExcelOutput/WorldDataConfig.json')

export class Area {
	static plane_data = new LazyExcelData<MazePlane>('ExcelOutput/MazePlane.json', 'PlaneID')
	static floor_data = new LazyExcelData<MazeFloor>('ExcelOutput/MazeFloor.json', 'FloorID')
	static world_data = world_data
	
	plane_id: number
	name: string
	type: PlaneType
	floor_ids: number[]
	start_floor_id: number
	floors?: AreaFloor[]
	world: WorldData

	constructor(public data: MazePlane) {
		this.plane_id = data.PlaneID
		this.name = textMap.getText(data.PlaneName)
		this.type = data.PlaneType
		this.floor_ids = data.FloorIDList
		this.start_floor_id = data.StartFloorID
		this.world = Object.values(world_data).find(world => world.ID == data.WorldID)!
		
		Area.cache[data.PlaneID] = this
	}

	async getFloors(): Promise<AreaFloor[]> {
		if (this.floors) return this.floors
		
		this.floors = []
		for (const id of this.floor_ids) {
			let floor = await AreaFloor.fromId(this, id)
			if (floor) {
				this.floors.push(floor)
			}
		}
		return this.floors
	}

	// async getMaps(): Promise<AreaMap[]> {
	// 	const floors = this.floors ?? await this.getFloors()
	// 	const maps: AreaMap[] = []
	// 	for (const floor of floors) {
	// 		maps.push(await AreaMap.fromFloor(this.data, floor))
	// 	}
	// 	return maps
	// }

	static cache: Dictionary<Area> = {}
	static async fromId(id: string | number): Promise<Area | null> {
		if (this.cache[id]) return this.cache[id]
		
		const data = (await this.plane_data.get())[id]
		if (!data) {
			console.warn(`Unknown MazePlane ${id}`)
			return null
		}

		return new this(data)
	}

	static async loadAll(): Promise<Area[]> {
		const data = await this.plane_data.get()
		return Object.values(data).map(data => new this(data))
	}
}

export class AreaFloor {
	floor_id: number
	base_id: number
	name: string
	
	tags: string[]
	floor_type?: 'Indoor' | 'Default'
	
	map_info_path: string
	group_refs: LevelGroupReference[]
	
	constructor(public excelData: MazeFloor, public configData: LevelFloor, public plane_id: number) {
		this.floor_id = excelData.FloorID
		this.base_id = excelData.BaseFloorID
		this.name = textMap.getText(excelData.FloorName)
		
		this.tags = excelData.FloorTag ?? []
		this.floor_type = excelData.FloorType
		
		this.map_info_path = configData.NavmapConfigPath
		this.group_refs = configData.GroupInstanceList
	}
	
	async getArea() {
		return Area.fromId(this.plane_id)
	}
	
	static async fromId(areaOrId: Area | string | number, floor_id: number): Promise<AreaFloor | null> {
		const area = typeof areaOrId == 'object' ? areaOrId : await Area.fromId(areaOrId)
		if (!area) return null
		const configData = await getFile<LevelFloor>(`Config/LevelOutput/RuntimeFloor/P${area.plane_id}_F${floor_id}.json`)
		return new this((await Area.floor_data.get())[floor_id], configData, area.plane_id)
	}
	
	loaded_groups: Dictionary<LevelGroup> = {}
	
	async loadGroup(group_id: string | number) {
		if (this.loaded_groups[group_id]) return this.loaded_groups[group_id]
		
		const group = this.group_refs.find(group => group.ID == group_id)
		if (!group) return group
		
		const groupData = await getFileSafe<LevelGroupData>(group.GroupPath)
		if (!groupData) return undefined

		const { LevelGroup } = await import('./LevelGroup.js')
		
		return this.loaded_groups[group_id] = new LevelGroup(groupData, Number(group_id), this.floor_id)
	}
	
	async loadAllGroups() {
		for (const groupRef of this.group_refs) {
			await this.loadGroup(groupRef.ID)
		}
		return Object.values(this.loaded_groups)
	}

	async loadSubMissionGroups(mission_id: number, referenced?: number[]) {
		return (await this.loadAllGroups())
			.filter(group => referenced?.includes(group.id) || group.load_conditions.find(cond => cond.Type == 'SubMission' && cond.ID == mission_id))
	}
}