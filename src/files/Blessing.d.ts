import type { HashReference } from '../TextMap.ts'

export interface InternalBlessingGroup {
	/** id */
	JHOKDPADHFM: number
	/** included groups and blessings */
	ADJICNNJFEM: number[]
}

export interface InternalBlessing {
	MazeBuffID: number
	MazeBuffLevel: number
	RogueBuffType: number
	RogueBuffRarity: number
	RogueBuffTag: number
	ExtraEffectIDList: number[]
	AeonID?: number
	RogueVersion: number
	UnlockIDList: number[]
	HandbookUnlockDesc: HashReference
	AeonCrossIcon?: string
	IsShow?: boolean
}

export type InternalLayerMap<T> = { [id: string]: { [level: string]: T } }

export interface InternalBlessingBuff {
	ID: number
	BuffSeries: number
	BuffRarity: number
	Lv: number
	LvMax: number
	ModifierName: string
	InBattleBindingType: string
	InBattleBindingKey: string
	ParamList: { Value: number }[],
	BuffIcon: string
	BuffName: HashReference
	BuffDesc: HashReference
	BuffSimpleDesc: HashReference
	BuffDescBattle: HashReference
	BuffEffect: string
	MazeBuffType: string
}