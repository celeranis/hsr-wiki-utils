import type { HashReference } from '../TextMap.ts'

export interface InternalBlessingGroup {
	/** id */
	LIOICIOFLGL: number
	/** included groups and blessings */
	LEEMGFGKCMO: number[]
}

export interface InternalDUBlessingGroup {
	RogueBuffDrop: number[]
	TournMode: 'Permanent' | 'Tourn1' | 'Tourn2'
	RogueBuffGroupID: number
}

export type InternalBlessingCategory = 'Common' | 'Rare' | 'Legendary'

export interface InternalBlessing {
	MazeBuffID: number
	MazeBuffLevel: number
	RogueBuffType: number
	RogueBuffCategory: InternalBlessingCategory
	RogueBuffTag: number
	ExtraEffectIDList: number[]
	AeonID?: number
	RogueVersion: number
	UnlockIDList: number[]
	HandbookUnlockDesc: HashReference
	AeonCrossIcon?: string
	IsShow?: boolean
}

// export type InternalLayerMap<T> = { [id: string]: { [level: string]: T } }

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

export interface InternalBlessingType {
	RogueBuffType: number
	RogueBuffTypeName: HashReference
	RogueBuffTypeTitle: HashReference
	RogueBuffTypeSubTitle: HashReference
	RogueBuffTypeDecoName: string
	RogueBuffTypeIcon: string
	RogueBuffTypeSmallIcon: string
	RogueBuffTypeLargeIcon: string
}

export interface InternalRogueBonus {
	BonusID: number
	BonusEvent: number
	BonusTitle: HashReference
	BonusDesc: HashReference
	BonusTag: HashReference
	BonusIcon: string
}