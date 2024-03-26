import type { HashReference } from '../TextMap.ts'

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