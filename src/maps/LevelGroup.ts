import { ActDialogueTree } from '../dialogue/Dialogue.js';
import type { EnvData } from '../dialogue/Environment.js';
import { getFileSafe } from '../files/GameFile.js';
import { Act } from '../files/graph/Dialog.js';
import type { LevelGroupData, LoadCondition } from '../files/graph/MapData.js';
import { NPCInstance } from './NPC.js';
import type { BaseMapDialogue } from './NPCDialogue.js';
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
	
	act_path?: string
	
	constructor(data: LevelGroupData, public id: number, public floor_id: number) {
		this.load_conditions = data.LoadCondition?.Conditions ?? []
		this.load_condition_mode = data.LoadCondition?.Operation
		
		this.unload_conditions = data.UnloadCondition?.Conditions ?? []
		this.unload_conditions_mode = data.UnloadCondition?.Operation
		
		this.owner_mission_id = data.OwnerMainMissionID
		this.conflict_ids = data.ConflictIDList ?? []
		
		this.act_path = data.LevelGraph

		this.npcs = data.NPCList?.map(npc => new NPCInstance(npc, this)) ?? []
		this.props = data.PropList?.map(prop => new PropInstance(prop, this)) ?? []
	}
	
	async getDialogueForMission(id: number) {
		const dialogueList: (BaseMapDialogue | LevelGroup)[] = []
		
		for (const src of [...this.npcs, ...this.props]) {
			const activeDialogue = src.dialogue.find(dialogue => dialogue.activeForMission(id))
			if (activeDialogue) dialogueList.push(activeDialogue)
		}
	
		if (this.act_path) {
			dialogueList.push(this)
		}
	
		return dialogueList
	}
	
	dialogue?: LevelGroupDialogueTree
	
	async loadDialogue(env?: EnvData) {
		if (!this.act_path) return undefined
		return this.dialogue ??= await LevelGroupDialogueTree.fromLevelGroup(this, env)
	}
}

export class LevelGroupDialogueTree extends ActDialogueTree {
	type: 'group' = 'group'

	constructor(group: LevelGroup, act: Act) {
		super(act, `group_${group.floor_id}_${group.id}`)
	}

	static async fromLevelGroup(group: LevelGroup, env?: EnvData): Promise<LevelGroupDialogueTree | undefined> {
		if (!group.act_path) throw new TypeError(`Given group does not have a LevelGraph`)
		const actData = await getFileSafe<Act>(group.act_path)
		if (!actData) {
			console.error(`Failed to load LevelGraph ${group.act_path}`)
			return
		}
		const tree = new this(group, actData)
		tree.environment.applyData(env)
		tree.root = await tree.processAct(actData)
		return tree
	}
	
	async wikitext(): Promise<string> {
		return (process.argv.includes('--add-triggers') ? `<!--LevelGroup: ${this.debug_id}-->\n` : '')
			+ (await super.wikitext())
	}
}