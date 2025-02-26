import config from '../config.json' with { "type": "json" }
import { AeonPath } from './Shared.js'
import { pathListDisplay, textMap } from './TextMap.js'
import { WeirdKey } from './WeirdKey.js'
import type { InternalBlessing, InternalBlessingGroup, InternalBlessingType, InternalDUBlessingGroup } from './files/Blessing.js'
import { getExcelFile, getFile } from './files/GameFile.js'
import { InternalMazeBuff } from './scripts/dump_boss_decay.js'

export const PathMap = await getExcelFile<InternalBlessingType>('RogueTournBuffType.json', 'RogueBuffType')

export type EnhanceFilter = 'both' | 'none' | 'only'

const RogueBuffGroup = await getExcelFile<InternalBlessingGroup>('RogueBuffGroup.json', WeirdKey.get('BlessingGroupID') as any)
const RogueTournBuffGroup = await getExcelFile<InternalDUBlessingGroup>('RogueTournBuffGroup.json', 'RogueBuffGroupID')

export class BlessingGroup {
	name: string = 'Unknkown Blessing Group'
	id: number
	rarity_min: number | string = '?'
	rarity_max: number | string = '?'
	paths = new Set<AeonPath>()
	enhanced?: EnhanceFilter
	
	static map_du = new Map<string, BlessingGroup>()
	static map_su = new Map<string, BlessingGroup>()
	
	constructor(public data: InternalBlessingGroup | InternalDUBlessingGroup, public is_du: boolean) {
		if (is_du) {
			this.id = (data as InternalDUBlessingGroup).RogueBuffGroupID
			BlessingGroup.map_du.set(this.id.toString(), this)
		} else {
			this.id = data[WeirdKey.get('BlessingGroupID')]
			BlessingGroup.map_su.set(this.id.toString(), this)
		}
	}
	
	resolveAllBlessings(): Blessing[] {
		const ids = this.is_du ? (this.data as InternalDUBlessingGroup).RogueBuffDrop : (this.data as InternalBlessingGroup)[WeirdKey.get('BlessingGroupMembers')]
		const blessings = ids.map((id: number) => BlessingGroup.forId(id, this.is_du)?.resolveAllBlessings() || []).flat(1024)
		
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
	
	static forId(id: number | string, du: boolean): BlessingGroup | Blessing | undefined {
		return (du ? this.map_du : this.map_su).get(id.toString()) ?? (du ? Blessing.map_du : Blessing.map_su).get(id.toString())
	}
	
	static nameForId(id: number, is_du: boolean, plural?: boolean): string {
		let name = this.forId(id, is_du)?.name ?? `Blessing(s) [${id}]`
		if (plural != undefined) {
			name = name.replace(/\(s\)/gi, plural ? 's' : '')
		}
		return name
	}
	
	static loaded = false
	static loadAll(du?: boolean) {
		if (this.loaded) return

		if (du == undefined) {
			this.loadAll(false)
			this.loadAll(true)
			return
		}
		
		Blessing.loadAll(du)
		for (const data of Object.values(du ? RogueTournBuffGroup : RogueBuffGroup)) {
			new BlessingGroup(data, du)
		}
		for (const blessing of (du ? this.map_du : this.map_su).values()) {
			blessing.resolveAllBlessings()
		}
		this.loaded = true
	}
}

export const RogueBuff = await getExcelFile<InternalBlessing>('ExcelOutput/RogueBuff.json', 'RogueBuffTag')
export const RogueTournBuff = await getExcelFile<InternalBlessing>('ExcelOutput/RogueTournBuff.json', 'RogueBuffTag')
export const RogueMazeBuff = await getFile<InternalMazeBuff[]>('ExcelOutput/RogueMazeBuff.json')
export const MazeBuff = await getFile<InternalMazeBuff[]>('ExcelOutput/MazeBuff.json')

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
	path: string
	enhanced: boolean
	level: number
	traits: number[]
	active?: boolean
	
	buff: InternalMazeBuff
	name: string
	description: string
	simple_description: string
	icon_variant: string

	static map_su = new Map<string, Blessing>()
	static map_du = new Map<string, Blessing>()
	
	constructor(public data: InternalBlessing, is_du: boolean) {
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
		this.path = Blessing.getPath(data.RogueBuffType)
		this.traits = data.ExtraEffectIDList
		
		this.active = Object.values(RogueTournBuffGroup).find(group => group.RogueBuffDrop.includes(this.id) && group.TournMode == 'Tourn2') != undefined
		
		this.buff = [...RogueMazeBuff, ...MazeBuff].find(buff => buff.ID == this.buff_id && buff.Lv == this.level)!
		this.name = textMap.getText(this.buff.BuffName)
		this.description = textMap.getText(this.buff.BuffDesc, this.buff.ParamList)
		this.simple_description = textMap.getText(this.buff.BuffSimpleDesc, this.buff.ParamList)
		this.icon_variant = iconVariants[Number(this.buff.BuffIcon.match(/(\d+)\.png/)?.[1]) ?? 0]
		
		;(is_du ? Blessing.map_du : Blessing.map_su).set(this.id.toString(), this)
	}
	
	static forId(id: number | string, is_du: boolean): Blessing | undefined {
		return (is_du ? this.map_du : this.map_su).get(id.toString())
	}
	
	getBuff(): InternalMazeBuff {
		return this.buff
	}
	
	static getPath(id: number) {
		return textMap.getText(PathMap[id]?.RogueBuffTypeName)
	}
	
	resolveAllBlessings(): Blessing[] {
		return [this]
	}
	
	static loaded = false
	static loadAll(du?: boolean): Iterable<Blessing> {
		if (du == undefined) return [...this.loadAll(false), ...this.loadAll(true)]
		
		if (this.loaded) return (du ? this.map_du : this.map_su).values()
		for (const levels of Object.values(du ? RogueTournBuff : RogueBuff)) {
			// for (const data of Object.values(levels)) {
				new Blessing(levels, du)
			//
		}
		this.loaded = true
		return (du ? this.map_du : this.map_su).values()
	}
}