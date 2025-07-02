import { LazyData, getExcelFile, getFile } from './files/GameFile.js';
import type { InternalPlaneEvent } from './files/graph/MapData.js';
import { EnemyType, HardLevelGroupEntry, InternalEliteGroup, InternalMonster, InternalMonsterCamp, InternalMonsterSkill, InternalMonsterTemplate, InternalStage, StageInfiniteGroupEntry, StageInfiniteMonsterGroupEntry, TypeResData } from './files/Stage.js';
import { diffn, tpercent, type AttackType, type Dictionary } from './Shared.js';
import { Stat } from './Stats.js';
import { TextMap, textMap } from './TextMap.js';
import { WeirdKey } from './WeirdKey.js';

export interface EliteGroup {
	id: number
	atk_ratio: number
	def_ratio: number
	hp_ratio: number
	spd_ratio: number
	toughness_ratio: number
}

export interface ScalingEntry {
	atk: number
	def: number
	hp: number
	spd: number
	toughness: number
	ehr: number
	effect_res: number
}

export const StageConfig = await getExcelFile<InternalStage>('ExcelOutput/StageConfig.json', 'StageID')
export const MonsterConfig = await getExcelFile<InternalMonster>('ExcelOutput/MonsterConfig.json', 'MonsterID')
export const MonsterTemplateConfig = await getExcelFile<InternalMonsterTemplate>('ExcelOutput/MonsterTemplateConfig.json', 'MonsterTemplateID')
export const PlaneEvent = await getExcelFile<InternalPlaneEvent>('PlaneEvent.json', 'EventID')
export const StageInfiniteGroup = await getExcelFile<StageInfiniteGroupEntry>('StageInfiniteGroup.json', 'WaveGroupID')
export const StageInfiniteMonsterGroup = await getExcelFile<StageInfiniteMonsterGroupEntry>('StageInfiniteMonsterGroup.json', 'InfiniteMonsterGroupID')

export const eliteGroups: Record<number, EliteGroup> = {}
for (const rawGroup of Object.values(await getExcelFile<InternalEliteGroup>('EliteGroup.json', 'EliteGroup'))) {
	eliteGroups[rawGroup.EliteGroup] = {
		id: rawGroup.EliteGroup,
		atk_ratio: rawGroup.AttackRatio?.Value ?? 1,
		def_ratio: rawGroup.DefenceRatio?.Value ?? 1,
		hp_ratio: rawGroup.HPRatio?.Value ?? 1,
		spd_ratio: rawGroup.SpeedRatio?.Value ?? 1,
		toughness_ratio: rawGroup.StanceRatio?.Value ?? 1,
	}
}

export interface StageParams {
	_Wave?: string
	_IsEliteBattle?: '0' | '1'
	_StageInfiniteGroup?: string
	_CreateBattleEvent?: string
	_CreateBattleActionEvent?: string
	_BattleTarget?: string
	_BindingMazeBuff?: string
	_BGM?: string
	_EnsureTeamAliveKey?: string
}

export class Stage {
	id: number
	waves: EnemyInstance[][]
	name: string
	elite_group?: EliteGroup
	stage_type: string
	type: 'Normal' | 'Bug' | 'Complete' = 'Normal'
	stage_abilities: string[]
	elite: boolean = false
	level: number
	params: StageParams
	elite_count: number = 0
	
	static exists(id: number | string): InternalStage | undefined {
		return StageConfig[id]
	}
	
	static fromPlaneEvent(id: number | string) {
		if (!PlaneEvent[id]) return undefined
		return new this(PlaneEvent[id].StageID)
	}
	
	[Symbol.for('nodejs.util.inspect.custom')]() {
		return this.waves.map((wave, i) => `Wave ${i + 1}:\n\t${wave.map(monster => `${monster.name} (${monster.listStatChanges().join(', ')})`).join('\n\t')}`).join('\n')
	}
	
