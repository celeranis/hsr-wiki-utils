import { readFileSync, writeFileSync } from 'fs';
import { readdir } from 'fs/promises';
import config from '../../config.json' with { "type": "json" };
import { TextMap } from '../TextMap.js';

const root = config.local_roots[config.target_version]

const results: Record<string, string> = {}

function addKey(key: string) {
	results[TextMap.getStableHash(key)] = key
	if (!key.match(/^(?:ADF_|MDF|_)/i)) {
		results[TextMap.getStableHash(`ADF_${key}`)] = `ADF_${key}`
		results[TextMap.getStableHash(`MDF_${key}`)] = `MDF_${key}`
		results[TextMap.getStableHash(`_${key}`)] = `_${key}`
	}
}

function addObjects(obj: object) {
	const array = Array.isArray(obj)
	for (const [key, value] of Object.entries(obj)) {
		if (!array) addKey(key)
		switch (typeof value) {
			case 'string':
				addKey(value)
				break
			case 'object':
				addObjects(value)
				break
		}
	}
}

for (const file of await readdir(root, { recursive: true, withFileTypes: true })) {
	if (file.isFile() && !file.path.includes('TextMap') && file.name.endsWith('.json')) {
		const contents = JSON.parse(readFileSync(`${file.path}\\${file.name}`).toString())
		addObjects(contents)
		// for (const match of contents.matchAll(/"(?:From|To)?DynamicKey": "(.+?)"/gi)) {
		// 	results[TextMap.getStableHash(match[1])] = match[1]
		// }
	}
}

writeFileSync(`./output/ValueHashMap.json`, JSON.stringify(results, null, '\t'))