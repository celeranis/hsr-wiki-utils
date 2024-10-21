import type { HashReference } from '../TextMap.ts'
import { ItemReference } from './Item.js'

export interface AutoParam { Type: 'Auto' }
export interface MultiSequenceParam {
	Type: 'MultiSequence'
	Value: number
}
export interface PlayerLevelParam {
	Type: 'PlayerLevel'
	Value: number
}
export interface NextDayParam {
	Type: 'SequenceNextDay'
	Value: number
}
export interface MuseumParam {
	Type: 'MuseumPhaseRenewPointReach'
	Value: number
}
export interface FTHParam {
	Type: 'HeliobusPhaseReach'
	Value: number
}
export interface WorldLevelParam {
	Type: 'WorldLevel'
	Value: number
}

export type MissionParam = AutoParam | MultiSequenceParam | PlayerLevelParam | NextDayParam | MuseumParam | FTHParam | WorldLevelParam

export type InternalMissionType = 'Branch' | 'Companion' | 'Main' | 'Daily' | 'Gap'

export interface InternalMainMission {
	MainMissionID: number
	Type: InternalMissionType
	DisplayPriority: number
	NextMainMissionList: number[]
	Name: HashReference
	TakeOperation: 'And' | 'Or'
	BeginOperation: 'And' | 'Or'
	TakeParam: MissionParam[]
	BeginParam: MissionParam[]
	NextTrackMainMission?: number
	TrackWeight: number
	RewardID: number
	DisplayRewardID: number
	ChapterID: number
	SubRewardList: number[]
}

export interface InternalFateAtlasEntry {
	MissionID: number
	MissionConclusion: HashReference
}

export interface InternalSubMission {
	SubMissionID: number
	TargetText: HashReference
	DescrptionText: HashReference // sic
}

export interface InternalMissionChapter {
	ID: number
	ChapterName: string
	StageName: string
	ChapterDesc: string
	LinkChapterList?: unknown[]
	ChapterDisplayPriority: number
	ChapterIconPath: string
	ChapterFigureIconPath: string
}

export type BlackScreenMode = 'Full' | 'NoPrePost' | 'NoPre' | 'NoPost'
export interface Performance {
	PerformanceID: number
	PerformancePath: string
	IsSkip?: boolean
	ChangePlayerType?: 'StoryLine'
	PerformanceCharacter: string
	StartBlack?: BlackScreenMode
	EndBlack?: BlackScreenMode
	EndWithCrack?: boolean
	PlaneID: number
	FloorID: number
}

export interface InternalMissionInfo {
	MainMissionID: number
	StartSubMissionList: number[]
	FinishSubMissionList: number[]
	SubMissionList: InternalSubMissionInfo[]
	IsLegacyAssistWayPoint?: boolean
}

export interface InternalSubMissionInfo {
	ID: number
	MainMissionID: number
	MissionJsonPath?: string
	LevelPlaneID: number
	LevelFloorID: number
	TakeType?: 'Auto' | 'AnySequence'
	TakeParamIntList: number[]
	FinishType: 
		'Talk' | 'PropState' | 'KillMonsterList' | 'MessageSectionFinish' 
		| 'NotInFloor' | 'ConsumeMissionItem' | 'RaidFinishedAndTransfer' 
		| 'SubMissionFinishCnt' | 'InteractPropList' | 'StageWin'
	ParamType?: 'Equal' | 'ListContain'
	ParamInt1?: number
	ParamInt2?: number
	ParamInt3?: number
	ParamInt4?: number
	ParamInt5?: number
	ParamIntList?: number[]
	ParamStr1?: string
	ParamStr2?: string
	ParamStr3?: string
	ParamStr4?: string
	ParamStr5?: string
	ParamStrList?: string[]
	ParamItemList: ItemReference[]
	FinishActionList: FinishAction[]
	Progress: number
	IsBackTrack?: boolean
	CustomValueList?: unknown[]
	CustomValueReward?: unknown[]
	GroupIDList?: number[]
	RequiredNPCSeriesIDList?: unknown[]
	GotoParam?: number[]
	StoryLineIDList?: number[]
	StoryLineID?: number
	IgnoreVerseParamList?: number[]
	IsShow?: boolean
	IsShowStartHint?: 'New'
	WayPointType?: 'Prop' | 'NPC' | 'Monster'
	WayPointFloorID?: number
	WayPointGroupID?: number
	WayPointEntityID?: number
	IsTrackByMessage?: boolean
	MessageGroupID?: number
}

export interface FinishAction {
	FinishActionType: 
		'addMissionItem' | 'addMissionItem' | 'addRecoverMissionItem'
		| 'SetFloorSavedValue' | 'ChangeStoryLine' | 'MoveToAnchor' | 'Recover' 
		| 'ChangeLineup' | 'EnterEntryIfNotThere' | 'delSubMission'
		| 'delMission' | 'DisableMission' | 'SetGroupState' | 'SetCustomValue'
		| 'AddCustomValue' | 'ActivateAnchor' | 'delMissionItem'
	FinishActionPara: number[]
	FinishActionParaString?: string[]
}