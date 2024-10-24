import { Value } from '../Shared.ts'
import type { HashReference } from '../TextMap.ts'

export interface InternalCurio {
	MiracleID: number
	MiracleDisplayID: number
	UnlockIDList: number[]
	UseEffect: HashReference
	HandbookMiracleID?: number
	UnlockHandbookMiracleID?: number
	MiracleDesc?: HashReference
	DescParamList?: Value<number>[]
}

export interface InternalCurioDisplay {
	MiracleDisplayID: number
	MiracleName: HashReference
	MiracleDesc: HashReference
	DescParamList: Value<number>[]
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
	MiracleCategory: 'Common' | 'Rare' | 'Legendary' | 'Negative' | 'Hex'
}

export interface InternalUNDCurio {
	MiracleID: number
	MiracleDisplayID: number
	UnlockHandbookMiracleID: number
	MiracleDesc: HashReference
	DescParamList: Value<number>[]
	ExtraEffect: number[]
}