import type { AttackType, Dictionary, Value } from '../Shared.ts'
import type { HashReference } from '../TextMap.ts'

export interface InternalEliteGroup {
	EliteGroup: number
	AttackRatio: Value<number>
	DefenceRatio: Value<number>
	HPRatio: Value<number>
	SpeedRatio: Value<number>
	StanceRatio: Value<number>
}

export interface InternalConfigEntry {
	/** Entry name */
	DJBGPLLGOEF: string
	/** Entry value */
	BOANKOCFAIM: string
}

export interface InternalMonsterWave {
	[key: `Monster${number}`]: number
}

export interface InternalStage {
	StageID: number
	StageType: string
	StageName: HashReference
	HardLevelGroup: number
	Level: number
	EliteGroup: number
	LevelGraphPath: string
	StageAbilityConfig: string[]
	SubLevelGraphs: unknown[]
	StageConfigData: InternalConfigEntry[]
	MonsterList: InternalMonsterWave[]
	LevelLoseCondition: unknown[]
	LevelWinCondition: unknown[]
	ForbidExitBattle: boolean
	TrialAvatarList: unknown[]
}

export interface TypeResData {
	DamageType: AttackType
	Value: Value<number>
}

export interface InternalMonster {
	MonsterID: number
	MonsterTemplateID: number
	MonsterName: HashReference
	MonsterIntroduction: HashReference
	MonsterBattleIntroduction: HashReference
	HardLevelGroup: number
	EliteGroup: number
	SkillList: number[]
	CustomValueTags: string[]
	StanceWeakList: AttackType[]
	DamageTypeResistance: TypeResData[]
	AbilityNameList: unknown[]
	OverrideAIPath: string

	AttackModifyRatio: Value<number>
	DefenceModifyRatio: Value<number>
	HPModifyRatio: Value<number>
	SpeedModifyRatio: Value<number>
	SpeedModifyValue?: Value<number>
	StanceModifyRatio: Value<number>
	StanceModifyValue?: Value<number>
}

export type EnemyType = 'MinionLv2' | 'Elite' | 'LittleBoss' | 'BigBoss' | 'Minion'

export interface InternalMonsterTemplate {
	MonsterTemplateID: number
	TemplateGroupID: number
	AtlasSortID?: number
	MonsterName: HashReference
	MonsterCampID?: number
	MonsterBaseType: string
	Rank: EnemyType
	JsonConfig: string
	IconPath: string
	RoundIconPath: string
	ImagePath: string
	PrefabPath: string
	ManikinPrefabPath?: string
	ManikinConfigPath?: string
	ManikinImagePath: string
	NatureID: number
	AttackBase: Value<number>
	DefenceBase: Value<number>
	HPBase: Value<number>
	SpeedBase: Value<number>
	StanceBase?: Value<number>
	CriticalDamageBase?: Value<number>
	StatusResistanceBase?: Value<number>
	MinimumFatigueRatio?: Value<number>
	AIPath: string
	StanceCount: number
	StanceType?: AttackType
	InitialDelayRatio: Value<number>
	AISkillSequence: unknown[]
	NPCMonsterList: number[]
}

export interface InternalMonsterCamp {
	ID: number
	SortID: number
	Name: HashReference
	IconPath: string
	CampType: string
}

export interface HardLevelGroupEntry {
	HardLevelGroup: number
	Level: number
	AttackRatio: Value<number>
	DefenceRatio: Value<number>
	HPRatio: Value<number>
	SpeedRatio: Value<number>
	StanceRatio: Value<number>
	CombatPowerList: Value<number>[]
	StatusProbability?: Value<number>
	StatusResistance?: Value<number>
}
export type HardLevelGroup = Dictionary<HardLevelGroupEntry>

export interface InternalMonsterSkill {
	SkillID: number
	SkillName: HashReference
	IconPath: string
	SkillDesc: HashReference
	SkillTypeDesc: HashReference
	SkillTag: HashReference
	PhaseList: number[]
	ExtraEffectIDList: number[]
	DamageType: AttackType
	SkillTriggerKey: string
	SPHitBase: Value<number>
	DelayRatio: Value<number>
	ParamList: Value<number>[]
	AttackType?: string
	AI_CD?: number
	AI_ICD?: number
}

export interface StageInfiniteGroupEntry {
	WaveGroupID: number
	WaveIDList: number[]
}

export interface StageInfiniteMonsterGroupEntry {
	InfiniteMonsterGroupID: number
	EliteGroup?: number
	MonsterList: number[]
}

