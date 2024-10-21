import { ActDialogueTree } from '../dialogue/Dialogue.js'
import { Act } from '../files/Dialog.js'
import { getExcelFile, getFile } from '../files/GameFile.js'
import { InternalDialogueCondition, InternalDialogueNPC } from '../files/MapData.js'
import { DICON_MAP } from '../Shared.js'
import { textMap } from '../TextMap.js'
import type { NPCInstance } from './NPC.js'
import type { PropInstance } from './Prop.js'

export const DialogueNPC = await getExcelFile<InternalDialogueNPC>('DialogueNPC.json', 'GroupID')
export const DialogueCondition = await getExcelFile<InternalDialogueCondition>('DialogueCondition.json', 'ID')

export class NPCDialogue {
	id: number
	act_path: string
	priority: number

	conditions: InternalDialogueCondition[]

	dicon: keyof typeof DICON_MAP
	prompt?: string

	constructor(dataOrId: InternalDialogueNPC | string | number, public source: NPCInstance | PropInstance) {
		const data = typeof dataOrId == 'object' ? dataOrId : DialogueNPC[dataOrId]
		this.id = data.GroupID
		this.act_path = data.ActPath
		this.priority = data.Priority ?? 0
		this.conditions = data.ConditionIDs.map(id => DialogueCondition[id])
		this.dicon = data.IconType
		this.prompt = textMap.getText(data.InteractTitle) || undefined
	}
	
	tree?: NPCDialogueTree

	async loadDialogue() {
		return this.tree ??= await NPCDialogueTree.fromNPC(this)
	}
	
	activeForMission(id: number) {
		return this.conditions.length == 0 || this.conditions.find(cond => cond && cond.Type == 'submission_state_equal' && cond.Param1 == id && cond.Param2 != 0)
	}
}

export class NPCDialogueTree extends ActDialogueTree {
	type: 'npc' = 'npc'

	constructor(public dialogueNpc: NPCDialogue, act: Act) {
		super(act, `npc_${dialogueNpc.source.name}_${dialogueNpc.id}`)
	}

	static async fromNPC(data: NPCDialogue): Promise<NPCDialogueTree> {
		const actData = await getFile<Act>(data.act_path)
		const tree = new this(data, actData)
		tree.root = await tree.processAct(actData)
		return tree
	}
}