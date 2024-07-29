import { rm } from 'fs/promises';
import { dumpFile, files } from './util.js';

await rm('./output/file/vo/mission/', { recursive: true })

for (const [event, txtp] of Object.entries(files)) {
	if (event.toLowerCase().startsWith('ev_') || event.startsWith('Bank') || !event.includes('{l=en}')) continue
	// console.log(event, txtp)
	const segments = event.split('_')
	await dumpFile(`./output/file/vo/mission/${segments[0]}/${segments[1]}`, (!event.startsWith('vo_') ? 'vo_' : '') + event.replace(/[\(\{].+/, '').trim() + '.ogg', txtp)
}