	constructor(id: number | string) {
		const stage = StageConfig[id]
		if (!stage) {
			throw new Error(`No stage found for id ${id}`)
		}

		this.id = stage.StageID
		this.stage_type = stage.StageType
		this.name = TextMap.default.getText(stage.StageName)
		this.elite_group = eliteGroups[stage.EliteGroup]
		this.stage_abilities = stage.StageAbilityConfig
		this.level = stage.Level
		this.params = Object.fromEntries(stage.StageConfigData.map(entry => [entry[WeirdKey.get('StageConfigKey')], entry[WeirdKey.get('StageConfigValue')]]))
		
		if (this.params._StageInfiniteGroup) {
			this.waves = StageInfiniteGroup[this.params._StageInfiniteGroup].WaveIDList.map(waveId => {
				const wave = StageInfiniteMonsterGroup[waveId]
				return wave?.MonsterList?.filter(id => id).map(enemyId => {
					const enemy = EnemyInstance.fromIdLeveled(enemyId, this.level)
					if (this.elite_group) {
						enemy.stage_elite_group_ids.push(this.elite_group.id)
					}
					if (wave.EliteGroup && this.elite_group?.id != wave.EliteGroup) {
						enemy.stage_elite_group_ids.push(wave.EliteGroup)
					}
					
					return enemy
				}) ?? [] // TODO: temporary
			})
		} else {
			this.waves = stage.MonsterList.map(wave => {
				return Object.values(wave).filter(id => id).map(id => {
					const enemy = EnemyInstance.fromIdLeveled(id, this.level)
					if (this.elite_group) {
						enemy.stage_elite_group_ids.push(this.elite_group.id)
					}

					if (enemy.isElite()) {
						if (enemy.name.includes('(Bug)')) {
							this.type = 'Bug'
						} else if (enemy.name.includes('(Complete)')) {
							this.type = 'Complete'
						}
						this.elite_count++
						this.elite = true
					}

					return enemy
				})
			})
		}
	}
	
	getWaveEnemyList(wave: EnemyInstance[]): string {
		const monsterList = new Map<string, number>()
		for (const enemy of wave) {
			const key = enemy.asEnemyListEntry('<<NUM>>')
			monsterList.set(key, (monsterList.get(key) || 0) + 1)
		}
		return `{{Enemy List|${[...monsterList.entries()].map(([str, amnt]) => str.replaceAll('<<NUM>>', amnt.toString())).join('; ')}}}`
	}
	
	asEnemyLists(): string[] {
		if (this.waves.length == 1) {
			return [this.getWaveEnemyList(this.waves[0])]
		} else {
			const list: string[] = []
			for (const [i, wave] of this.waves.entries()) {
				list.push(`Wave ${i + 1}: ${this.getWaveEnemyList(wave)}`)
			}
			return list
		}
	}
	
	asCardList(noLevels?: boolean): string[] {
		return this.waves.map(wave => `{{Card List|type=Enemy|show_caption=1|delim=;|${wave.map(enemy => enemy.asCardListEntry(noLevels)).join('; ')}}}`)
	}
}

export const enum ENEMY_RANK {
	NORMAL = 1,
	ELITE = 2,
	BOSS = 3,
	ECHO_OF_WAR = 4,
}

const RANK_MAP: Record<EnemyType, ENEMY_RANK> = {
	Minion: ENEMY_RANK.NORMAL,
	MinionLv2: ENEMY_RANK.NORMAL,
	Elite: ENEMY_RANK.ELITE,
	LittleBoss: ENEMY_RANK.ELITE,
	BigBoss: ENEMY_RANK.ECHO_OF_WAR
}

interface EnemyFaction {
	data: InternalMonsterCamp
	id: number
	sortId: number
	name: string
	name_hash: number | bigint
	icon: string
}

export class EnemyTemplate {
	static readonly faction_data = new LazyData<Dictionary<InternalMonsterCamp>>('ExcelOutput/MonsterCamp.json')
	
	template_id: number
	template_name: string
	name: string
	name_hash: number | bigint
	data_bank_sort?: number
	faction_id?: number
	rank: ENEMY_RANK
	config_path: string
	
	icon: string
	image: string
	
