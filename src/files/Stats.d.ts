import { AttackType, Value } from '../Shared.ts'
import { HashReference } from '../TextMap.ts'

export type AvatarPropertyType = 
	| 'MaxHP' | 'Attack' | 'Defence' | 'Speed' | 'CriticalChance' | 'CriticalDamage'
	| 'BreakDamageAddedRatio' | 'BreakDamageAddedRatioBase' | 'HealRatio'
	| 'MaxSP' | 'SpecialMaxSP' | 'SPRatio' | 'StatusProbability' | 'StatusResistance'
	| 'CriticalChanceBase' | 'CriticalDamageBase' | 'HealRatioBase' | 'StanceBreakAddedRatio'
	| 'SPRatioBase' | 'StatusProbabilityBase' | 'StatusResistanceBase' 
	| `${AttackType}AddedRatio` | `${AttackType}Resistance` | `${AttackType}ResistanceDelta`
	| 'BaseHP' | 'HPDelta' | 'HPAddedRatio' | 'BaseAttack' | 'AttackDelta'
	| 'AttackAddedRatio' | 'BaseDefence' | 'DefenceDelta' | 'DefenceAddedRatio'
	| 'BaseSpeed' | 'HealTakenRatio' | 'SpeedDelta' | 'BaseAggro'
	
	| 'Toughness' | 'DMGBoost' | 'HPValue'

export interface AvatarProperty {
	PropertyType: AvatarPropertyType
	PropertyName: HashReference
	PropertyNameSkillTree: HashReference
	PropertyNameRelic: HashReference
	PropertyNameFilter: HashReference
	PropertyInstructionID?: number
	IsDisplay?: boolean
	isBattleDisplay?: boolean
	MainRelicFilter?: number
	SubRelicFilter?: number
	PropertyClassify?: number
	Order: number
	IconPath: string
	custom?: boolean
}

export interface InternalStatModifier {
	PropertyType: AvatarPropertyType
	Value: Value<number>
}

export type AvatarPropertyConfig = Record<AvatarPropertyType, AvatarProperty>