import { AttackType, Dictionary, Value } from '../Shared.ts'
import { HashReference } from '../TextMap.ts'

export type InternalCocoonType = 'TYPE_NORMAL' | 'TYPE_RELIC' | 'TYPE_WEEK'
export type InternalCocoonFarmType = 
	| 'COCOON_AVATAR_EXP' | 'COCOON_EQUIPMENT_EXP' | 'COCOON_COIN'
	| 'COCOON2' | 'COCOON3' | 'RELIC'

export interface InternalCocoon {
	ID: number
	WorldLevel: number
	PropID: number
	CocoonType: InternalCocoonType
	MappingInfoID: number
	StageID?: number
	StageIDList: number[]
	BuffDesc: HashReference
	ParamList: Value<number>[]
	DropList: number[]
	StaminaCost: number
	MaxWave: number
	OpenDate: unknown[]
	DamageType: AttackType[]
	AutoObtainDamageType?: boolean
	FarmType: InternalCocoonFarmType
}

export interface InternalFarmElement {
	ID: number
	WorldLevel: number
	MappingInfoID: number
	DropList: number[]
	StaminaCost: number
	AutoObtainDamageType?: boolean
	DamageType: AttackType[]
	BuffDesc: HashReference
	ParamList: Value<number>[]
	StageID: number
	StageIDList?: number[]
}

export interface GameplayGuideEntry {
	ID: number
	Name: HashReference
	IconPath: string
	TabIconPath: string
	MapEntranceID: number
	UnlockMission: number[]
	TabID: number
	RelatedID: number
	OverrideShowCondition: unknown[]
}

export type DomainConfig<T = InternalCocoon | InternalFarmElement> = Dictionary<Dictionary<T>>
export type CocoonConfig = DomainConfig<InternalCocoon>
export type FarmElementConfig = DomainConfig<InternalFarmElement>