	get base_atk(): number {
		return this.template_data.AttackBase?.Value ?? 1
	}
	get base_def(): number {
		return this.template_data.DefenceBase?.Value ?? 1
	}
	get base_hp(): number {
		return this.template_data.HPBase?.Value ?? 1
	}
	get base_spd(): number {
		return this.template_data.SpeedBase?.Value ?? 0
	}
	get base_toughness(): number {
		return this.template_data.StanceBase?.Value ?? 0
	}
	get base_effect_res(): number {
		return this.template_data.StatusResistanceBase?.Value ?? 0
	}
	get base_crit_dmg(): number {
		return this.template_data.CriticalDamageBase?.Value ?? 0
	}
	get initial_delay(): number {
		return this.template_data.InitialDelayRatio?.Value ?? 0
	}
	get ehr(): number {
		return 0
	}
	toughness_count: number
	
	toughness_dmg_type?: AttackType
	
	ai_path?: string
	skill_sequence: unknown[]
	npc_monster_ids: number[]
	
	constructor(public template_data: InternalMonsterTemplate) {
		this.template_id = template_data.MonsterTemplateID
		this.template_name = textMap.getText(template_data.MonsterName)
		this.name = this.template_name
		this.name_hash = template_data.MonsterName?.Hash
		this.data_bank_sort = template_data.AtlasSortID
		this.faction_id = template_data.MonsterCampID
		this.rank = RANK_MAP[template_data.Rank] || ENEMY_RANK.NORMAL
		
		this.config_path = template_data.JsonConfig
		this.icon = template_data.IconPath
		this.image = template_data.ImagePath
		
		this.toughness_count = template_data.StanceCount ?? 0
		this.toughness_dmg_type = template_data.StanceType
		
		this.ai_path = template_data.AIPath
		this.skill_sequence = template_data.AISkillSequence ?? []
		this.npc_monster_ids = template_data.NPCMonsterList ?? []
	}

	static fromId(templateId: number | string) {
		return new this(MonsterTemplateConfig[templateId])
	}
	
	async getFaction(): Promise<EnemyFaction | undefined> {
		if (!this.faction_id) return undefined
		const data = (await EnemyTemplate.faction_data.get())[this.faction_id]
		
		return {
			data,
			id: data.ID,
			sortId: data.SortID,
			name: textMap.getText(data.Name),
			name_hash: data.Name?.Hash,
			icon: data.IconPath
		}
	}
	
	isElite(): boolean {
		return this.rank >= ENEMY_RANK.ELITE
	}
	
	asEnemyTemplate() {
		return `{{Enemy|${this.template_name}${this.name != this.template_name ? `|text=${this.name}` : ''}}}`
	}
	
	asCard() {
		return `{{Card|type=Enemy|${this.template_name}${this.name != this.template_name ? `|text=${this.name}` : ''}|show_caption=1}}`
	}

	asCardListEntry() {
		return this.template_name
			+ (this.name != this.template_name ? `{ caption = ${this.name} }` : '')
	}
	
	asEnemyListEntry(count: number | string) {
		return `${this.template_name}*${count}`
	}
}

const enemyScaling: Dictionary<ScalingEntry[]> = {}
for (const entry of Object.values(await getFile<HardLevelGroupEntry[]>('ExcelOutput/HardLevelGroup.json'))) {
	const stats = enemyScaling[entry.HardLevelGroup] ??= [] as ScalingEntry[]
	stats[entry.Level] = {
		atk: entry.AttackRatio?.Value ?? 1,
		def: entry.DefenceRatio?.Value ?? 1,
		hp: entry.HPRatio?.Value ?? 1,
		spd: entry.SpeedRatio?.Value ?? 1,
		toughness: entry.StanceRatio?.Value ?? 1,
		ehr: entry.StatusProbability?.Value ?? 0,
		effect_res: entry.StatusResistance?.Value ?? 0
	}
}

export class Enemy extends EnemyTemplate {
	name: string
	id: number
	intro: string
	battle_intro: string
	
	scaling_type: number
	elite_group_id: number
	skill_list: number[]
	value_tags: string[]
	weakness_types: AttackType[]
	
	physical_res: number = 0
	fire_res: number = 0
	wind_res: number = 0
	ice_res: number = 0
	lightning_res: number = 0
	quantum_res: number = 0
	imaginary_res: number = 0
	
