import { ActDialogueTree } from '../dialogue/Dialogue.js'
import type { EnvData } from '../dialogue/Environment.js'
import { getExcelFile, getFile } from '../files/GameFile.js'
import { Act } from '../files/graph/Dialog.js'
import { InteractiveMapObject, InternalDialogueCondition, InternalDialogueNPC, LoadCondition } from '../files/graph/MapData.js'
import { DICON_MAP } from '../Shared.js'
import { textMap } from '../TextMap.js'
import type { NPCInstance } from './NPC.js'
import type { PropInstance } from './Prop.js'

export const DialogueNPC = await getExcelFile<InternalDialogueNPC>('DialogueNPC.json', 'GroupID')
export const DialogueCondition = await getExcelFile<InternalDialogueCondition>('DialogueCondition.json', 'ID')

export abstract class BaseMapDialogue {
	abstract id: number | string
	abstract act_path: string
	abstract priority: number

	abstract conditions: (LoadCondition | InternalDialogueCondition)[]

	abstract dicon: keyof typeof DICON_MAP
	abstract prompt?: string
	
	abstract source: NPCInstance | PropInstance

	tree?: NPCDialogueTree

	async loadDialogue(env?: EnvData) {
		if (this.tree) {
			if (this.tree.environment.has_definite_conditional) {
				const newTree = await NPCDialogueTree.fromNPC(this, env)
				if (newTree) {
					ActDialogueTree.crossResolveStrings([this.tree, newTree])
				}
				return newTree
			} else {
				this.tree.environment.applyData(env)
				return this.tree
			}
		} else {
			return this.tree = await NPCDialogueTree.fromNPC(this, env)
		}
	}

	activeForMission(id: number) {
		return this.conditions.length == 0 || this.conditions.find(cond => cond && (cond.Type == 'submission_state_equal' && cond.Param1 == id && cond.Param2 != 0) || (cond.Type == 'SubMission' && cond.Phase == 'Finish' && (id - cond.ID) < 100 && id > cond.ID))
	}
}

export class NPCDialogue extends BaseMapDialogue {
	id: number
	act_path: string
	priority: number

	conditions: InternalDialogueCondition[]

	dicon: keyof typeof DICON_MAP
	prompt?: string

	constructor(dataOrId: InternalDialogueNPC | string | number, public source: NPCInstance | PropInstance) {
		super()
		const data = typeof dataOrId == 'object' ? dataOrId : DialogueNPC[dataOrId]
		this.id = data.GroupID
		this.act_path = data.ActPath
		this.priority = data.Priority ?? 0
		this.conditions = data.ConditionIDs
			.map(id => DialogueCondition[id])
			.filter(cond => cond != undefined)
		this.dicon = data.IconType
		this.prompt = textMap.getText(data.InteractTitle) || undefined
	}
}

export class DefaultPropDialogue extends BaseMapDialogue {
	id: number | string
	act_path: string
	priority = -10000
	
	conditions: LoadCondition[]

	dicon: keyof typeof DICON_MAP
	prompt?: string
	
	constructor(propData: InteractiveMapObject, public source: NPCInstance | PropInstance) {
		super()
		this.id = `${source.group.floor_id}_${source.group.id}_${source.id}`
		this.act_path = propData.Dialog!.LevelGraph
		
		this.conditions = propData.Dialog?.EnableCondition?.Conditions ?? []

		this.dicon = propData.InteractIconType!
		this.prompt = textMap.getText(propData.InteractTitle)
	}
}

export class NPCDialogueTree extends ActDialogueTree {
	type: 'npc' = 'npc'

	constructor(public dialogueNpc: BaseMapDialogue, act: Act) {
		super(act, `npc_${dialogueNpc.source.name}_${dialogueNpc.id}`)
	}

	static async fromNPC(data: BaseMapDialogue, env?: EnvData): Promise<NPCDialogueTree | undefined> {
		if (!data.act_path || data.act_path == '123') { // what intern was responsible for this random "123" LevelGraph
			return
		}
		const actData = await getFile<Act>(data.act_path)
		const tree = new this(data, actData)
		tree.environment.applyData(env)
		tree.root = await tree.processAct(actData)
		return tree
	}
}