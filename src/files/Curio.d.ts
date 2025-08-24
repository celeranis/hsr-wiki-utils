import { Value } from '../Shared.ts'
import type { HashReference } from '../TextMap.ts'

export type InternalCurioRarity = 'Common' | 'Rare' | 'Legendary' | 'Negative' | 'Hex'

export interface InternalCurio {
	MiracleID: number
	MiracleDisplayID?: number
	TournMode?: 'Tourn1' | 'Tourn2'
	HandbookMiracleID?: number
	UnlockHandbookMiracleID?: number
	MiracleEffectDisplayID: number
	MiracleCategory?: InternalCurioRarity
}

export interface InternalCurioDisplay {
	MiracleDisplayID: number
	MiracleName: HashReference
	MiracleDesc: HashReference
	DescParamList: Value<number>[]
	ExtraEffect?: number[]
	MiracleBGDesc: HashReference
	MiracleTag: HashReference
	MiracleIconPath: string
	MiracleFigureIconPath: string
}

export interface InternalIndexCurio {
	MiracleHandbookID?: number
	HandbookMiracleID?: number
	MiracleReward: number
	MiracleTypeList: number[]
	MiracleDisplayID: number
	Order: number
	MiracleCategory: InternalCurioRarity
}

export interface InternalUNDCurio {
	MiracleID: number
	MiracleDisplayID: number
	UnlockHandbookMiracleID: number
	MiracleDesc: HashReference
	DescParamList: Value<number>[]
	ExtraEffect: number[]
}

export interface InternalCurioEffectDisplay {
	MiracleEffectDisplayID: number
	MiracleDesc: HashReference
	DescParamList: Value<number>[]
	ExtraEffect: number[]
}