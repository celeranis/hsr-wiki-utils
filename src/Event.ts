import { ActivityFinishCondition, ActivityPanelData } from './files/Event.js'
import { getExcelFile } from './files/GameFile.js'
import { ItemReference } from './files/Item.js'
import { textMap } from './TextMap.js'

export const ActivityPanel = await getExcelFile<ActivityPanelData>('ActivityPanel.json', 'PanelID')

export class Event {
	id: number
	type: number
	type_params: number[]
	activity_module_id: number
	ui_path: string
	
	name: string
	intro: string
	details: string
	
	tab_icon_path: string
	reward_preview_data: ItemReference[]
	finish_conditions: ActivityFinishCondition[]
	early_access_id?: number
	
	constructor(data: ActivityPanelData) {
		this.id = data.PanelID
		this.type = data.Type
		this.type_params = data.TypeParam
		this.activity_module_id = data.ActivityModuleID
		this.ui_path = data.UIPrefab
		
		this.name = textMap.getText(data.TabName)
		this.intro = textMap.getText(data.PanelDesc)
		this.details = textMap.getText(data.IntroDesc)
		
		this.tab_icon_path = data.TabIcon
		this.reward_preview_data = data.DisplayItemList
		this.finish_conditions = data.FinishConditions
		this.early_access_id = data.EarlyAccessContentID
	}
	
	static fromPanelId(id: string | number) {
		return new this(ActivityPanel[id])
	}
	
	static fromActivityModuleId(id?: string | number) {
		if (!id) return undefined
		
		id = id.toString()
		let closest: string | undefined = undefined
		for (const data of Object.values(ActivityPanel)) {
			if (data.ActivityModuleID?.toString() == id) {
				return new this(data)
			}
			
			const thisId = data.PanelID.toString()
			if (id.startsWith(thisId) && (!closest || closest.length < thisId.length)) {
				closest = thisId
			}
		}
		
		if (closest) {
			return new this(ActivityPanel[closest])
		} else {
			return undefined
		}
	}
}