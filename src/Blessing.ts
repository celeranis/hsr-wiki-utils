import config from '../config.json' with { "type": "json" }
import { AeonPath, Dictionary, pathDisplayName, pathListDisplay } from './Shared.js'
import { textMap } from './TextMap.js'
import { WeirdKey } from './WeirdKey.js'
import type { InternalBlessing, InternalBlessingBuff, InternalBlessingGroup, InternalLayerMap } from './files/Blessing.js'
import { getFile } from './files/GameFile.js'

export const PathMap: {[id: string]: AeonPath} = {
	'120': 'Preservation',
	'121': 'Remembrance',
	'122': 'Nihility',
	'123': 'Abundance',
	'124': 'TheHunt',
	'125': 'Destruction',
	'126': 'Elation',
	'127': 'Propagation',
	'128': 'Erudition',
}

export type EnhanceFilter = 'both' | 'none' | 'only'

const group_data: Dictionary<InternalBlessingGroup> = await getFile('ExcelOutput/RogueBuffGroup.json')

export class BlessingGroup {
	name: string = 'Unknkown Blessing Group'
	id: number
	rarity_min: number | string = '?'
	rarity_max: number | string = '?'
	paths = new Set<AeonPath>()
	enhanced?: EnhanceFilter
	
	static map = new Map<string, BlessingGroup>()
	static data = group_data
	
	constructor(public data: InternalBlessingGroup) {
		this.id = data[WeirdKey.get('BlessingGroupID')]
		BlessingGroup.map.set(this.id.toString(), this)
	}
	
	resolveAllBlessings(): Blessing[] {
		const blessings = this.data[WeirdKey.get('BlessingGroupMembers')].map((id: number) => BlessingGroup.forId(id)?.resolveAllBlessings() || []).flat(1024)
		
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
		const enhanced = this.enhanced == 'only' ? `Enhanced ` : ''
		this.name = `${enhanced}${displayRarity} Blessing(s) ${pathName}`.trim()
		
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

const blessing_data: InternalLayerMap<InternalBlessing> = await getFile('ExcelOutput/RogueTournBuff.json')
const buff_data: InternalLayerMap<InternalBlessingBuff> = await getFile('ExcelOutput/RogueMazeBuff.json')

const iconVariants = [
	'',
	'Attack',
	'Defense',
	'Buff',
	'Debuff',
	'Support'
]

export class Blessing {
	buff_id: number
	id: number
	rarity: number
	path: AeonPath
	enhanced: boolean
	level: number
	traits: number[]
	
	buff: InternalBlessingBuff
	name: string
	description: string
	simple_description: string
	icon_variant: string

	static map = new Map<string, Blessing>()
	
	static data = blessing_data
	static buff_data = buff_data
	
	constructor(public data: InternalBlessing) {
		this.id = data.RogueBuffTag
		this.buff_id = data.MazeBuffID
		if (config.target_version < '2.3') {
			this.rarity = (data as any).RogueBuffRarity
		} else {
			this.rarity = 
				data.RogueBuffCategory == 'Common' ? 1 
				: data.RogueBuffCategory == 'Rare' ? 2 
				: data.RogueBuffCategory == 'Legendary' ? 3 
				: 4
		}
		this.level = data.MazeBuffLevel
		this.enhanced = this.level > 1
		this.path = PathMap[data.RogueBuffType]
		this.traits = data.ExtraEffectIDList
		
		this.buff = Blessing.buff_data[this.buff_id][this.level]
		this.name = textMap.getText(this.buff.BuffName)
		this.description = textMap.getText(this.buff.BuffDesc, this.buff.ParamList)
		this.simple_description = textMap.getText(this.buff.BuffSimpleDesc, this.buff.ParamList)
		this.icon_variant = iconVariants[Number(this.buff.BuffIcon.match(/(\d+)\.png/)?.[1]) ?? 0]
		
		Blessing.map.set(this.id.toString(), this)
	}
	
	static forId(id: number | string): Blessing | undefined {
		return this.map.get(id.toString())
	}
	
	getBuff(): InternalBlessingBuff {
		return this.buff
	}
	
	static getPath(id: number) {
		return pathDisplayName(PathMap[id])
	}
	
	resolveAllBlessings(): Blessing[] {
		return [this]
	}
	
	static loaded = false
	static loadAll() {
		if (this.loaded) return this.map.values()
		for (const levels of Object.values(this.data)) {
			for (const data of Object.values(levels)) {
				new Blessing(data)
			}
		}
		this.loaded = true
		return this.map.values()
	}
}