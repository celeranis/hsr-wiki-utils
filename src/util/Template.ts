import { whitespace } from './General.js'

export interface TemplateMap {
	'Curio Information': {
		name: string
		displayname?: string
		image?: string
		price: string | number
		effect: string
		story: string
		notes: string
		available: string
		mentions: string
	}
	'Item': {
		1: string
		name: string
		2: string | number
		size: string | number
		x: string | number
		count: string | number
		link?: string
		text?: string
		notext?: boolean
		type: 'Item' | 'Curio' | 'Character' | 'Dice Face' | 'Readable'
		newline?: boolean
	},
	'File': {
		characters?: string
		category: string
		categories: string
		sourcelink1?: string
		sourcelabel1?: string
		sourcelink2?: string
		sourcelabel2?: string
		sourcelink3?: string
		sourcelabel3?: string
		artistlink?: string
		lang?: string
		date?: string
		caption?: string
		description?: string
		transcription?: string
		alt?: string
	},
	'Item Infobox': {
		title?: string
		id: number
		image: string
		type: string
		invCategory?: string
		group?: string
		rarity: number
		effect: string
		description: string
	} & {[T in `type${number}`]: string} & {[T in `source${number}`]: string},
	'Consumable Infobox': {
		id: number
		title?: string
		image: string
		type: string
		rarity: number
		effect: string
		description: string
		effectType: string
		effectType2: string
		effectType3: string
		effectType4?: string
		recipe: string
	} & { [T in `source${number}`]: string },
	'Recipe': {
		type: string
		group: string
		[itemName: string]: string | number
		sort: string
	},
	'Domain Infobox': {
		title: string
		image: string
		type: DomainType
		type2?: DomainSubtype
		mechanism: string
		boss?: string
		description?: string
		domain?: string
		world?: string
		region?: string
		area?: string
		subarea?: string
		requiredEL: string | number
		recLevel: string | number
		recTypes: string
		cost: number
		drops: string
		drops_delim?: string
		rewards: string
	},
	'Mission Infobox': {
		id: number,
		title: string
		image: string
		caption: string
		type: string
		chapter: string
		event_name: string
		npc: string
		description: string
		requirements: string
		summary: string
		characters: string
		startLocation: string
		world: string
		area: string
		subarea: string
		prev: string
		next: string
		rewards: string
	} & { [T in `next${number}`]: string } & { [T in `prev${number}`]: string },
	'Equation': {
		name: string
		rarity: '1' | '2' | '3' | 'boundary'
		path1: string
		path2: string
		effect: string
		story: string
	},
	'Location Infobox': {
		name?: string
		title: string,
		image: string,
		type: 
			| 'World' | 'Region' | 'Area' | 'Bulletin Board' | 'Shop' 
			| 'Space Anchor' | 'Game System' | 'Subarea' 
			| 'Point of Interest' | 'World Shop' | 'Store' | 'Galaxy'
			| 'Star System' | 'Civilization',
		world: string,
		region: string,
		area: string,
		subarea: string
	},
	'Readable Infobox': {
		id: string
		partIds: string
		title: string
		image: string
		world: string
		parts: number
		author: string
		description: string
		characters: string
		factions: string
	} & { [T in `part${number}`]: string } & { [T in `source${number}`]: string },
	'Tutorial': {
		sort: number
		title: string
		subtitle: string
		type: string
		about: string
	} & { [T in `image${number}`]: string } & { [T in `text${number}`]: string },
	'Relic Set Infobox': {
		id: number
		image1: string
		type: 'Planar Ornament' | 'Cavern Relic'
		'2pcBonus': string
		'4pcBonus'?: string
		head?: string
		hand?: string
		body?: string
		feet?: string
		planarsphere?: string
		linkrope?: string
		rarity: string
		utility1: string
		utility2: string
		utility3: string
	} & { [T in `source${number}.${number}`]: string },
	'Relic Infobox': {
		id: number
		image: string
		set: string
		piece: 'Head' | 'Hand' | 'Body' | 'Feet' | 'Planar Sphere' | 'Link Rope'
		mentions: string
	},
	'Possible Outcomes': 
		& { [T in `choice${string}`]: string }
		& { [T in `result${string}`]: string }
		& { [T in `chance${string}`]: string }
		& { [T in `path${string}`]: string }
		& { [T in `modes${string}`]: string },
	'Soundtrack Infobox': {
		title: string
		image: string
		album: string
		disc: string
		number: number
		youtube_id: string
		spotify_id: string
		during: string
		previous: string
		next: string
	},
	'Messages Infobox': {
		id: number
		name?: string
		image: string
		type: string
		sender?: string
		participants?: string
		signature?: string
		faction?: string
	},
	'Simulated Universe Event Infobox': {
		id: string
		title: string
		image: string
		sound?: string
		event_name?: string
		domains_su: string
		domains_ext: string
		domains_swarm: string
		domains_gng: string
		domains_du: string
		domains_und: string
		requirements: string
		prev: string
		next: string
		indexRewards?: string
		characters: string
		factions: string
		order: string
		order_du: string
	}
	'Scepter Information': {
		name: string
		displayname?: string
		image?: string
		type: string
		unlock: string
		effect: string
		story: string
		notes: string
		mentions: string
	}
	'Component Information': {
		name: string
		displayname?: string
		image?: string
		alignment: string
		unlock: string
		effect: string
		notes: string
	}
	'SU Ability': any
	'Equation Infobox': {
		title?: string
		image?: string
		period: string
		rarity: 'boundary' | '1' | '2' | '3'
		effect: string
		path1: string
		path2: string
		mentions: string
	}
}

