import { PostfixExpr } from '../files/graph/Dialog.js'
import { TextMap } from '../TextMap.js'
import type { DialogueTaskEntry } from './Dialogue.js'

export interface EnvData {
	main_mission_id?: number
	sub_mission_id?: number
	performance_id?: number
}

const DATA_KEYS: (keyof EnvData)[] = ['main_mission_id', 'sub_mission_id', 'performance_id']

export class GraphEnvironment {
	main_mission_id?: number
	sub_mission_id?: number
	performance_id?: number
	has_conditional: boolean = false
	has_definite_conditional: boolean = false
	
	characters = new Set<string>()
	
	post_mission: DialogueTaskEntry[] = []
	
	dynamic_values: Record<string, DynamicValue> = {}
	
	registerPostMissionDialogue(item: DialogueTaskEntry) {
		this.post_mission.push(item)
	}
	
	getDynamicValueByHash(hash: number | bigint, create: true): DynamicValue
	getDynamicValueByHash(hash: number | bigint, create?: boolean): DynamicValue | undefined
	getDynamicValueByHash(hash: number | bigint, create?: boolean) {
		const hashed = this.dynamic_values[hash.toString()]
		if (hashed) {
			return hashed
		}
		
		if (create) {
			const newDV = new DynamicValue(this, hash)
			this.dynamic_values[hash.toString()] = newDV
			return newDV
		}
	}
	
	getDynamicValueByName(name: string, create: true): DynamicValue
	getDynamicValueByName(name: string, create?: boolean): DynamicValue | undefined
	getDynamicValueByName(name: string, create?: boolean) {
		const named = Object.values(this.dynamic_values).find(dv => dv.name == name)
		if (named) return named
		
		const hash = TextMap.getStableHash(name)
		const hashed = this.getDynamicValueByHash(hash, create)
		if (hashed) {
			hashed.name = name
			return hashed
		}
	}
	
	evaluatePostfix(postfix: PostfixExpr): number | undefined {
		const dynamicValues = postfix.DynamicHashes.map(hash => this.getDynamicValueByHash(hash, true))
		const fixedValues = postfix.FixedValues.map(val => val.Value)
		const actions = Buffer.from(postfix.OpCodes, 'base64')
		let postfixStack: number[] = []
		
		for (let i = 0; i < actions.length; i++) {
			switch (actions[i]) {
				case 0x00: // insert fixed value
					i += 1
					postfixStack.push(fixedValues[actions[i]])
					break
				case 0x01: // insert dynamic value
					i += 1
					const val = dynamicValues[actions[i]].value
					if (val == undefined) return undefined
					postfixStack.push(val)
					break
				case 0x02: // add top two
					postfixStack.push(postfixStack.pop()! + postfixStack.pop()!)
					break
				case 0x03: // subtract top two
					postfixStack.push(postfixStack.pop()! - postfixStack.pop()!)
					break
				case 0x04: // multiply top two
					postfixStack.push(postfixStack.pop()! * postfixStack.pop()!)
					break
				case 0x05: // divide top two
					postfixStack.push(postfixStack.pop()! / postfixStack.pop()!)
					break
				case 0x0a: // return
					const returning = postfixStack.pop()
					if (Number.isNaN(returning)) {
						return undefined
					}
					return returning
				default:
					throw new Error(`Unknown operation ${actions[i]} found in postfix: ${actions.toJSON().data}`)
			}
		}
	}
	
	displayPostfix(postfix: PostfixExpr): string {
		const dynamicValues = postfix.DynamicHashes.map(hash => this.getDynamicValueByHash(hash, true))
		const fixedValues = postfix.FixedValues.map(val => val.Value)
		const actions = Buffer.from(postfix.OpCodes, 'base64')
		let postfixStack: string[] = []

		for (let i = 0; i < actions.length; i++) {
			switch (actions[i]) {
				case 0x00: // insert fixed value
					i += 1
					postfixStack.push(fixedValues[actions[i]].toString())
					break
				case 0x01: // insert dynamic value
					i += 1
					const dv = dynamicValues[actions[i]]
					postfixStack.push(dv?.name || `[${dv.hash}]`)
					break
				case 0x02: // add top two
					postfixStack.push(`(${postfixStack.pop()!} + ${postfixStack.pop()!})`)
					break
				case 0x03: // subtract top two
					postfixStack.push(`(${postfixStack.pop()!} – ${postfixStack.pop()!})`)
					break
				case 0x04: // multiply top two
					postfixStack.push(`(${postfixStack.pop()!} × ${postfixStack.pop()!})`)
					break
				case 0x05: // divide top two
					postfixStack.push(`(${postfixStack.pop()!} / ${postfixStack.pop()!})`)
					break
				case 0x0a: // return
					return postfixStack.pop() || ''
				default:
					throw new Error(`Unknown operation ${actions[i]} found in postfix: ${actions.toJSON().data}`)
			}
		}
		
		return postfixStack.pop() || ''
	}
	
	applyData(env?: EnvData) {
		if (!env) return
		for (const [k, v] of Object.entries(env)) {
			if (!DATA_KEYS.includes(k as keyof EnvData)) continue
			this[k] = v
		}
	}
}

export class DynamicValue {
	constructor(public environment: GraphEnvironment, public hash: number | bigint, public name?: string) { }
	
	private _static_value?: number
	postfix?: PostfixExpr
	
	get value(): number | undefined {
		if (this._static_value != undefined) {
			return this._static_value
		}
		if (this.postfix != undefined) {
			return this.environment.evaluatePostfix(this.postfix)
		}
	}
	
	set value(val: number | PostfixExpr) {
		if (typeof val == 'number') {
			this._static_value = val
			delete this.postfix
		} else {
			delete this._static_value
			this.postfix = val
		}
	}
}