	atk_ratio: number
	def_ratio: number
	hp_ratio: number
	spd_ratio: number
	toughness_ratio: number
	
	spd_flat: number
	toughness_flat: number
	
	static skillData: LazyData<Dictionary<InternalMonsterSkill>> = new LazyData('ExcelOutput/MonsterSkillConfig.json')
	
	constructor(public data: InternalMonster, templateData: InternalMonsterTemplate) {
		super(templateData)
		this.name = textMap.getText(data.MonsterName)
		this.id = data.MonsterID
		this.intro = textMap.getText(data.MonsterIntroduction)
		this.battle_intro = textMap.getText(data.MonsterBattleIntroduction)
		
		this.scaling_type = data.HardLevelGroup
		this.elite_group_id = data.EliteGroup ?? 1
		this.skill_list = data.SkillList
		this.value_tags = data.CustomValueTags
		this.weakness_types = data.StanceWeakList
		
		data.DamageTypeResistance.forEach(res => this.addResEntry(res))
		
		this.atk_ratio = data.AttackModifyRatio?.Value ?? 1
		this.def_ratio = data.DefenceModifyRatio?.Value ?? 1
		this.hp_ratio = data.HPModifyRatio?.Value ?? 1
		this.spd_ratio = data.SpeedModifyRatio?.Value ?? 1
		this.toughness_ratio = data.StanceModifyRatio?.Value ?? 1
		this.spd_flat = data.SpeedModifyValue?.Value ?? 0
		this.toughness_flat = data.StanceModifyValue?.Value ?? 0
	}

	static fromId(enemyId: number | string) {
		const monsterData = Object.values(MonsterConfig).find(enemy => enemy.MonsterID == enemyId)!
		return new this(monsterData, Object.values(MonsterTemplateConfig).find(temp => temp.MonsterTemplateID == monsterData.MonsterTemplateID)!)
	}
	
	static loadAll() {
		return Object.values(MonsterConfig).map(monster => new this(monster, MonsterTemplateConfig[monster.MonsterTemplateID]))
	}
	
	hasCustomName(): boolean {
		return this.name != this.template_name
	}
	
	addResEntry(data: TypeResData) {
		switch (data.DamageType) {
			case 'Thunder':
				this.lightning_res += data.Value.Value
				break
			default:
				this[`${data.DamageType.toLowerCase()}_res`] += data.Value.Value
				break
		}
	}
	
	get scaling_map(): ScalingEntry[] {
		return enemyScaling[this.scaling_type ?? 1]
	}
	
	listStatChanges(): string[] {
		const changes: string[] = []
		
		const atk_diff = tpercent((this.atk / this.base_atk) - 1, 1)
		if (atk_diff) {
			changes.push(Stat.atk.diff(atk_diff))
		}
		
		const def_diff = tpercent((this.def / this.base_def) - 1, 1)
		if (def_diff) {
			changes.push(Stat.def.diff(def_diff))
		}
		
		const hp_diff = tpercent((this.hp / this.base_hp) - 1, 1)
		if (hp_diff) {
			changes.push(Stat.hp.diff(hp_diff))
		}
		
		const spd_diff = tpercent(((this.spd - this.spd_flat) / this.base_spd) - 1, 1)
		if (spd_diff) {
			changes.push(Stat.spd.diff(spd_diff))
		}
		
		if (this.spd_flat) {
			changes.push(Stat.spd.diff(diffn(this.spd_flat)))
		}

		const tough_diff = tpercent(((this.toughness - this.toughness_flat) / this.base_toughness) - 1, 1)
		if (tough_diff) {
			changes.push(Stat.toughness.diff(tough_diff))
		}
		
		if (this.toughness_flat) {
			changes.push(Stat.toughness.diff(diffn(this.toughness_flat)))
		}
		
		return changes
	}
	
	get elite_group(): EliteGroup {
		return eliteGroups[this.elite_group_id] ?? eliteGroups[1]
	}
	
	get atk() {
		return this.base_atk * this.atk_ratio * this.elite_group.atk_ratio
	}
	
	get def() {
		return this.base_def * this.def_ratio * this.elite_group.def_ratio
	}
	
