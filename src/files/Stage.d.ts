import type { AttackType, Value } from '../Shared.ts'
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
	CFNMGGCLFHN: string
	/** Entry value */
	JCFBPDLNMLH: string
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
	DamageTypeResistance: {
		DamageType: AttackType
		Value: Value<number>
	}
	AbilityNameList: unknown[]
	OverrideAIPath: string

	AttackModifyRatio: Value<number>
	DefenceModifyRatio: Value<number>
	HPModifyRatio: Value<number>
	SpeedModifyRatio: Value<number>
	StanceModifyRatio: Value<number>
	StanceModifyValue?: Value<number>
}