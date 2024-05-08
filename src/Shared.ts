import { wikiPageMap } from './util/wikipagemap.js'

export type AeonPath =
	'Remembrance' | 'Destruction' | 'Elation' | 'Nihility' | 'Preservation'
	| 'Abundance' | 'TheHunt' | 'Propagation' | 'Erudition' | 'Trailblaze'
	| 'Ruan Mei'

export type AttackType = 'Physical' | 'Fire' | 'Wind' | 'Ice' | 'Thunder' | 'Quantum' | 'Imaginary'
export type CustomAttackType = 'physical' | 'fire' | 'wind' | 'ice' | 'lightning' | 'quantum' | 'imaginary'

export const DAMAGE_TYPES: AttackType[] = ['Physical', 'Fire', 'Ice', 'Thunder', 'Wind', 'Quantum', 'Imaginary']

export function pathDisplayName(pathName: AeonPath) {
	return pathName == 'TheHunt' ? 'The Hunt' : pathName
}

export function typeDisplayName(type: AttackType) {
	return type == 'Thunder' ? 'Lightning' : type
}

export function pathListDisplay(pathNames: AeonPath[]) {
	if (pathNames.length == 1) return pathDisplayName(pathNames[0])
	if (pathNames.length == 2) return `${pathDisplayName(pathNames[0])} or ${pathDisplayName(pathNames[1])}`
	return [...pathNames.slice(0, -1).map(name => pathDisplayName(name)), 'or ' + pathDisplayName(pathNames[pathNames.length])].join(', ')
}

export function sanitizeString(str: string) {
	return str
		.replaceAll(/[\/\\=<>\|:]/g, '-')
		.replaceAll(/[\*"?:,]/g, '')
}

export interface Value<T> {
	Value: T
}

export type Version = '1.0' | '1.1' | '1.2' | '1.3' | '1.4' | '1.5'| '1.6' | '2.0' | '2.1' | '2.2'

export const VERSION_COMMITS: Dictionary<string, Version> = {
	'1.0': '4a36e628f9f34e6221b167b6ae0235a2f3934330',
	'1.1': '1ab86f99405026f6c9b1be98661a584e1a38a0df',
	'1.2': '900fa36177ffd66e7d70d2c21276c5bc0662212d',
	'1.3': 'aa811519a5de772bf4055e8ea8b9254f90b7746c',
	'1.4': '6acdba35cbf80adc100dbde528b1c271f50dcb9d',
	'1.5': '59d64be43a1da285cf22ba9be5ed90ef2b23f857',
	'1.6': '267db9b8cc44face0f376075f0828c5e1dd20bff',
	'2.0': 'ca821fbec8c6d6ae37ed323ed76d1fc998bae84b',
	'2.1': '0ba49dbbd86b9be6f4be3fc5fa72eefaa65ad443',
	'2.2': 'bc35ccf172429d6f12480c183d1ba8cc97bfd898'
}

export const VERSION_LIST: Version[] = Object.keys(VERSION_COMMITS).sort() as Version[]

export type Dictionary<V, K extends string | number | symbol = string> = { [key in K]: V }

export const RARITIES = {
	Normal: 1,
	NotNormal: 2,
	Rare: 3,
	VeryRare: 4,
	SuperRare: 5
}

export type StringResolvable = string | number | {
	[Symbol.toStringTag](): string
}

export function titleCase(string: string) {
	return string
		.replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replaceAll('_', ' ')
		.replaceAll(/(?:\s|^)[a-z]/g, s => s.toUpperCase())
}

export function n(nextWord: string) {
	return nextWord.match(/^[aeiou]/) ? 'n' : ''
}

export interface ObjectDiffResult<T> {
	added: T[]
	removed: T[]
}

export function objectDiff<T>(older: Dictionary<T>, newer: Dictionary<T>): ObjectDiffResult<T> {
	const added: T[] = Object.entries(newer)
		.filter(([key]) => !older[key])
		.map(pair => pair[1])
		
	const removed: T[] = Object.entries(older)
		.filter(([key]) => !newer[key])
		.map(pair => pair[1])
		
	return { added, removed }
}

export type AmbigType = 'item' | 'mission' | 'location' | 'faction'
const ambigTitles = {
	'The Sound and the Fury': {
		item: 'The Sound and the Fury (Item)',
		mission: 'The Sound and the Fury'
	},
	'Alchemy Commission (Location)': {
		location: 'Alchemy Commission (Location)',
		faction: 'Alchemy Commission'
	},
	'Artisanship Commission': {
		location: 'Artisanship Commission (Location)',
		faction: 'Artisanship Commission'
	},
	'Divination Commission': {
		location: 'Divination Commission (Location)',
		faction: 'Divination Commission'
	},
	'A Foxian Tale of the Haunted': {
		mission: 'A Foxian Tale of the Haunted (Continuance)',
		event: 'A Foxian Tale of the Haunted'
	}
}

export function wikiTitle(name: string, type?: AmbigType, id?: number) {
	if (type && ambigTitles[name]?.[type]) {
		return ambigTitles[name][type]
	}
	
	const mapData = (id && wikiPageMap[`${type}_${id}`]) || wikiPageMap[`${type}_${name}`]
	if (mapData) {
		name = mapData.pagename
	}
	
	return name
		.replaceAll('#', '')
		.replaceAll(/<.+?>/g, '')
		.replaceAll("''", '')
		.replaceAll('&mdash;', '—')
}

export function wikiTitleLink(name: string, type?: AmbigType) {
	const newName = wikiTitle(name, type)
	if (newName != name) {
		return `[[${newName}|${name}]]`
	} else {
		return `[[${newName}]]`
	}
}

export function zeroPad(number: number, length: number) {
	const stringNum = Math.abs(number).toString()
	return (number < 0 ? '-' : '') + '0'.repeat(length - stringNum.length) + stringNum
}

export function diffn(num: number, plus: boolean = true) {
	return ((plus && num > 0) ? '+' : '')
}

export function percent(num: number, decimals: number = 0, plus: boolean) {
	return diffn(Math.round(num * (10 ^ (decimals + 2))) / (10 ^ decimals), plus) + '%'
}

export function tpercent(num: number, decimals: number = 0, plus: boolean = true, threshold: number = 0.001): string | undefined {
	if (!Number.isFinite(num) || Math.abs(num) < threshold) return undefined
	else return percent(num, decimals, plus)
}

export class Cache<T extends object> {
	registry: FinalizationRegistry<string>
	map = new Map<string, WeakRef<T>>()

	constructor() {
		this.registry = new FinalizationRegistry<string>(key => {
			if (!this.map.get(key)?.deref()) {
				this.map.delete(key);
			}
		})
	}

	get(key: string | number): T | undefined {
		return this.map.get(key.toString())?.deref()
	}

	set(key: string | number, value: T) {
		key = key.toString()
		this.map.set(key, new WeakRef(value))
		this.registry.register(value, key)
		return value
	}

	delete(key: string) {
		this.map.delete(key)
	}
}