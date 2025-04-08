import { Item, ItemPurpose } from './Item.js'
import { Mission } from './Mission.js'
import { AttackType, DAMAGE_TYPES, Dictionary, titleCase } from './Shared.js'
import { Enemy } from './Stage.js'
import { textMap } from './TextMap.js'
import { CocoonConfig, FarmElementConfig, GameplayGuideEntry, InternalCocoon, InternalFarmElement } from './files/Domain.js'
import { LazyData } from './files/GameFile.js'
import { MappingInfo } from './maps/MapingInfo.js'

export type DomainType = 'calyx_golden' | 'calyx_crimson' | 'cavern' | 'shadow' | 'echo'

export abstract class BaseDomain extends MappingInfo {
	static cocoonData = new LazyData<CocoonConfig>('ExcelOutput/CocoonConfig.json')
	static farmElementData = new LazyData<FarmElementConfig>('ExcelOutput/FarmElementConfig.json')
	static guideData = new LazyData<Dictionary<GameplayGuideEntry>>('ExcelOutput/GameplayGuideData.json')
	
	id: number
	world_level: number
	abstract domain_type: DomainType
	special_mechanism?: string
	
	stages: number[]
	power_cost: number
	abstract max_waves: number
	abstract type_display: string
	
	recommended_types: AttackType[]
	abstract getMainDrops(): Item[]
	abstract getImage(): string | Promise<string>
	abstract getTitle(): string | Promise<string>
	
	getBosses(): Enemy[] {
		return this.getEnemies().filter(enemy => enemy.isElite())
	}
	
	/**
	 * Attempts to emulate the built-in AutoObtainDamageType behavior.
	 * From my testing:
	 * * Weakness type occurrences are counted among the possible enemies
	 * * When multiple types are tied, their typical order is used (as listed on our Type page)
	 * 
	 * With the above criteria, the top three are selected.
	 */
	inferDamageTypes() {
		const totals = new Map<AttackType, number>()
		for (const enemy of this.getEnemies()) {
			for (const type of enemy.weakness_types) {
				totals.set(type, (totals.get(type) ?? 0) + 1)
			}
		}
		return [...totals.entries()]
			.sort(([type1, count1], [type2, count2]) => (DAMAGE_TYPES.indexOf(type1) - (count1 * 10)) - (DAMAGE_TYPES.indexOf(type2) - (count2 * 10)))
			.slice(0, 3)
			.map(([type]) => type)
	}
	
	constructor(public data: InternalCocoon | InternalFarmElement) {
		super(MappingInfo.data[data.MappingInfoID])
		this.id = data.ID
		
		this.power_cost = data.StaminaCost
		this.world_level = data.WorldLevel
		
		this.stages = data.StageIDList ?? []
		if (data.StageID) this.stages.unshift(data.StageID)
			
		if (data.AutoObtainDamageType) {
			this.recommended_types = this.inferDamageTypes()
		} else {
			this.recommended_types = data.DamageType ?? []
		}
		
		this.special_mechanism = textMap.getText(data.BuffDesc, data.ParamList)
	}
	
	async getGuideData(): Promise<GameplayGuideEntry> {
		return (await BaseDomain.guideData.get())[this.id]
	}
	
	async getShortName(): Promise<string> {
		return textMap.getText((await this.getGuideData()).Name)
	}

	async getUnlockCriteria(): Promise<Mission[]> {
		return (await this.getGuideData()).UnlockMission.map(id => Mission.fromId(id))
	}
	
	costDisplay(): string {
		return this.power_cost + (this.max_waves > 1 ? ' (per wave)' : '')
	}
	
	isCocoon(): this is CocoonDomain {
		return this.domain_type != 'shadow'
	}
	
	isStagnantShadow(): this is StagnantShadowDomain {
		return this.domain_type == 'shadow'
	}
	
	isEcho(): this is EchoOfWarDomain {
		return this.domain_type == 'echo'
	}
	
	isCalyx(): this is (CalyxGoldenDomain | CalyxCrimsonDomain) {
		return this.domain_type == 'calyx_crimson' || this.domain_type == 'calyx_golden'
	}
	
	isCalyxGolden(): this is CalyxGoldenDomain {
		return this.domain_type == 'calyx_golden'
	}
	
	isCalyxCrimson(): this is CalyxCrimsonDomain {
		return this.domain_type == 'calyx_crimson'
	}
	
	isCavern(): this is CavernDomain {
		return this.domain_type == 'cavern'
	}
	
	static fromData(data: InternalCocoon | InternalFarmElement): Domain {
		if (!('CocoonType' in data)) {
			return new StagnantShadowDomain(data)
		} else {
			switch (data.FarmType) {
				case 'COCOON2':
					return new EchoOfWarDomain(data)
					
				case 'COCOON3':
					return new CalyxCrimsonDomain(data)
					
				case 'COCOON_AVATAR_EXP':
				case 'COCOON_COIN':
				case 'COCOON_EQUIPMENT_EXP':
					return new CalyxGoldenDomain(data)
					
				case 'RELIC':
					return new CavernDomain(data)
					
				default:
					throw new TypeError(`Unknown FarmType "${data.FarmType}"`)
			}
		}
	}
	
