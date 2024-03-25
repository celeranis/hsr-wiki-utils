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
	}
}

export class Template<N extends keyof TemplateMap, P extends Record<string, string | number | boolean> = TemplateMap[N]> {
	constructor(public name: N, public params: Partial<P> = {}) {}
	
	addParam<K extends keyof P>(key: K, value: P[K]) {
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
	
	block(minTargetIndent: number = 0): string {
		const targetIndent = Math.max(minTargetIndent, ...Object.keys(this.params).map(key => key.length)) + 1
		const output = [
			`{{${this.name}`,
			...Object.entries(this.params).map(([key, value]) => 
				`|${whitespace(key, targetIndent)}=${String(value).match(/\n|(?:^(?:\*|:|#))/) ? `\n${value}` : ` ${value}`}`
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
}