	get hp() {
		return this.base_hp * this.hp_ratio * this.elite_group.hp_ratio
	}
	
	get spd() {
		return (this.base_spd * this.spd_ratio * this.elite_group.spd_ratio) + this.spd_flat
	}
	
	get toughness() {
		return (this.base_toughness * this.toughness_ratio * this.elite_group.toughness_ratio) + this.toughness_flat
	}
	
	get effect_res() {
		return this.base_effect_res
	}

	asEnemyListEntry(count: number | string) {
		const statChanges = this.listStatChanges()
		return `${this.template_name}*${count}`
			+ (statChanges.length > 0 ? `/${statChanges.join(', ')}` : '')
			+ (this.hasCustomName() ? `{ text = ${this.name} }` : '')
	}
	
	async getSkill(skillTag: string, removePart?: boolean): Promise<InternalMonsterSkill | undefined> {
		const skillData = await Enemy.skillData.get()
		for (const skillId of this.skill_list) {
			const skill = Object.values(skillData).find(skill => skill.SkillID == skillId)!
			let triggerKey = skill.SkillTriggerKey
			if (removePart) triggerKey = triggerKey.replace(/P\d/, '')
			if (triggerKey == skillTag) {
				return skill
			}
		}
		if (skillTag.match(/P\d/)) return this.getSkill(skillTag.replace(/P\d/, ''), true)
		else if (!removePart) return this.getSkill(skillTag, true)
		return undefined
	}
}

export class EnemyInstance extends Enemy {
	stage_elite_group_ids: number[] = []
	
	constructor(public data: InternalMonster, templateData: InternalMonsterTemplate, public level: number) {
		super(data, templateData)
	}
	
	static fromIdLeveled(enemyId: number | string, level: number) {
		const monsterData = MonsterConfig[enemyId]
		return new this(monsterData, MonsterTemplateConfig[monsterData.MonsterTemplateID], level)
	}
	
	get stage_elite_groups() {
		return this.stage_elite_group_ids.map(id => eliteGroups[id])
	}
	
	get combined_elite_group() {
		return this.stage_elite_groups.reduce((group, currentCombined) => {
			return {
				id: -1,
				atk_ratio: currentCombined.atk_ratio * group.atk_ratio,
				def_ratio: currentCombined.def_ratio * group.def_ratio,
				hp_ratio: currentCombined.hp_ratio * group.hp_ratio,
				spd_ratio: currentCombined.spd_ratio * group.spd_ratio,
				toughness_ratio: currentCombined.toughness_ratio * group.toughness_ratio
			}
		}, {
			id: -1,
			atk_ratio: 1,
			def_ratio: 1,
			hp_ratio: 1,
			spd_ratio: 1,
			toughness_ratio: 1
		})
	}
	
	get scaling() {
		return this.scaling_map[this.level]
	}
	
	get base_atk() {
		return super.base_atk * this.scaling.atk
	}
	
	get base_def() {
		return super.base_def * this.scaling.def
	}
	
	get base_hp() {
		return super.base_hp * this.scaling.hp
	}
	
	get base_spd() {
		return super.base_spd * this.scaling.spd
	}
	
	get ehr() {
		return super.ehr + this.scaling.ehr
	}
	
	get base_effect_res(): number {
		return super.base_effect_res + this.scaling.effect_res
	}
	
	get base_toughness(): number {
		return super.base_toughness * this.scaling.toughness
	}

	get atk() {
		return super.atk * this.combined_elite_group.atk_ratio
	}

	get def() {
		return super.def * this.combined_elite_group.def_ratio
	}

	get hp() {
		return super.hp * this.combined_elite_group.hp_ratio
	}

	get spd() {
		return ((super.spd - this.spd_flat) * this.combined_elite_group.spd_ratio) + this.spd_flat
	}

	get toughness() {
		return ((super.toughness - this.toughness_flat) * this.combined_elite_group.toughness_ratio) + this.toughness_flat
	}

	asCardListEntry(noLevel?: boolean) {
		return this.template_name
			+ (!noLevel ? `*Lv. ${this.level}` : '')
			+ (this.name != this.template_name ? `{ caption = ${this.name} }` : '')
	}
}