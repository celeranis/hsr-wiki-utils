import type { Value } from '../Shared.ts'
import type { HashReference } from '../TextMap.ts'

export interface InternalDiceSurface {
	SurfaceID: number
	ItemID: number
	DescParam: Value<number>[]
	Icon: string
	Rarity: 1 | 2 | 3
	SlotList: number[]
	DiceActiveStage: number
	Sort: number
	ExtraDesc: number[]
	TagList: string[]
	UnlockDisplayID: number
	SurfaceName: HashReference
	SurfaceDesc: HashReference
	BranchLimitaion: number[]
}

export interface InternalDiceBranchValue {
	BranchID: number
	AeonID: number
	BranchEffectDesc: HashReference
	ParamList: Value<number>[]
}

export interface InternalDiceBranch {
	BranchID: number
	BranchTag: number
	BranchName: HashReference
	BranchIntroduction: HashReference
	EffectDesc: HashReference
	EffectExtraDesc: number[]
	PassiveEffectDesc: HashReference
	StartingEffectDescToast: HashReference
	EffectDescParam1: HashReference
	ParamValue1: Value<number>[]
	EffectDescParam2: HashReference
	ParamValue2: Value<number>[]
	EffectDescParam3: HashReference
	ParamValue3: Value<number>[]
	DefaultUltraSurface: number
	DefaultCommonSurfaceList: number[]
	SuggestiveSurfaceList: number[]
	BranchIcon: string
	DiceIcon: string
	DiceLightColor: string
	RecommendSurfaceList: number[]
}

export interface InternalMiscDisplay {
	DisplayID: number
	DisplayContent: HashReference
}