	static async getAll(): Promise<Domain[][]> {
		const domains: Domain[][] = []
		
		const allData: (Dictionary<InternalFarmElement> | Dictionary<InternalCocoon>)[] = Object.values(await this.cocoonData.get())
		allData.push(...Object.values(await this.farmElementData.get()))
		
		for (const domain of allData) {
			const thisDomain: Domain[] = []
			domains.push(thisDomain)
			for (const diff of Object.values(domain)) {
				thisDomain.push(this.fromData(diff))
			}
			thisDomain.sort((d1, d2) => d1.world_level - d2.world_level)
		}
		
		return domains
	}
}

export abstract class CocoonDomain extends BaseDomain {
	abstract domain_type: Exclude<DomainType, 'shadow'>;
	max_waves: number;

	constructor(public data: InternalCocoon) {
		super(data)
		this.max_waves = data.MaxWave ?? 1
	}
}

export class StagnantShadowDomain extends BaseDomain {
	domain_type: 'shadow' = 'shadow';
	max_waves: number = 1;
	type_display = textMap.getText(2979485018042972636n)
	
	getMainDrops(): Item[] {
		return this.getItems().filter(item => item.purpose_id == ItemPurpose.ASCENSION_MATERIAL)
	}
	
	getTitle(): string {
		return this.name
	}

	async getImage(): Promise<string> {
		return `Stagnant Shadow - ${await this.getShortName()}.png`
	}
	
	constructor(public data: InternalFarmElement) {
		super(data)
	}
}

export type CalyxGoldenType = 'memories' | 'aether' | 'treasures'

export class CalyxGoldenDomain extends CocoonDomain {
	readonly domain_type: 'calyx_golden' = 'calyx_golden';
	subtype: CalyxGoldenType
	type_display = textMap.getText(17270097842088462076n)

	getMainDrops(): Item[] {
		const targetPurpose = 
			this.subtype == 'aether' ? ItemPurpose.LIGHT_CONE_EXP
			: this.subtype == 'memories' ? ItemPurpose.CHARACTER_EXP
			: ItemPurpose.COMMON_CURRENCY
		return this.getItems().filter(item => item.purpose_id == targetPurpose || item.purpose_id == ItemPurpose.NORMAL_ENEMY_DROP || item.purpose_id == ItemPurpose.SYNTHESIS_MATERIAL)
	}

	getImage(): string {
		return `Calyx (Golden) - Bud of ${titleCase(this.subtype)}.png`
	}
	
	async getTitle(): Promise<string> {
		return this.name + ` (${(await this.getArea())?.name})`
	}
	
	constructor(public data: InternalCocoon) {
		super(data)
		
		this.subtype = 
			data.FarmType == 'COCOON_AVATAR_EXP' ? 'memories'
			: data.FarmType == 'COCOON_COIN' ? 'treasures'
			: 'aether'
	}
}

export class CalyxCrimsonDomain extends CocoonDomain {
	readonly domain_type: 'calyx_crimson' = 'calyx_crimson';
	type_display = textMap.getText(18367602007122703045n)

	getImage(): string {
		return `Path ${this.getPath()}.png`
	}

	async getTitle(): Promise<string> {
		return this.name + ` (${(await this.getArea())?.name})`
	}
	
	getPath(): string | undefined {
		return this.name.match(/Bud of (.+)/i)?.[1]
	}
	
	getMainDrops(): Item[] {
		return this.getItems().filter(item => item.purpose_id == ItemPurpose.PATH_MATERIAL)
	}
}

export class CavernDomain extends CocoonDomain {
	readonly domain_type: 'cavern' = 'cavern';
	type_display = textMap.getText(8411535710367480676n)

	async getImage(): Promise<string> {
		return `Cavern of Corrosion - ${await this.getShortName()}.png`
	}

	getTitle(): string {
		return this.name
	}
	
	getMainDrops(): Item[] {
		return this.getItems().filter(item => item.subtype == 'RelicRarityShowOnly' && item.rarity == 5)
	}
}

export class EchoOfWarDomain extends CocoonDomain {
	readonly domain_type: 'echo' = 'echo';
	type_display = textMap.getText(18014528022268912511n)

	async getImage(): Promise<string> {
		return `Echo of War - ${await this.getShortName()}.png`
	}

	getTitle(): string {
		return this.name
	}
	
	getMainDrops(): Item[] {
		return this.getItems().filter(item => item.purpose_id == ItemPurpose.WEEKLY_DROP)
	}
}

export type Domain = StagnantShadowDomain | CalyxGoldenDomain | CalyxCrimsonDomain | CavernDomain | EchoOfWarDomain