export type DomainType = 
	| 'Calyx (Golden)' | 'Calyx (Crimson)' | 'Cavern of Corrosion' | 'Stagnant Shadow' | 'Echo of War' 
	| 'Trailblaze Mission' | 'Companion Mission' | 'Adventure Mission' | 'One-Time' | 'Event'
	| 'Level' | 'Excursion' | 'Simulated Universe'

export type DomainSubtype = 'World' | 'Warring' | 'Exploratory'

export class Template<N extends keyof TemplateMap, P extends TemplateMap[N]> {
	constructor(public name: N, public params: Partial<P> = {}) {}
	newlinesAfter: string[] = []

	addParam<K extends keyof P>(key: K, value?: P[K]) {
		if (value == undefined) return this
		
		if (typeof value == 'boolean') {
			value = (value ? '1' : '') as P[K]
		}
		this.params[key] = value
		return this
	}

	removeParam(key: keyof P) {
		delete this.params[key]
		return this
	}

	getParam<K extends keyof P>(key: K): P[K] | undefined {
		return this.params[key]
	}

	addNewlineAfter(param: string) {
		this.newlinesAfter.push(param)
		return this
	}

	block(minTargetIndent: number = 0): string {
		const targetIndent = Math.max(minTargetIndent, ...Object.keys(this.params).map(key => key.length)) + 1
		const output = [
			`{{${this.name}`,
			...Object.entries(this.params).filter(([key, value]) => value !== undefined).map(([key, value]) =>
				(`|${whitespace(key, targetIndent)}=${String(value).match(/\n|(?:^(?:\*|:|#))/) ? `\n${value}` : ` ${value}`}`)
				+ (this.newlinesAfter.includes(key) ? '\n' : '')
			),
			'}}'
		]
		return output.join('\n')
	}

	inline(): string {
		return `{{${this.name}|${Object.entries(this.params).map(([key, value]) => Number(key) ? value : `${key}=${value}`).join('|')}}}`
	}

	static addParamValue(input: string, name: string, value: string | number) {
		const regex = new RegExp(`(\\|${name}\\s*=\\ *)[^\|}]*?\\n*(\\r?\\n?(?:\\||}}))`)
		if (regex.test(input)) {
			return input.replace(regex, `$1${value}$2`)
		} else {
			return null
		}
	}

	static getParamValue(input: string, name: string) {
		const regex = new RegExp(`\\|${name}\\s*=\\s*?(.*?)\\s*(?:\\||}})`)
		return input.match(regex)?.[1]?.trim()
	}

	static pageData(title: string, contentModel: string = 'wikitext', contentFormat: string = 'text/x-wiki'): string {
		return [
			`<%-- [PAGE_INFO]`,
			`    pageTitle = #${title}#`,
			`    contentModel = #${contentModel}#`,
			`    contentFormat = #${contentFormat}#`,
			`[END_PAGE_INFO] --%>`
		].join('\n')
	}
}