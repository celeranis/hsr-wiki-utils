import { Value } from '../Shared.ts'
import { HashReference } from '../TextMap.ts'

export type ScepterFuncType = 'Common' | 'SP' | 'ActionDelay'
export type ScepterStyleType = 'Dot' | 'Follow' | 'Ultimate' | 'Break'
export type ScepterLimitRangeType = 'Eject' | 'Spread' | 'AOE' | 'Concentrate' | 'None'
export type ScepterEffectType = 'Stack' | 'Turn' | 'None'
export type ScepterUnitCategory = 'Common' | 'Ultra'
export type ScepterUnitSlot = 'Active' | 'Attach' | 'Passive'

export interface InternalScepter {
	ScepterID: number
	ScepterLevel: number
	LockMagicUnit: any[]
	TrenchCount: {
		Active: number
		Attach: number
		Passive: number
	}
	UnlockID?: number
	FuncType: ScepterFuncType
	StyleType: ScepterStyleType
	ScepterBasicPower: Value<number>
	StaffMazeBuffID: number
	LimitRangeType: ScepterLimitRangeType
	EffectTypeList: ScepterEffectType[]
}

export interface InternalScepterDisplay {
	ScepterID: number
	ScepterIconPath: string
	ScepterFigurePath: string
	ScepterName: HashReference
	ScepterBGDesc: HashReference
	ScepterTriggerDesc: HashReference
}

export interface InternalUnit {
	MagicUnitID: number
	MagicUnitLevel: number
	MagicUnitCategory: ScepterUnitCategory
	MagicUnitType: ScepterUnitSlot
	UnlockID?: number
	MagicUnitMazeBuffID: number
	StyleType?: ScepterStyleType
	MagicUnitDesc: HashReference
	MagicUnitSimpleDesc: HashReference
	ExtraEffectID: number[]
	FuncType?: ScepterFuncType
	AttachRangeTypeList: ScepterLimitRangeType[]
	EffectTypeList: ScepterEffectType[]
	SpecialType?: 'Manage'
}

export interface InternalUnitDisplay {
	MagicUnitID: number
	MagicUnitIcon: string
	MagicUnitName: HashReference
}