import { readFileSync } from 'node:fs'
import config from '../config.json' with { type: "json" }
import { AeonPath, pathListDisplay } from './Shared.js'
import { HashReference, TextMap } from './TextMap.js'

export interface InternalBlessingGroup {
	/** id */
	HPODHLHDAJF: number
	/** included groups and blessings */
	DDIPBDOOMLH: number[]
}

export const PathMap: {[id: string]: AeonPath} = {
	'120': 'Preservation',
	'121': 'Remembrance',
	'122': 'Nihility',
	'123': 'Abundance',
	'124': 'TheHunt',
	'125': 'Destruction',
	'126': 'Elation',
	'127': 'Propagation',
	'128': 'Erudition', // speculation
}

export type EnhanceFilter = 'both' | 'none' | 'only'

export class BlessingGroup {
	name: string = 'Unknkown Blessing Group'
	id: number
	rarity_min: number | string = '?'
	rarity_max: number | string = '?'
	paths = new Set<AeonPath>()
	enhanced?: EnhanceFilter
	
	static map = new Map<string, BlessingGroup>()
	static data: {[id: string]: InternalBlessingGroup} = JSON.parse(readFileSync(`./versions/${config.target_version}/RogueBuffGroup.json`).toString())
	
	constructor(public data: InternalBlessingGroup) {
		this.id = data.HPODHLHDAJF
		BlessingGroup.map.set(this.id.toString(), this)
	}
	
	resolveAllBlessings(): Blessing[] {
		const blessings = this.data.DDIPBDOOMLH.map(id => BlessingGroup.forId(id)?.resolveAllBlessings() || []).flat(1024)
		
		this.rarity_min = Math.min(...blessings.map(blessing => blessing.rarity).filter(v => v))
		this.rarity_max = Math.max(...blessings.map(blessing => blessing.rarity).filter(v => v))

		for (const blessing of blessings) {
			this.paths.add(blessing.path)
			const enhanced = blessing.enhanced ? 'only' : 'none'
			if (!this.enhanced) {
				this.enhanced = enhanced
			} else if (this.enhanced != enhanced) {
				this.enhanced = 'both'
			}
		}

		if (!Number.isFinite(this.rarity_max)) {
			console.warn(this.id, 'Blessings:', blessings)
		}

		const displayRarity = this.rarity_min == this.rarity_max ? `${this.rarity_min}-star` : `${this.rarity_min}-${this.rarity_max} star`
		const pathName = this.paths.size > 6 || this.paths.size == 0 ? '' : 'of ' + pathListDisplay([...this.paths.values()])
		const enhanced = this.enhanced == 'only' ? 'Enhanced ' : ''
		this.name = `${enhanced} ${displayRarity} Blessing(s) ${pathName}`.trim()
		
		return blessings
	}
	
	static forId(id: number | string): BlessingGroup | Blessing | undefined {
		return this.map.get(id.toString()) ?? Blessing.map.get(id.toString())
	}
	
	static nameForId(id: number, plural?: boolean): string {
		let name = this.forId(id)?.name ?? `Blessing(s) [${id}]`
		if (plural != undefined) {
			name = name.replace(/\(s\)/gi, plural ? 's' : '')
		}
		return name
	}
	
	static loaded = false
	static loadAll() {
		if (this.loaded) return
		Blessing.loadAll()
		for (const data of Object.values(this.data)) {
			new BlessingGroup(data)
		}
		for (const blessing of this.map.values()) {
			blessing.resolveAllBlessings()
		}
		this.loaded = true
	}
}

export interface InternalBlessing {
	MazeBuffID: number
	MazeBuffLevel: number
	RogueBuffType: number
	RogueBuffRarity: number
	RogueBuffTag: number
	ExtraEffectIDList: number[]
	AeonID?: number
	RogueVersion: number
	UnlockIDList: number[]
	HandbookUnlockDesc: HashReference
	AeonCrossIcon?: string
	IsShow?: boolean
}

export type InternalLayerMap<T> = { [id: string]: { [level: string]: T } }

export interface InternalBlessingBuff {
	ID: number
	BuffSeries: number
	BuffRarity: number
	Lv: number
	LvMax: number
	ModifierName: string
	InBattleBindingType: string
	InBattleBindingKey: string
	ParamList: { Value: number }[],
	BuffIcon: string
	BuffName: HashReference
	BuffDesc: HashReference
	BuffSimpleDesc: HashReference
	BuffDescBattle: HashReference
	BuffEffect: string
	MazeBuffType: string
}

export class Blessing {
	buff_id: number
	id: number
	rarity: number
	path: AeonPath
	enhanced: boolean
	level: number

	static map = new Map<string, Blessing>()
	
	static data: InternalLayerMap<InternalBlessing> = JSON.parse(readFileSync(`./versions/${config.target_version}/RogueBuff.json`).toString())
	static buff_data: InternalLayerMap<InternalBlessingBuff> = JSON.parse(readFileSync(`./versions/${config.target_version}/RogueMazeBuff.json`).toString())
	
	constructor(public data: InternalBlessing) {
		this.id = data.RogueBuffTag
		this.buff_id = data.MazeBuffID
		this.rarity = data.RogueBuffRarity
		this.level = data.MazeBuffLevel
		this.enhanced = this.level > 1
		this.path = PathMap[data.RogueBuffType]
		
		Blessing.map.set(this.id.toString(), this)
	}
	
	static forId(id: number | string): Blessing | undefined {
		return this.map.get(id.toString())
	}
	
	getBuff(): InternalBlessingBuff {
		return Blessing.buff_data[this.buff_id][this.level]
	}
	
	get name(): string {
		return TextMap.default.getText(this.getBuff().BuffName)
	}
	
	get simple_description(): string {
		return TextMap.default.getText(this.getBuff().BuffSimpleDesc)
	}
	
	get description(): string {
		return TextMap.default.getText(this.getBuff().BuffDesc)
	}
	
	resolveAllBlessings(): Blessing[] {
		return [this]
	}
	
	static loaded = false
	static loadAll() {
		if (this.loaded) return
		for (const levels of Object.values(this.data)) {
			for (const data of Object.values(levels)) {
				new Blessing(data)
			}
		}
		this.loaded = true
	}
}