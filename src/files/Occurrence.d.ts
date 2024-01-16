import type { AeonPath } from '../Shared.ts'
import type { HashReference } from '../TextMap.ts'

export interface InternalEventSection {
	EventID: number,
	EventDisplayID?: number,
	RogueEffectType?: EffectType,
	RogueEffectParamList: number[]
	CostType?: CostType
	CostParamList: number[]
	DescValue?: number
	DescValue2?: number
	DescValue3?: number
	ConditionIDList: number[]
	DynamicContentID?: number
	AeonOption: AeonPath
	PerformanceType?: number

	// legacy
	EventTitle?: HashReference
	EventDesc?: HashReference
	EventDetailDesc?: HashReference
}

export interface InternalEventSectionDisplay {
	EventDisplayID: number
	EventTitle: HashReference
	EventDesc: HashReference
	EventDetailDesc: HashReference
}

export interface InternalEventName {
	TalkNameID: number
	Name: HashReference
	SubName: HashReference
	IconPath: string
	ImgPath: string
	ImageID: number
}

export interface InternalTalkSentence {
	TalkSentenceID: number
	TextmapTalkSentenceName: HashReference
	TalkSentenceText: HashReference
	VoiceID?: number
}

export interface InternalHandbookEvent {
	EventID: number
	EventTitle: HashReference
	EventType: HashReference
	EventDesc: HashReference
	EventImage: string
	EventReward: number
	Order: number
	EventTypeList: number[]
	UnlockHintDesc: HashReference
	ImageID: number
	DialoguePath: string
}

export interface InternalTalkName {
	TalkNameID: number
	Name: HashReference
	SubName: HashReference
	IconPath: string
	ImgPath: string
	ImageID: number
}

export interface InternalNPCDialogue {
	RogueNPCID: number
	DialogueProgress: number
	TexturePath: string
	DialoguePath: string
	HandbookEventID?: number
	ImageID: number
	_name?: HashReference
	_talk: InternalTalkName
}

export interface InternalSecretGroup {
	SubStoryGroupID: number
	ShowGroup: number
	SubStoryList: number[]
	UnlockID?: number
	SubStoryGroupName: HashReference
}

export interface InternalSecret {
	RogueDLCSubStoryID: number
	Layer: number
	LevelGraphPath: string
	SubStoryName: HashReference
	ImgPath: string
}

export type EffectType =
	'ReplaceRogueBuffKeepLevel' | 'GetItem' | 'TriggerDialogueEventList'
	| 'GetRogueBuff' | 'GetChessRogueCheatDice' | 'GetRogueMiracle'
	| 'RecoverLineup' | 'TriggerRogueBuffSelect' | 'TriggerRogueMiracleSelect' | 'ChangeChessRogueActionPoint'
	| 'TriggerRandomEvent' | 'UpRogueBuffLevel' | 'TriggerBattle' | 'TriggerRandomResult' | 'TriggerRogueBuffReforge'
	| 'GetAllRogueBuffInGroup' | 'TriggerRogueMiracleTrade' | 'ReplaceRogueBuff' | 'ChangeRogueMiracleToRogueCoin'
	| 'RemoveRogueMiracle' | 'GetItemByPercent' | 'RemoveRogueBuff' | 'RepairRogueMiracleByGroup' | 'TriggerRogueBuffDrop'
	| 'ChangeRogueMiracleToRogueMiracle' | 'ChangeRogueMiracleToRogueBuff' | 'DestroyRogueMiracle' | 'GetChessRogueRerollDice'
	| 'GetRogueBuffByMiracleCount'
	| 'SetChessRogueNextStartCellAdventureRoomType' | 'FinishChessRogue'
	// 1.6 //
	| 'GetAllRogueBuffInGroupAndGetItem' | 'EnhanceRogueBuff' | 'TriggerRandomEventList' | 'ChangeNousValue'
	| 'RepairRogueMiracle' | 'ChangeLineupData' | 'TriggerRogueMiracleRepair' | 'ReviveAvatar' | 'RepeatableGamble'

export type CostType = 'CostItemValue' | 'CostHpCurrentPercent' | 'CostHpMaxPercent' | 'CostItemPercent' | 'CostHpSpToPercent'