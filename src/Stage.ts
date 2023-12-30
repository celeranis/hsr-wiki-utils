import { readFileSync } from 'fs';
import config from '../config.json' with { type: "json" };
import type { OutputList } from './Event.js';
import type { AttackType, Value } from './Shared.js';
import { HashReference, TextMap } from './TextMap.js';

export type EnemyType = 'MinionLv2' | 'Elite' | 'LittleBoss' | 'BigBoss' | 'Minion'

export interface Monster {
	name: string
	id: number
	type: EnemyType
	atk_mult: number
	def_mult: number
	hp_mult: number
	spd_mult: number
	toughness_mult: number
	toughness_add?: number
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

function percentChange(num: number) {
	return `${num > 1 ? '+' : ''}${Math.round((num - 1) * 100)}%`
}

export class Stage {
	static stages: { [id: string]: InternalStage } = JSON.parse(readFileSync(`./versions/${config.target_version}/StageConfig.json`).toString())
	static monsters: { [id: string]: InternalMonster } = JSON.parse(readFileSync(`./versions/${config.target_version}/MonsterConfig.json`).toString())
	static monsterTemplates: { [id: string]: any } = JSON.parse(readFileSync(`./versions/${config.target_version}/MonsterTemplateConfig.json`).toString())

	id: number
	waves: Monster[][]
	name: string
	elite_group: number
	type: 'Normal' | 'Bug' | 'Complete' = 'Normal'
	stage_abilities: string[]
	elite: boolean = false
	elite_count: number = 0
	
	static exists(id: number | string): InternalStage | undefined {
		return Stage.stages[id]
	}
	
	constructor(id: number | string) {
		const stage = Stage.stages[id]
		if (!stage) {
			throw new Error(`No stage found for id ${id}`)
		}

		this.id = stage.StageID
		this.name = TextMap.default.getText(stage.StageName)
		this.elite_group = stage.EliteGroup
		this.stage_abilities = stage.StageAbilityConfig
		
		this.waves = stage.MonsterList.map(wave => {
			return Object.values(wave).map(id => {
				const monsterData = Stage.monsters[id]
				const monsterTemplate = Stage.monsterTemplates[id]
				
				if (monsterTemplate.Rank == 'Elite' || monsterTemplate.Rank == 'LittleBoss' || monsterTemplate.Rank == 'BigBoss') {
					const name = TextMap.default.getText(monsterData.MonsterName)
					if (name.includes('(Bug)')) {
						this.type = 'Bug'
					} else if (name.includes('(Complete)')) {
						this.type = 'Complete'
					}
					this.elite_count++
					this.elite = true
				}
				
				return {
					id: monsterData.MonsterID,
					name: TextMap.default.getText(monsterData.MonsterName),
					type: monsterTemplate.Rank,
					atk_mult: monsterData.AttackModifyRatio?.Value,
					def_mult: monsterData.DefenceModifyRatio?.Value,
					hp_mult: monsterData.HPModifyRatio?.Value,
					spd_mult: monsterData.SpeedModifyRatio?.Value,
					toughness_mult: monsterData.StanceModifyRatio?.Value,
					toughness_add: monsterData.StanceModifyValue?.Value,
				} as Monster
			})
		})
	}
	
	generateStatChanges(monster: Monster): string[] {
		const statChanges: string[] = []
		if (monster.atk_mult != 1) {
			statChanges.push(`${percentChange(monster.atk_mult)} ATK`)
		}
		if (monster.def_mult != 1) {
			statChanges.push(`${percentChange(monster.def_mult)} DEF`)
		}
		if (monster.hp_mult != 1) {
			statChanges.push(`${percentChange(monster.hp_mult)} Max HP`)
		}
		if (monster.spd_mult != 1) {
			statChanges.push(`${percentChange(monster.spd_mult)} SPD`)
		}
		if (monster.toughness_mult != 1) {
			statChanges.push(`${percentChange(monster.toughness_mult)} Max Toughness`)
		}
		if (monster.toughness_add) {
			statChanges.push(`${monster.toughness_add > 0 ? '+' : ''}${monster.toughness_add} Max Toughness`)
		}
		return statChanges
	}
	
	generateMonsterListWave(wave: Monster[]): string {
		const monsterList = new Map<string, number>()
		for (const monster of wave) {
			const statChanges = this.generateStatChanges(monster)
			const key = `${monster.name}*<<NUM>>/${statChanges.join(', ')}`
			monsterList.set(key, (monsterList.get(key) || 0) + 1)
		}
		return `{{Enemy List|${[...monsterList.entries()].map(([str, amnt]) => str.replaceAll('<<NUM>>', amnt.toString())).join(';')}}}`
	}
	
	generateEnemyList(): OutputList | string {
		if (this.waves.length == 1) {
			return this.generateMonsterListWave(this.waves[0])
		} else {
			const list: string[] = []
			for (const [i, wave] of this.waves.entries()) {
				list.push(`Wave ${i + 1}: ${this.generateMonsterListWave(wave)}`)
			}
			return list
		}
	}
}