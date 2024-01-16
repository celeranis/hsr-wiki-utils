import type { OutputList } from './Event.js';
import type { Dictionary } from './Shared.js';
import { TextMap } from './TextMap.js';
import { getFile } from './files/GameFile.js';
import { InternalEliteGroup, InternalMonster, InternalStage } from './files/Stage.js';

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

function percentChange(num: number) {
	return `${num > 1 ? '+' : ''}${Math.round((num - 1) * 100)}%`
}

const stages: Dictionary<InternalStage> = await getFile('ExcelOutput/StageConfig.json')
const monsters: Dictionary<InternalMonster> = await getFile('ExcelOutput/MonsterConfig.json')
const monsterTemplates: Dictionary<any> = await getFile('ExcelOutput/MonsterTemplateConfig.json')
const eliteGroups: Dictionary<InternalEliteGroup> = await getFile('ExcelOutput/EliteGroup.json')

export class Stage {
	static readonly stages = stages
	static readonly monsters = monsters
	static readonly monsterTemplates = monsterTemplates
	static readonly eliteGroups = eliteGroups

	id: number
	waves: Monster[][]
	name: string
	elite_group?: InternalEliteGroup
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
		this.elite_group = Stage.eliteGroups[stage.EliteGroup]
		this.stage_abilities = stage.StageAbilityConfig
		
		this.waves = stage.MonsterList.map(wave => {
			return Object.values(wave).map(id => {
				const monsterData = Stage.monsters[id]
				const monsterTemplate = Stage.monsterTemplates[id]
				
				const isElite = monsterTemplate.Rank == 'Elite' || monsterTemplate.Rank == 'LittleBoss' || monsterTemplate.Rank == 'BigBoss'
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
					atk_mult: monsterData.AttackModifyRatio?.Value * (isElite && this.elite_group?.AttackRatio?.Value || 1),
					def_mult: monsterData.DefenceModifyRatio?.Value * (isElite && this.elite_group?.DefenceRatio?.Value || 1),
					hp_mult: monsterData.HPModifyRatio?.Value * (isElite && this.elite_group?.HPRatio?.Value || 1),
					spd_mult: monsterData.SpeedModifyRatio?.Value * (isElite && this.elite_group?.SpeedRatio?.Value || 1),
					toughness_mult: monsterData.StanceModifyRatio?.Value * (isElite && this.elite_group?.StanceRatio?.Value || 1),
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