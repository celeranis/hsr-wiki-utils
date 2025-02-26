import { RogueTournTitanType } from './Boon.js'
import { ActDialogueTree } from './dialogue/Dialogue.js'
import { InternalTitanTalent } from './files/Boon.js'
import { getExcelFile, getFile } from './files/GameFile.js'
import { Act } from './files/graph/Dialog.js'
import { ItemReference } from './files/Item.js'
import { textMap } from './TextMap.js'

export const RogueTournTitanTalent = await getExcelFile<InternalTitanTalent>('RogueTournTitanTalent.json', 'ID')

export class TitanOde {
	id: number
	name: string
	name_hash: number | bigint
	level: number
	cost: ItemReference[]
	
	description: string
	icon: string
	
	titan_id: string
	titan_title: string
	
	story_name: string
	story_json: string
	
	constructor(data: InternalTitanTalent) {
		this.id = data.ID
		this.name = textMap.getText(data.TalentTitle)
		this.name_hash = data.TalentTitle.Hash
		this.level = data.Level
		this.cost = data.Cost
		this.description = textMap.getText(data.TalentDesc, data.DescParamList)
		this.icon = data.TalentIconPath
		
		const titanData = RogueTournTitanType[data.TitanType]
		this.titan_id = data.TitanType
		this.titan_title = textMap.getText(titanData.TitanTitle)
		
		this.story_name = textMap.getText(data.ActTitle)
		this.story_json = data.ActJson
	}
			
	async loadDialogue() {
		if (!this.story_json) return undefined
		const dialogueData = await getFile<Act>(this.story_json)
		return OdeDialogueTree.fromOde(dialogueData, this)
	}
	
	static loadAll() {
		return Object.values(RogueTournTitanTalent).map(data => new this(data))
	}
}

export class OdeDialogueTree extends ActDialogueTree {
	type: 'ode' = 'ode'
	
	protected constructor(act: Act, ode: TitanOde) {
		super(act, `ode_${ode.story_name}_${ode.id}`)
	}
	
	static async fromOde(act: Act, occurrence: TitanOde) {
		const tree = new this(act, occurrence)
		tree.root = await tree.processAct(act)
		return tree
	}
}