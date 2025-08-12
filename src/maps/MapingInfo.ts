import { Item } from '../Item.js';
import { Dictionary } from '../Shared.js';
import { Enemy } from '../Stage.js';
import { textMap } from '../TextMap.js';
import { getFile } from '../files/GameFile.js';
import { ItemReference } from '../files/Item.js';
import { FarmType, InternalMappingInfo, MappingType } from '../files/graph/MapData.js';
import { Area } from './Area.js';

export const mappingData = await getFile<Dictionary<InternalMappingInfo>>('ExcelOutput/MappingInfo.json')

export class MappingInfo {
	static readonly data = mappingData
	
	mapping_id: number
	name: string
	name_hash: number | bigint
	desc: string
	
	is_waypoint: boolean
	is_on_map: boolean
	default_unlock: boolean
	
	plane_id?: number
	floor_id?: number
	group_id?: number
	config_id?: number
	
	display_enemy_ids: number[]
	display_item_refs: ItemReference[]

	type?: MappingType
	farm_type?: FarmType
	
	constructor(data: InternalMappingInfo) {
		this.mapping_id = data.ID
		this.name = textMap.getText(data.Name)
		this.name_hash = data.Name?.Hash
		this.desc = textMap.getText(data.Desc)
		
		this.is_waypoint = data.IsTeleport ?? false
		this.is_on_map = data.IsShowInFog ?? false
		this.default_unlock = data.InitialEnable ?? false
		
		this.plane_id = data.PlaneID
		this.floor_id = data.FloorID
		this.group_id = data.FloorID
		this.config_id = data.ConfigID
		
		this.display_enemy_ids = data.ShowMonsterList ?? []
		this.display_item_refs = data.DisplayItemList ?? []
		
		this.type = data.Type
		this.farm_type = data.FarmType
	}
	
	static fromId(id: string | number) {
		return new this(Object.values(mappingData).find(data => data.ID == id)!)
	}
	
	static loadAll() {
		return Object.values(mappingData).map(data => new this(data))
	}
	
	async getArea(): Promise<Area | undefined> {
		return this.plane_id ? await Area.fromId(this.plane_id) || undefined : undefined
	}
	
	getEnemies() {
		return this.display_enemy_ids.map(enemy => Enemy.fromId(enemy))
	}
	
	getItems(): Item[] {
		return this.display_item_refs.map(item => Item.fromId(item.ItemID)!)
	}
}