import { CustomAttackType } from './Shared.js'
import { textMap } from './TextMap.js'
import { getFile } from './files/GameFile.js'
import { AvatarProperty, AvatarPropertyType } from './files/Stats.js'

export type CustomResStats = `${CustomAttackType}_res`

export type CustomDmgStats = `${CustomAttackType}_dmg`

export type CustomStatName =
	| 'atk' | 'def' | 'hp' | 'spd' | 'toughness'
	| 'ehr' | 'effect_res'
	| CustomResStats

export type CustomPlayerStatName = CustomStatName
	| 'energy_regen' | CustomDmgStats | 'dmg_boost'
	| 'break_effect'

type StatVariants<T extends string> = T | `${T}Base` | `${T}Ratio` | `${T}Value` | `${T}ModifyRatio` | `${T}ModifyValue`

export type InternalStatName =
	| StatVariants<'Attack'> | StatVariants<'Defence'> | StatVariants<'HP'> | StatVariants<'Speed'>
	| StatVariants<'Stance'> | StatVariants<'StatusProbability'> | StatVariants<'StatusResistance'>

export type StatHaver = {
	[stat in CustomStatName]: number
}

export type StatName = CustomStatName | InternalStatName

export type StatSubType = 'default' | 'base' | 'value' | 'flat' | 'ratio'

type SubKeyMap = Partial<Record<StatSubType, AvatarPropertyType | AvatarProperty>> & { default: AvatarPropertyType | AvatarProperty }
type SubKeyMapStat = Partial<Record<StatSubType, Stat>> & { default: Stat }

function mockAvatarProperty(key: AvatarPropertyType, Hash: number): AvatarProperty {
	return {
		PropertyType: key,
		PropertyName: { Hash },
		PropertyNameSkillTree: { Hash },
		PropertyNameRelic: { Hash },
		PropertyNameFilter: { Hash },
		IsDisplay: false,
		isBattleDisplay: false,
		Order: 10000,
		IconPath: '',
		custom: true
	}
}

export class Stat {
	name!: string
	name_hash!: number
	name_relic?: string
	name_filter?: string
	name_trace?: string
	
	custom_key!: CustomPlayerStatName
	custom_subtype!: StatSubType
	internal_key!: AvatarPropertyType
	
	icon?: string
	order!: number
	
	visible!: boolean
	battleVisible!: boolean
	custom!: boolean
	
	protected constructor() {}
	
	static customKeyToInternal: Record<CustomPlayerStatName, SubKeyMap> = {
		atk: { default: 'Attack', base: 'BaseAttack', flat: 'AttackDelta', ratio: 'AttackAddedRatio' },
		def: { default: 'Defence', base: 'BaseDefence', flat: 'DefenceDelta', ratio: 'DefenceAddedRatio' },
		hp: { default: 'MaxHP', base: 'BaseHP', flat: 'HPDelta', ratio: 'HPAddedRatio', value: mockAvatarProperty('HPValue', 35820337) },
		ehr: { default: 'StatusProbability', base: 'StatusProbabilityBase' },
		effect_res: { default: 'StatusResistance', base: 'StatusResistanceBase' },
		break_effect: { default: 'BreakDamageAddedRatio', base: "BreakDamageAddedRatioBase" },
		dmg_boost: { default: mockAvatarProperty('DMGBoost', 109177041) },
		energy_regen: { default: 'SPRatio', base: 'SPRatioBase' },
		spd: { default: 'Speed', base: 'BaseSpeed', flat: 'SpeedDelta' },
		physical_dmg: { default: 'PhysicalAddedRatio' },
		fire_dmg: { default: "FireAddedRatio" },
		ice_dmg: { default: 'IceAddedRatio' },
		wind_dmg: { default: 'WindAddedRatio' },
		lightning_dmg: { default: 'ThunderAddedRatio' },
		quantum_dmg: { default: 'QuantumAddedRatio' },
		imaginary_dmg: { default: 'ImaginaryAddedRatio' },
		physical_res: { default: 'PhysicalResistance', ratio: 'PhysicalResistanceDelta' },
		fire_res: { default: 'FireResistance', ratio: 'FireResistanceDelta' },
		ice_res: { default: 'IceResistance', ratio: 'IceResistanceDelta' },
		wind_res: { default: 'WindResistance', ratio: 'WindResistanceDelta' },
		lightning_res: { default: 'ThunderResistance', ratio: 'ThunderResistanceDelta' },
		imaginary_res: { default: 'ImaginaryResistance', ratio: 'ImaginaryResistanceDelta' },
		quantum_res: { default: 'QuantumResistance', ratio: 'QuantumResistanceDelta' },
		toughness: { default: mockAvatarProperty('Toughness', -1438801497) }
	}

