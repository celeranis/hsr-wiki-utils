import { HashReference } from '../TextMap.ts'

export type TutorialShowType = 'Hide' | 'AutoShow' | 'NonTutorial' | 'AutoShowInMaze'

export interface InternalTutorialType {
	TutorialType?: number
	MessageIconPath: string
	MessageTitle: HashReference
}

export interface InternalTutorialGroup {
	GroupID: number
	TutorialGuideIDList: number[]
	TutorialType: number
	CanReview?: boolean
	TutorialShowType: TutorialShowType
	Order: number
	// we won't be using these here
	TriggerParams: unknown[]
	FinishTriggerParams: unknown[]
	MessageText: HashReference
	RewardID: number
}

export interface InternalTutorialData {
	ID: number
	ImagePath: string
	DescText: HashReference
}