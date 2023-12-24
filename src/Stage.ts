import { readFileSync } from 'fs';
import config from '../config.json' with { type: "json" };
import type { AttackType, Value } from './Shared.js';
import { HashReference, TextMap } from './TextMap.js';

export type EnemyType = 'MinionLv2' | 'Elite' | 'LittleBoss' | 'BigBoss' | 'Minion'

export interface Monster {
	name: string
	id: number
	type: EnemyType
	atk_mult?: number
	def_mult?: number
	hp_mult?: number
	spd_mult?: number
	stance_mult?: number
}

export interface StageInfo {
	id: number
	waves: Monster[][]
	name: string
	elite_group: number
	type: 'Normal' | 'Bug' | 'Complete'
	stage_abilities: string[]
	elite: boolean
	elite_count: number
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
}

export class Stage {
	static stages: { [id: string]: InternalStage } = JSON.parse(readFileSync(`./versions/${config.target_version}/StageConfig.json`).toString())
	static monsters: { [id: string]: InternalMonster } = JSON.parse(readFileSync(`./versions/${config.target_version}/MonsterConfig.json`).toString())
	static monsterTemplates: { [id: string]: any } = JSON.parse(readFileSync(`./versions/${config.target_version}/MonsterTemplateConfig.json`).toString())
	
	static infoFor(id: number | string): StageInfo {
		const stage = Stage.stages[id]
		
		let elite_count = 0
		let type: 'Normal' | 'Bug' | 'Complete' = 'Normal'
		const waves: Monster[][] = stage.MonsterList.map(wave => {
			return Object.values(wave).map(id => {
				const monsterData = Stage.monsters[id]
				const monsterTemplate = Stage.monsterTemplates[id]
				
				if (monsterTemplate.Rank == 'Elite' || monsterTemplate.Rank == 'LittleBoss' || monsterTemplate.Rank == 'BigBoss') {
					const name = TextMap.default.getText(monsterData.MonsterName)
					if (name.includes('(Bug)')) {
						type = 'Bug'
					} else if (name.includes('(Complete)')) {
						type = 'Complete'
					}
					elite_count++
				}
				
				return {
					id: monsterData.MonsterID,
					name: TextMap.default.getText(monsterData.MonsterName),
					type: monsterTemplate.Rank,
					atk_mult: monsterData.AttackModifyRatio?.Value,
					def_mult: monsterData.DefenceModifyRatio?.Value,
					hp_mult: monsterData.HPModifyRatio?.Value,
					spd_mult: monsterData.SpeedModifyRatio?.Value,
					stance_mult: monsterData.StanceModifyRatio?.Value
				} as Monster
			})
		})
		
		return {
			id: stage.StageID,
			name: TextMap.default.getText(stage.StageName),
			waves,
			elite_group: stage.EliteGroup,
			stage_abilities: stage.StageAbilityConfig,
			type,
			elite: /*(stage.StageConfigData.find(dat => dat.CFNMGGCLFHN == '_IsEliteBattle')?.JCFBPDLNMLH == '1') || */elite_count > 0,
			elite_count
		}
	}
}