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
				`|${whitespace(key)}=${String(value).match(/\n|(?:^(?:\*|:|#))/) ? `\n${value}` : ` ${value}`}`
			),
			'}}'
		]
		return output.join('\n')
	}
	
	inline(): string {
		return `{{${this.name}|${Object.entries(this.params).map(([key, value]) => Number(key) ? value : `${key}=${value}`).join('|')}}}`
	}
}