	static internalKeyMap: Record<AvatarPropertyType, Stat> = {} as any
	static customKeyMap: Record<CustomPlayerStatName, SubKeyMapStat> = {} as any
	
	protected static fromStatData(data: AvatarProperty, customKey: CustomPlayerStatName, subtype: StatSubType) {
		const stat = new this()
		
		stat.internal_key = data.PropertyType
		stat.custom_key = customKey
		
		stat.name_hash = data.PropertyName?.Hash
		stat.name = textMap.getText(data.PropertyName)
		stat.name_filter = textMap.getText(data.PropertyNameFilter)
		stat.name_relic = textMap.getText(data.PropertyNameRelic)
		stat.name_trace = textMap.getText(data.PropertyNameSkillTree)
		
		stat.visible = data.IsDisplay ?? false
		stat.battleVisible = data.isBattleDisplay ?? false
		stat.custom = data.custom ?? false

		stat.icon = data.IconPath || undefined
		stat.order = data.Order
		
		this.customKeyMap[stat.custom_key] ??= { default: stat }
		
		this.internalKeyMap[stat.internal_key] = stat
		this.customKeyMap[stat.custom_key][subtype] = stat
	}
	
	static fromInternal(key: AvatarPropertyType): Stat
	static fromInternal(key: string): Stat | undefined
	static fromInternal(key: string): Stat | undefined {
		return this.internalKeyMap[key]
	}
	static fromCustomKey(key: CustomPlayerStatName, subtype: StatSubType = 'default'): Stat {
		return this.customKeyMap[key][subtype] ?? this.customKeyMap[key].default
	}
	
	static atk: Stat
	static def: Stat
	static hp: Stat
	static spd: Stat
	static toughness: Stat
	
	static async init(): Promise<void> {
		const statData = await getFile('ExcelOutput/AvatarPropertyConfig.json')
		for (const [custom_key, submaps] of Object.entries(this.customKeyToInternal)) {
			for (let [subtype, hashOrData] of Object.entries(submaps)) {
				if (typeof hashOrData == 'string') {
					hashOrData = Object.values(statData).find(stat => stat.PropertyType == hashOrData)
				}
				this.fromStatData(hashOrData as AvatarProperty, custom_key as CustomStatName, subtype as StatSubType)
			}
		}
		
		this.atk = this.fromCustomKey('atk')
		this.def = this.fromCustomKey('def')
		this.hp = this.fromCustomKey('hp')
		this.spd = this.fromCustomKey('spd')
		this.toughness = this.fromCustomKey('toughness')
	}
	
	static fromStatLike(stat: StatName, overrideSubtype?: StatSubType) {
		if (Stat.fromInternal(stat)) return Stat.fromInternal(stat)
		
		const subtype: StatSubType = overrideSubtype ??
			stat.includes('Base') ? 'base'
			: stat.includes('Ratio') ? 'ratio'
			: stat.includes('Delta') ? stat.includes('Resistance') ? 'ratio' : 'flat'
			: stat.includes('Value') ? 'value'
			: 'default'
		
		if (stat.startsWith('Attack'))
			return this.fromCustomKey('atk', subtype)
		
		else if (stat.startsWith('Defence'))
			return this.fromCustomKey('def', subtype)
		
		else if (stat.startsWith('HP') || stat.startsWith('MaxHP'))
			return this.fromCustomKey('hp', subtype)
		
		else if (stat.startsWith('Speed'))
			return this.fromCustomKey('spd', subtype)
		
		else if (stat.startsWith('Stance'))
			return this.fromCustomKey('toughness', subtype)
		
		else if (stat.startsWith('StatusProbability'))
			return this.fromCustomKey('ehr', subtype)
		
		else if (stat.startsWith('StatusResistance'))
			return this.fromCustomKey('effect_res', subtype)
		
		else
			throw new TypeError(`Unknown InternalStatName "${stat}"`)
	}
	
	toString() {
		return this.name
	}

	diff(diff: string) {
		return `${this.name} ${diff}`
	}
}

await Stat.init()