import { Value } from '../Shared.ts'
import { HashReference } from '../TextMap.ts'

export interface InternalEquationData {
	FormulaID: number
	TournMode: 'Tourn1'
	MainBuffTypeID: number
	MainBuffNum: number
	SubBuffTypeID?: number
	SubBuffNum?: number
	FormulaCategory: 'PathEcho' | 'Rare' | 'Epic' | 'Legendary'
	MazeBuffID: number
	FormulaDisplayID: number
	FormulaIcon: string
	FormulaSubIcon: string
	UltraFormulaIcon: string
	IsInHandbook: boolean
	FormulaStoryJson: string
	UnlockDisplayID: number
}

export interface InternalEquationDisplay {
	FormulaDisplayID: number
	FormulaTypeDisplay: number
	FormulaStory: HashReference
	ExtraEffect: number[]
}

export interface InternalExtraEffect {
	ExtraEffectID: number
	ExtraEffectName: HashReference
	ExtraEffectDesc: HashReference
	DescParamList: Value<number>[]
	ExtraEffectIconPath: string
	ExtraEffectType: number
}