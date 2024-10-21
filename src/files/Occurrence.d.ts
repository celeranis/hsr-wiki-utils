import type { AeonPath, Dictionary } from '../Shared.ts'
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
	OptionDisplayID: number
	OptionTitle: HashReference
	OptionDesc: HashReference
	OptionDetailDesc: HashReference
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

export interface InternalNPC {
	RogueNPCID: number
	NPCJsonPath: string
	// DialogueProgress: number
	// TexturePath: string
	// DialoguePath: string
	// HandbookEventID?: number
	// ImageID: number
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

export type RogueTalkNameConfig = Dictionary<InternalTalkName>

export interface DynamicMapEntry {
	DisplayID: number
}

export interface DynamicDisplay {
	DisplayID: number
	ContentText: HashReference
}

export interface OptReference {
	OptionID: number
	DisplayID: number
	DynamicMap?: Dictionary<DynamicMapEntry>
	SpecialOptionID?: number
	DescValue?: number
	DescValue2?: number
	DescValue3?: number
	DescValue4?: number
}

export interface OptData {
	OptionList: OptReference[]
}

export interface RogueNPCDialogue {
	DialogueProgress?: number
	TalkNameID: number
	DialoguePath: string
	OptionPath: string
}

export interface RogueNPCData {
	DialogueType: 'Event'
	DialogueList: RogueNPCDialogue[]
}

export interface InternalRogueImage {
	ImageID: number
	ImageType: 'RandomEvt' | 'Aeon' | 'Other'
	ImagePath: string
	ParamStr1: string
	ParamStr2: string
	TexturePath: string
}