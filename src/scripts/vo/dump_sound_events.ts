import { readFileSync, writeFileSync } from 'fs';
import { readdir } from 'fs/promises';
import config from '../../../config.json' with { "type": "json" };

const root = config.local_roots[config.target_version]

const results = new Set<string>()

function addKey(key: string) {
	if (key.startsWith('Ev_')) {
		results.add(key)
	}
}

function addObjects(obj: object) {
	for (const value of Object.values(obj)) {
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
	}
}

writeFileSync(`./output/SoundEvents.json`, [...results.values()].join('\n'))