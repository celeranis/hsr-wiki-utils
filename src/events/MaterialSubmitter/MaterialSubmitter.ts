import { BelobogShopUIData, MaterialSubmitterData, MaterialSubmitterGroupData, MaterialSubmitterReplyData } from '../../files/event/MaterialSubmitter.js'
import { getExcelFile } from '../../files/GameFile.js'
import { ItemReference } from '../../files/Item.js'
import { ItemList } from '../../Item.js'
import { sanitizeString } from '../../Shared.js'
import { textMap } from '../../TextMap.js'
import { uploadPrompt } from '../../util/General.js'
import { Table } from '../../util/Table.js'

export const MaterialSubmitter = await getExcelFile<MaterialSubmitterData>('MaterialSubmitter.json', 'ID')
export const MaterialSubmitterGroup = await getExcelFile<MaterialSubmitterGroupData>('MaterialSubmitterGroup.json', 'Type')
export const MaterialSubmitterReply = await getExcelFile<MaterialSubmitterReplyData>('MaterialSubmitterReply.json', 'ID')
export const BelobogShopUIConfig = await getExcelFile<BelobogShopUIData>('BelobogShopUIConfig.json', 'ID')

export class ItemExchange {
	id: number
	activity_module_id: number
	params: number[]
	material_refs: ItemReference[]
	mission_id: number
	reward_id: number
	
	constructor(data: MaterialSubmitterData) {
		this.id = data.ID
		this.activity_module_id = data.ActivityModuleID
		this.params = data.ParamList
		this.material_refs = data.MaterialList
		this.mission_id = data.MissionID
		this.reward_id = data.RewardID
	}
	
	static fromId(id: string | number) {
		return new this(MaterialSubmitter[id])
	}
	
	getMaterials() {
		return new ItemList(this.material_refs)
	}
	
	getRewards() {
		return ItemList.fromRewardId(this.reward_id)
	}
}

export function getReplyAvatar(name: string, path: string) {
	if (path.includes('/Heliobus/')) {
		return `{{Icon/FTH|${name}}}`
	} else if (path == 'SpriteOutput/AvatarRoundIcon/UI_Message_Contacts_Anonymous.png') {
		return `[[File:NPC Anonymous Icon.png|20px]]`
	} else if (path == 'SpriteOutput/AvatarIcon/NPC/2104.png') {
		return '{{Icon|Mr. Cold Feet}}'
	} else if (path == 'SpriteOutput/AvatarRoundIcon/Avatar/1103.png') {
		return '[[File:Character Serval Icon.png|20px]]'
	} else {
		return `[[File:NPC ${name} Icon.png|20px]]${uploadPrompt(path, `NPC ${name} Icon.png`, 'NPC Icons')}`
	}
}

export class BelobogShopExchange extends ItemExchange {
	name: string
	description: string
	icon_path: string
	image_path: string
	replies: MaterialSubmitterReplyData[]
	
	constructor(data: BelobogShopUIData) {
		super(MaterialSubmitter[data.ID])
		this.name = textMap.getText(data.Name)
		this.description = textMap.getText(data.Desc)
		this.icon_path = data.IconPath
		this.image_path = data.ImgPath
		this.replies = data.ReplyIDList
			.map(id => MaterialSubmitterReply[id])
	}
	
	wikitext() {
		const output: string[] = [
			`==${this.name}==`,
			`[[File:Product ${sanitizeString(this.name)}.png|150px|float|right]]${uploadPrompt(this.image_path, `Product ${sanitizeString(this.name)}.png`, "Mr. Cold Feet's Pop-Up Shop Images")}`,
			`{{Description|${this.description.replaceAll('\n', '<br />')}}}`
		]
		
		const overviewTable = new Table('wikitable', ['Required Ingredients', 'Estimated Dividends'])
		
		overviewTable.addRow(
			this.getMaterials().asCardList(),
			this.getRewards().asCardList()
		)
		
		output.push(
			overviewTable.wikitable(false),
			'',
			'===Ratings==='
		)
		
		const repliesTable = new Table('article-table thr2')
		
		for (const reply of this.replies) {
			const name = textMap.getText(reply.PersonName)
			const replyContent = textMap.getText(reply.Content)
			repliesTable.addRow(
				`! ${getReplyAvatar(name, reply.HeadIconPath)} ${name}${reply.Tag == 3 ? ' {{Color|blue|[Seller]}}' : ''}`,
				'! ' + (
					reply.Tag == 1 ? '{{Color|#bd4a76|Positive Review}} [[File:Icon Positive Review.png|25px]]'
					: reply.Tag == 2 ? '{{Color|#909296|Negative Review}} [[File:Icon Negative Review.png|25px]]'
					: ''
				)
			)
			repliesTable.addRow(`colspan="2" | ${replyContent.replaceAll('\n', '<br />')}`)
		}
		
		output.push(repliesTable.wikitable(false))
		
		return output.join('\n')
	}
	
	static fromId(id: string | number) {
		return new this(BelobogShopUIConfig[id])
	}
	
	static loadGroup(group: MaterialSubmitterGroupData['Type']) {
		return MaterialSubmitterGroup[group].SubmitterIDList
			.map(id => this.fromId(id))
	}
}