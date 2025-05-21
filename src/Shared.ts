import { wikiPageMap } from './util/wikipagemap.js'

export type AeonPath =
	'Remembrance' | 'Destruction' | 'Elation' | 'Nihility' | 'Preservation'
	| 'Abundance' | 'TheHunt' | 'Propagation' | 'Erudition' | 'Harmony'
	| 'Trailblaze' | 'Ruan Mei'

export const enum CombatPath {
	Destruction = 'Warrior',
	TheHunt = 'Rogue',
	Erudition = 'Mage',
	Harmony = 'Shaman',
	Nihility = 'Warlock',
	Preservation = 'Knight',
	Abundance = 'Priest',
}

export type AttackType = 'Physical' | 'Fire' | 'Wind' | 'Ice' | 'Thunder' | 'Quantum' | 'Imaginary'
export type CustomAttackType = 'physical' | 'fire' | 'wind' | 'ice' | 'lightning' | 'quantum' | 'imaginary'
export type RealAttackType = 'Physical' | 'Fire' | 'Wind' | 'Ice' | 'Lightning' | 'Quantum' | 'Imaginary'

export const DAMAGE_TYPES: AttackType[] = ['Physical', 'Fire', 'Ice', 'Thunder', 'Wind', 'Quantum', 'Imaginary']

export function sanitizeString(str: string) {
	return str
		.replaceAll(/[\/\\=<>\|:]/g, '-')
		.replaceAll(/[\*"?:]/g, '')
}

export interface Value<T> {
	Value: T
}

export type Version = '1.0' | '1.1' | '1.2' | '1.3' | '1.4' | '1.5'| '1.6' | '2.0' | '2.1' | '2.2' | '2.3' | '2.4' | '2.5' | '2.6' | '2.7' | '3.0' | '3.1' | '3.2' | '3.3'

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
	'2.2': 'bc35ccf172429d6f12480c183d1ba8cc97bfd898',
	'2.3': 'df89dd1138e751c8b1a62c92fc2bafac421dc18f',
	'2.4': '16f0941630f628645d75cb54a2545ad9b7328ebc',
	'2.5': 'e948a9018d5e5c9a541cce50b3af1466b4644cec',
	'2.6': '5e3c0bf598e3062f1d493feb896959b7525c15f7',
	'2.7': 'fde92f72f63b890256a64b0e6e7cc46c0728f7ca',
	'3.0': 'abf111a311406963a57d9ac223b7b65de9142d81',
	'3.1': '71403732310ee713eb36ea1ced7e7508242f6293',
	'3.2': '102a288d91a67afe16a84832ffd2f728a07e1ee3',
	'3.3': '19d5d29f209ded2c951c815ef7f249134f7f8146',
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

export type AmbigType = 'item' | 'mission' | 'location' | 'faction' | 'readableseries' | 'tutorial'
const ambigTitles = {
	'The Sound and the Fury': {
		item: 'The Sound and the Fury (Item)',
		mission: 'The Sound and the Fury'
	},
	'Alchemy Commission (Location': {
		location: 'Alchemy Commission (Location',
		faction: 'Alchemy Commission'
	},
	'Artisanship Commission': {
		location: 'Artisanship Commission (Location',
		faction: 'Artisanship Commission'
	},
	'Divination Commission': {
		location: 'Divination Commission (Location',
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
	
	if (type == 'tutorial' && !name.startsWith('Tutorial/')) {
		name = 'Tutorial/' + name
	}
	
	return name
		.replaceAll('#', '')
		.replaceAll(/<.+?>/g, '')
		.replaceAll("''", '')
		.replaceAll('&mdash;', '—')
		.replaceAll('&ast;', "'")
		.replaceAll('&times;', '×')
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
	return (number < 0 ? '-' : '') + '0'.repeat(Math.max(length - stringNum.length, 0)) + stringNum
}

export function diffn(num: number, plus: boolean = true) {
	return ((plus && num > 0) ? '+' : '') + num
}

export function percent(num: number, decimals: number = 0, plus: boolean) {
	return diffn(Math.round(num * Math.pow(10, decimals + 2)) / Math.pow(10, decimals), plus) + '%'
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

export function roundTo(num: number, factor: number) {
	return Math.round(num * Math.pow(10, factor)) / Math.pow(10, factor)
}

export function getAudioHash(str: string): number {
	str = str.toLowerCase()
	let hash = 2166136261n

	for (let i = 0; i < str.length; i++) {
		hash = hash * 16777619n //FNV prime
		hash = hash ^ BigInt(str.charCodeAt(i)) //FNV xor
		hash = hash & 0xFFFFFFFFn //python clamp
	}

	return Number(hash)
}

export type OutputList = (string | OutputList)[]

export const DICON_MAP = {
	ChatMissionIcon: '!',
	ChatLoopIcon: 'Talk',
	ChatContinueIcon: 'Arrow',
	ChatBackIcon: 'Return',
	ChatOutIcon: 'Exit',
	ShopIcon: 'Shop',
	BoxIcon: 'Box',
	CheckIcon: 'Loupe',
	HealHPIcon: 'Heal',
	LevelIcon: 'Star',
	ChatIcon: 'Talk',
	SpecialChatIcon: 'Special',
	Synthesis: 'Synthesis',
	TriggerProp: 'Gear',
	CommonSign: 'Sign',
	FightActivity: 'Fight Club',
	RogueHeita: 'Herta',
	SecretMissionIcon: '?',
	MonsterReasearchIcon: 'Research',
	GeneralActivityIcon: 'Travel Log',
	StandupIcon: 'Stand',
	HideIcon: 'Hide',
	ChallengeStoryIcon: 'Pure Fiction',
	AbyssIcon: 'Forgotten Hall',
	DreamlandIcon: 'Clockwork',
	OrigamiBirdIcon: 'Origami Bird',
	PickUpIcon: 'Hand',
	HeartDialRaid: 'Absorb Emotions',
	TokenIcon: 'Token',
	ClockBoyShopIcon: 'Clockie',
	HeartDialTracer: 'Clockie Tie',
	ChallengeBossIcon: 'Apocalyptic Shadow'
}

export function allEqual<T extends (string | number | boolean | undefined | null)>(vals: T[]) {
	let lastVal: T | undefined = undefined
	
	for (const [i, val] of vals.entries()) {
		if (i > 0 && lastVal != val) {
			return false
		}
		lastVal = val
	}
	
	return true
}

export function sentenceJoin(list: (string | number)[], conjunction: string = 'and', comma: string = ', ') {
	if (list.length == 0) {
		return ''
	} else if (list.length == 1) {
		return String(list[0])
	} else if (list.length == 2) {
		return `${list[0]} ${conjunction} ${list[1]}`
	} else {
		list[list.length - 1] = `${conjunction} ${list[list.length - 1]}`
		return list.join(comma)
	}
}