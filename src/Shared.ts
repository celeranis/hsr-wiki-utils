export type AeonPath =
	'Remembrance' | 'Destruction' | 'Elation' | 'Nihility' | 'Preservation'
	| 'Abundance' | 'TheHunt' | 'Propagation' | 'Erudition' | 'Trailblaze'
	| 'Ruan Mei'

export type AttackType = 'Physical' | 'Fire' | 'Wind' | 'Ice' | 'Thunder' | 'Quantum' | 'Imaginary'

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

export interface Value<T> {
	Value: T
}

export type Version = '1.0' | '1.1' | '1.2' | '1.3' | '1.4' | '1.5'| '1.6'

export const VERSION_COMMITS: Dictionary<string, Version> = {
	'1.0': '4a36e628f9f34e6221b167b6ae0235a2f3934330',
	'1.1': '1ab86f99405026f6c9b1be98661a584e1a38a0df',
	'1.2': '900fa36177ffd66e7d70d2c21276c5bc0662212d',
	'1.3': 'aa811519a5de772bf4055e8ea8b9254f90b7746c',
	'1.4': '6acdba35cbf80adc100dbde528b1c271f50dcb9d',
	'1.5': '59d64be43a1da285cf22ba9be5ed90ef2b23f857',
	'1.6': '267db9b8cc44face0f376075f0828c5e1dd20bff',
}

export const VERSION_LIST: Version[] = Object.keys(VERSION_COMMITS).sort() as Version[]

export type Dictionary<V, K extends string | number | symbol = string> = { [key in K]: V }

export interface ItemReference {
	ItemID: number
	ItemNum?: number
}

export const RARITIES = {
	Normal: 1,
	NotNormal: 2,
	Rare: 3,
	VeryRare: 4,
	SuperRare: 5
}