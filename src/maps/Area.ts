import { Dictionary } from '../Shared.js'
import { textMap } from '../TextMap.js'
import { LazyData, getFile } from '../files/GameFile.js'
import { MazeFloor, MazePlane, PlaneType, WorldData } from '../files/MapData.js'
import { AreaMap } from './AreaMap.js'

const world_data = await getFile<Dictionary<WorldData>>('ExcelOutput/WorldDataConfig.json')

export class Area {
	static plane_data = new LazyData<Dictionary<MazePlane>>('ExcelOutput/MazePlane.json')
	static floor_data = new LazyData<Dictionary<MazeFloor>>('ExcelOutput/MazeFloor.json')
	static world_data = world_data
	
	plane_id: number
	name: string
	type: PlaneType
	floor_ids: number[]
	start_floor_id: number
	floors?: MazeFloor[]
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

	async getFloors(): Promise<MazeFloor[]> {
		if (this.floors) return this.floors
		const floorData = await Area.floor_data.get()
		return this.floors = this.floor_ids.map(id => Object.values(floorData).find(floor => floor.FloorID == id)!)
	}

	async getMaps(): Promise<AreaMap[]> {
		const floors = this.floors ?? await this.getFloors()
		const maps: AreaMap[] = []
		for (const floor of floors) {
			maps.push(await AreaMap.fromFloor(this.data, floor))
		}
		return maps
	}

	static cache: Dictionary<Area> = {}
	static async fromId(id: string | number): Promise<Area> {
		if (this.cache[id]) return this.cache[id]
		
		const data = Object.values(await this.plane_data.get()).find(plane => plane.PlaneID == id)
		if (!data) {
			throw new TypeError(`Unknown MazePlane ${id}`)
		}

		return new this(data)
	}

	static async loadAll(): Promise<Area[]> {
		const data = await this.plane_data.get()
		return Object.values(data).map(data => new this(data))
	}
}