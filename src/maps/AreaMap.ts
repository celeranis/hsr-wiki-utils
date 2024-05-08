import { Dictionary } from '../Shared.js';
import { LazyData, getFile } from '../files/GameFile.js';
import { InternalMappingInfo, LevelFloor, LevelGroup, LoadConditionList, MapNPC, MapProp, MazeFloor, MazePlane, MazeProp, NPCData, Vector2, Vector3 } from '../files/MapData.js';

export interface MapRef<I, D> {
	instance: I
	data: D
	groupLoadCondition: LoadConditionList
	groupUnloadCondition: LoadConditionList
}

export type PixelPosition = [number, number]

const EMPTY_VECTOR: Vector3 = {X: 0, Y: 0, Z: 0}

export class AreaMap {
	static npc_data = new LazyData<Dictionary<NPCData>>('ExcelOutput/NPCData.json')
	static prop_data = new LazyData<Dictionary<MazeProp>>('ExcelOutput/MazeProp.json')
	static mapping_data = new LazyData<Dictionary<InternalMappingInfo>>('ExcelOutput/MappingInfo.json')
	
	private constructor() {}
	
	plane_data!: MazePlane
	floor_data!: MazeFloor
	level_output?: LevelFloor
	
	groups = new Map<number, LevelGroup>();
	npcs: MapRef<MapNPC, NPCData>[] = []
	markers: MapRef<MapProp, MappingInfo>[] = []
	
	map_center!: Vector3
	map_scale!: number
	
	static async fromFloor(plane: MazePlane, floor: MazeFloor) {
		return new this().loadFloor(plane, floor)
	}
	
	pointToMapPixel(vector: Vector2): PixelPosition {
		return [
			(this.map_center.X + vector.X) / this.map_scale,
			(this.map_center.Y + vector.Y) / -this.map_scale
		]
	}
	
	async loadFloor(plane: MazePlane, floor: MazeFloor) {
		const levelOutput = await getFile<LevelFloor>(`./Config/LevelOutput/Floor/P${plane.PlaneID}_${floor.FloorID}.json`)
		this.plane_data = plane
		this.floor_data = floor
		this.level_output = levelOutput
		this.map_center = levelOutput.MinimapVolumeData.Center ?? EMPTY_VECTOR
		this.map_scale = levelOutput.MinimapVolumeData.Scale ?? 1
		for (const groupRef of levelOutput.GroupList) {
			if (!groupRef.GroupPath) continue
			
			const group = await getFile<LevelGroup>(groupRef.GroupPath) 
			this.groups.set(groupRef.ID, group)
			
			const base = {
				groupLoadCondition: group.LoadCondition,
				groupUnloadCondition: group.UnloadCondition,
			}
			
			for (const npc of group.NPCList || []) {
				this.npcs.push({
					...base,
					data: (await AreaMap.npc_data.get())[npc.NPCID],
					instance: npc,
				})
			}
			
			for (const prop of group.PropList || []) {
				if (prop.MappingInfoID) {
					this.markers.push({
						...base,
						data: (await AreaMap.mapping_data.get())[prop.MappingInfoID],
						instance: prop
					})
				}
			}
		}
		return this
	}
}