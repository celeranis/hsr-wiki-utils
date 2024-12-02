import type { performance } from '../dialogue/tasks/Performance.js';
import { getExcelFile } from '../files/GameFile.js';
import { InternalMazeProp, MapProp, MapTriggerData, PropType, Vector3 } from '../files/graph/MapData.js';
import { Dictionary } from '../Shared.js';
import { textMap } from '../TextMap.js';
import { BaseMapObject } from './BaseMapObject.js';
import type { LevelGroup } from './LevelGroup.js';
import { BaseMapDialogue, DefaultPropDialogue, DialogueNPC, NPCDialogue } from './NPCDialogue.js';

export const MazeProp = await getExcelFile<InternalMazeProp>('MazeProp.json', 'ID')

export class BaseProp {
	id: number
	prop_type: PropType
	
	name?: string
	title?: string
	
	icon_path?: string
	config_path?: string
	json_path?: string
	
	map_icon_type?: number
	
	states: string[]
	performance_type: keyof typeof performance
	
	constructor(dataOrId: InternalMazeProp | number | string) {
		const data = typeof dataOrId == 'object' ? dataOrId : MazeProp[dataOrId]
		
		this.id = data.ID
		this.prop_type = data.PropType
		
		this.name = textMap.getText(data.PropName) || undefined
		this.title = textMap.getText(data.PropTitle) || undefined
		
		this.icon_path = data.PropIconPath
		this.config_path = data.ConfigEntityPath
		this.json_path = data.JsonPath
		
		this.map_icon_type = data.MiniMapIconType
		
		this.states = data.PropStateList ?? []
		this.performance_type = data.PerformanceType
	}
}

export class PropInstance extends BaseProp implements BaseMapObject {
	type: 'prop' = 'prop'
	
	object_id: number
	
	position: Vector3
	rotation: Vector3
	
	internal_name?: string
	
	trigger?: MapTriggerData
	custom_trigger_map?: Dictionary<MapTriggerData>
	
	camp_id?: number

	dialogue_ids: number[]
	dialogue: BaseMapDialogue[]
	
	constructor(data: MapProp, public group: LevelGroup) {
		super(data.PropID)
		this.object_id = data.ID
		this.position = { X: data.PosX ?? 0, Y: data.PosY ?? 0, Z: data.PosZ ?? 0 }
		this.rotation = { X: data.RotX ?? 0, Y: data.RotY ?? 0, Z: data.RotZ ?? 0 }
		this.internal_name = data.Name
		
		this.trigger = data.Trigger
		this.custom_trigger_map = data.CustomTriggerMapV2 ?? data.CustomTriggerMap

		this.dialogue_ids = [...data.DialogueGroups ?? [], ...data.TalkDialogGroupIDList ?? []]
		this.dialogue = this.dialogue_ids
			.filter(id => DialogueNPC[id])
			.map(id => new NPCDialogue(id, this))
			.sort((d0, d1) => d1.priority - d0.priority)

		if (data.Dialog) {
			this.dialogue.push(new DefaultPropDialogue(data, this))
		}
	}
}