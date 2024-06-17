import { readFile, readdir, writeFile } from 'fs/promises';
import config from '../../../config.json' with { "type": "json" };

const loadFrom = config.asset_roots.TXTP + '\\english'

const ALL_DATA: Record<string, SoundData[]> = {}

export interface SoundData {
	file: string
	number: number
	index: number
	speed_state?: 1 | 2
}

const dir = await readdir(loadFrom, { withFileTypes: true, recursive: false })
for (const file of dir) {
	if (!file.isFile() || !file.name.endsWith('.txtp')) continue
	const content = (await readFile(file.path + '/' + file.name)).toString()
	
	for (const [, name, data] of content.matchAll(/\- hashname: (.+?)\r?\n(.+?)(?:CAkEvent|$)/gsi)) {
		ALL_DATA[name] ??= []
		const count = [...data.matchAll(/CAkSound\[(\d+)\] (.+?) \/ (.+?)\r?\n/gis)].length
		// console.log(count)
		for (const [, num, index, sound] of data.matchAll(/CAkSound\[(\d+)\] (.+?) \/ (.+?)\r?\n/gis)) {
			const soundData: SoundData = {
				file: count <= 1 ? `${file.path}\\${file.name}` : `${config.asset_roots.Audio}\\english\\${sound}`,
				number: parseInt(num),
				index: parseInt(index)
			}
			if (data.includes('State_Battle_Speed=54353430')) {
				soundData.speed_state = 2
			} else if (data.includes('State_Battle_Speed=3023464624')) {
				soundData.speed_state = 1
			}
			ALL_DATA[name].push(soundData)
		}
	}
}

await writeFile('./output/VO_Map.json', JSON.stringify(ALL_DATA, null, '\t'))