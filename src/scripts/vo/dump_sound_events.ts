import { readFileSync, writeFileSync } from 'fs';
import { readdir } from 'fs/promises';
import config from '../../../config.json' with { "type": "json" };
import { getFile } from '../../files/GameFile.js';
import { AvatarVOEntry } from './util.js';

const root = config.local_roots[config.target_version]

const results = new Set<string>()

const characters = (await getFile<AvatarVOEntry[]>('ExcelOutput/AvatarVO.json')).map(entry => entry.VOTag)

for (let i = 0; i < 20; i++) {
	characters.push(i.toString())
}

function addKey(key: string, addAll?: boolean) {
	if (key.startsWith('Ev_') || addAll) {
		if (key.includes('{0}')) {
			characters.forEach(char => {
				let skey = key.replaceAll(`{0}`, char)
				if (skey.includes(`{1}`)) {
					characters.forEach(char => results.add(skey.replaceAll(`{1}`, char)))
				} else {
					results.add(skey)
				}
			})
		} else {
			results.add(key)
		}
	}
}

function addObjects(obj: object, addAll?: boolean) {
	if (obj == null) return
	for (const value of Object.values(obj)) {
		switch (typeof value) {
			case 'string':
				addKey(value, addAll)
				break
			case 'object':
				if (value && '$type' in value) {
					const type = value.$type
					if (typeof(type) == 'string' && type.includes('Audio')) {
						addObjects(value, true)
						break
					}
				}
				addObjects(value, addAll)
				break
		}
	}
}

addObjects(await getFile('Config/AudioConfig.json'), true)

for (const file of await readdir(root, { recursive: true, withFileTypes: true })) {
	if (file.isFile() && !file.path.includes('TextMap') && file.name.endsWith('.json')) {
		const contents = JSON.parse(readFileSync(`${file.path}\\${file.name}`).toString())
		addObjects(contents)
	}
}

writeFileSync(`./output/SoundEvents.txt`, [...results.values()].join('\n'))