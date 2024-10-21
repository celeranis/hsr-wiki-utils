import type { LevelGroupData, LoadCondition } from '../files/MapData.js';
import { NPCInstance } from './NPC.js';
import type { NPCDialogue } from './NPCDialogue.js';
import { PropInstance } from './Prop.js';

export class LevelGroup {
	npcs: NPCInstance[]
	props: PropInstance[]
	
	load_conditions: LoadCondition[]
	load_condition_mode?: 'Or'
	
	unload_conditions: LoadCondition[]
	unload_conditions_mode?: 'Or'
	
	owner_mission_id?: number
	conflict_ids: number[]
	
	constructor(data: LevelGroupData, public id: number) {
		this.npcs = data.NPCList?.map(npc => new NPCInstance(npc)) ?? []
		this.props = data.PropList?.map(prop => new PropInstance(prop)) ?? []
		
		this.load_conditions = data.LoadCondition?.Conditions ?? []
		this.load_condition_mode = data.LoadCondition?.Operation
		
		this.unload_conditions = data.UnloadCondition?.Conditions ?? []
		this.unload_conditions_mode = data.UnloadCondition?.Operation
		
		this.owner_mission_id = data.OwnerMainMissionID
		this.conflict_ids = data.ConflictIDList ?? []
	}
	
	async getDialogueForMission(id: number) {
		const dialogueList: NPCDialogue[] = []
		
		for (const src of [...this.npcs, ...this.props]) {
			const activeDialogue = src.dialogue.find(dialogue => dialogue.activeForMission(id))
			if (activeDialogue) dialogueList.push(activeDialogue)
		}
	
		return dialogueList
	}
}