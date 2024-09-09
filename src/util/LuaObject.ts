interface JsonLuaOptions {
	single_line_levels?: number[] | true
	basic_key_levels?: number[] | true
}

export function jsonToLua(obj: unknown, options: JsonLuaOptions = {}, level: number = 1) {
	if (typeof(obj) == 'number' || typeof(obj) == 'string') {
		return JSON.stringify(obj)
		
	} else if (typeof(obj) == 'undefined' || obj == null) {
		return 'nil'
		
	} else if (typeof (obj) == 'object') {
		const output: string[] = ['{']
		
		const useSingleLine = options.single_line_levels == true || options.single_line_levels?.includes(level)
		const useBasicKeys = options.basic_key_levels == true || options.basic_key_levels?.includes(level)

		const indent = useSingleLine ? '' : '\t'.repeat(level)
		
		if (Array.isArray(obj)) {
			for (const value of obj) {
				output.push(indent + `${jsonToLua(value, options, level + 1)},`)
			}
		} else {
			const entries = Object.entries(('toJSON' in obj && typeof (obj.toJSON) == 'function') ? obj.toJSON() : obj)
			const lastKey = entries[entries.length - 1]?.[0]
			for (const [key, value] of entries) {
				const luaKey = (useBasicKeys && !key.match('%W')) ? key : `[${jsonToLua(key, options)}]`
				output.push(indent + `${luaKey} = ${jsonToLua(value, options, level + 1)}${(useSingleLine && key == lastKey) ? '' : ','}`)
			}
		}
		output.push((useSingleLine ? '' : '\t'.repeat(level - 1)) + '}')
		
		return output.join(useSingleLine ? ' ' : '\n')
	} else {
		throw new TypeError(`${String(obj)} is of invalid type "${typeof(obj)}"`)
	}
}