import { rm } from 'node:fs/promises';
import { teardown } from '../../util/JSONParser.js';
import { dumpFile, files } from './util.js';

await rm('./output/file/vo/mission/', { recursive: true })

const ONLY = [
	'_side2_baishi_',
	'_chapter2_9_',
	'_chapter2_10_',
	'_side2_yunli_'
]
const ONLY_ENABLED = false

for (let [event, txtp] of Object.entries(files)) {
	// if (event.includes('yunli')) console.log(event)
	if ((event.toLowerCase().startsWith('ev_') && !event.toLowerCase().includes('_activity_')) || event.startsWith('Bank') || !event.includes('{l=en}')) continue
	if (ONLY_ENABLED && !ONLY.find(pattern => event.includes(pattern))) {
		continue
	}
	event = event.replace(/^Ev_Vo_/i, '')
	// console.log(event, txtp)
	const segments = event.split('_')
	await dumpFile(`./output/file/vo/mission/${segments[0]}/${segments[1]}`, (!event.startsWith('VO_') ? 'VO_' : '') + event.replace(/[\(\{].+/, '').trim() + '.ogg', txtp)
}

teardown()