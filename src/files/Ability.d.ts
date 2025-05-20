import { AttackType, Value } from '../Shared.ts'
import { HashReference } from '../TextMap.ts'
import { ItemReference } from './Item.js'

export interface AvatarSkillData {
	SkillID: number
	SkillName: HashReference
	SkillTag: HashReference
	SkillTypeDesc: HashReference
	Level: number
	MaxLevel: number
	SkillTriggerKey: string
	SkillIcon: string
	UltraSkillIcon: string
	LevelUpCostList?: unknown[]
	SkillDesc: HashReference
	RatedSkillTreeID?: number[]
	RatedRankID?: number[]
	ExtraEffectIDList: number[]
	SimpleExtraEffectIDList: number[]
	ShowStanceList: Value<number>[]
	ShowDamageList: Value<number>[]
	ShowHealList: Value<number>[]
	InitCoolDown: number
	CoolDown: number
	StanceDamageDisplay: number
	SPMultipleRatio: Value<number>
	BPNeed: Value<number>
	DelayRatio: Value<number>
	ParamList: Value<number>[]
	SimpleParamList: Value<number>[]
	StanceDamageType: AttackType
	AttackType: string
	SkillEffect: string
}

export interface AvatarRankData {
	RankID: number
	Rank: number
	Trigger: HashReference
	Name: string
	Desc: string
	ExtraEffectIDList: number[]
	IconPath: string
	SkillAddLevelList?: Record<string, number>
	RankAbility: string[]
	UnlockCost: ItemReference[]
	Param: Value<number>[]
}