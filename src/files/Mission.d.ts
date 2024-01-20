import type { HashReference } from '../TextMap.ts'

export interface MissionParam {
	Type: string
	Value: number
}

export type MissionType = 'Branch' | 'Companion' | 'Main' | 'Daily' | 'Gap'

export interface InternalMainMission {
	MainMissionID: number
	Type: MissionType
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