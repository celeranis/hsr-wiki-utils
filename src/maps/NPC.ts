import { getExcelFile } from '../files/GameFile.js'
import { InternalNPCData, MapNPC, NPCSubType, Vector3 } from '../files/graph/MapData.js'
import { HashReference, textMap } from '../TextMap.js'
import { BaseMapObject } from './BaseMapObject.js'
import type { LevelGroup } from './LevelGroup.js'
import { BaseMapDialogue, DefaultPropDialogue, DialogueNPC, NPCDialogue } from './NPCDialogue.js'

export const NPCData = await getExcelFile<InternalNPCData>('NPCData.json', 'ID')

export class BaseNPC {
	id: number
	
	name?: string
	name_hash: HashReference
	
	title?: string
	
	config_path: string
	json_path: string
	
	subtype?: NPCSubType
	series_id?: number
	
	constructor(data: InternalNPCData | number | string) {
		const npcData = typeof data == 'object' ? data : NPCData[data]
		
		this.id = npcData.ID
		this.name = textMap.getText(npcData.DefaultNPCName) || undefined
		this.name_hash = npcData.DefaultNPCName
		
		this.title = textMap.getText(npcData.DefaultNPCTitle) || undefined
		
		this.config_path = npcData.ConfigEntityPath
		this.json_path = npcData.JsonPath
		
		this.subtype = npcData.SubType
		this.series_id = npcData.SeriesID
	}
}

export class NPCInstance extends BaseNPC implements BaseMapObject {
	type: 'npc' = 'npc'
	
	object_id: number
	initial_load?: boolean
	
	position: Vector3
	rotation: Vector3
	
	internal_name?: string
	
	dialogue_ids: number[]
	dialogue: BaseMapDialogue[]
	
	constructor(data: MapNPC, public group: LevelGroup) {
		super(data.NPCID)
		this.object_id = data.ID
		this.position = { X: data.PosX ?? 0, Y: data.PosY ?? 0, Z: data.PosZ ?? 0 }
		this.rotation = { X: data.RotX ?? 0, Y: data.RotY ?? 0, Z: data.RotZ ?? 0 }
		this.internal_name = data.Name
		
		if (data.OverrideNPCName) {
			this.name = textMap.getText(data.OverrideNPCName) || this.name
		}
		if (data.OverrideNPCTitle) {
			this.title = textMap.getText(data.OverrideNPCTitle) || this.title
		}
		
		this.dialogue_ids = [...(data.DialogueGroups ?? []), ...(data.TalkDialogGroupIDList ?? [])]
		this.dialogue = this.dialogue_ids
			.filter(id => DialogueNPC[id])
			.map(id => new NPCDialogue(id, this))
			.sort((d0, d1) => d1.priority - d0.priority)
		this.initial_load = data.LoadOnInitial ?? true
		
		if (data.Dialog) {
			this.dialogue.push(new DefaultPropDialogue(data, this))
		}
	}
}

