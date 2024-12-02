import { HashReference } from '../TextMap.ts'
import { ItemReference } from './Item.js'

export interface ActivityFinishCondition {
	Type: 'FinishMainMission' | 'FinishQuest'
	Param: string
}

export interface ActivityPanelData {
	PanelID: number
	Type: number
	ActivityModuleID: number
	UIPrefab: string
	TypeParam: number[]
	UnlockConditions: string
	SortWeight: number
	TabName: HashReference
	TitleName: HashReference
	PanelDesc: HashReference
	TabIcon: string
	TagDesc: HashReference
	IntroDesc: HashReference
	DisplayItemList: ItemReference[]
	ActionNameList: string[]
	ActionNameListOnTab: string[]
	DailyHint?: boolean
	FinishConditions: ActivityFinishCondition[]
	DailyHintDisappearCondition: string
	EarlyAccessContentID: number
}