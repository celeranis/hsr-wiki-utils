import { HashReference } from '../TextMap.ts'

export type BoardEncounterType = 'Simple' | 'RandomOptional' | 'Optional'
export type BoardEncounterOptionType = 'Common' | 'Negative' | 'Positive' | 'Random'

export interface InternalBoardEncounter {
	EventID: number
	Type: BoardEncounterType
	EventName: HashReference
	EventContent: HashReference
	PicPath: string
	EventOptionIDList: number[]
	AutoTriggerEffectIDList: number[]
	IsDataReport?: boolean
}

export interface InternalBoardEncounterOption {
	EventOptionID: number
	OptionType: BoardEncounterOptionType
	DiceScoreRequirement?: number
	EffectIDList: number[]
	OptionContent: HashReference
	TextDisplayParam1?: number
	EffectContentText: string
	EffectContent: HashReference
	IsHideEffect?: boolean
	OptionBubbleTalk: HashReference
	NextOptionList: number[]
}