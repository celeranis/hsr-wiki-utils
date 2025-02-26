import { mkdir, writeFile } from 'fs/promises';
import { BlessingGroup } from '../Blessing.js';
import { ChangeHistory } from '../ChangeHistory.js';
import { Item } from '../Item.js';
import { displaySUMode, OccurrenceSeries, RogueImage } from '../Occurrence.js';
import { sanitizeString, wikiTitle, zeroPad } from '../Shared.js';
import { TextMap } from '../TextMap.js';
import { pageInfoHeader } from '../util/General.js';
import { Template } from '../util/Template.js';

await mkdir('./output/occurrences/', { recursive: true })
await Item.loadFrom('main')
BlessingGroup.loadAll()

const IMAGE_ID_MAP = {
	101: 'Occurrence Default.png',
	102: 'Occurrence History Fictionologists.png',
	103: 'Occurrence Pixel World.png',
	104: 'Occurrence Inorganic Lifeform.png',
	105: 'Occurrence IPC.png',
	106: 'Occurrence Ruan Mei.png',
	107: 'Occurrence Trotters.png',
	108: 'Occurrence Salesperson.png',
	109: 'Occurrence Twins.png',
	110: 'Occurrence Battle.png',
	111: 'Occurrence Trade.png',
	112: 'Occurrence Knights of Beauty to the Rescue.png',
	113: 'Occurrence Cosmic Beauty Bugs.png',
	114: 'Occurrence Beast Horde.png',
	115: 'Occurrence Swarm.png',
	116: 'Occurrence Ruan Mei 2.png',
	117: 'Occurrence Yu Qingtu.png',
	118: 'Occurrence Hair Salon Guild.png',
	119: 'Occurrence Genius Society.png',
	120: 'Occurrence Screwllita.png',
	121: 'Occurrence Fortune Telling.png',
	122: 'Occurrence Machine Empire.png',
	123: 'Occurrence Dangerous Feeding.png',
	124: 'Occurrence The Returning Heliobus.png',
	125: 'Occurrence Trashcan.png',
	126: 'Occurrence Ternary.png',
	127: 'Occurrence Ruan Mei 3.png',
	128: 'Occurrence Contest.png',
	129: 'Occurrence Gift Box.png',
	130: 'Occurrence Trash Steed.png',
	131: 'Occurrence Ape.png',
	132: 'Occurrence Ceremony.png',
}

for (const occurrence of Object.values(await OccurrenceSeries.loadAllAbstract())) {
	const firstOccurrence = occurrence.occurrences.find(occ => occ.mode != 'du') ?? occurrence.occurrences[0]
	
	let duOccurrence = occurrence.occurrences.find(occ => occ.mode == 'du')
	
	const infobox = new Template('Simulated Universe Event Infobox')
		.addParam('id', occurrence.id)
		.addParam('title', firstOccurrence.name != wikiTitle(firstOccurrence.name) ? firstOccurrence.name : '')
		.addParam('image', IMAGE_ID_MAP[firstOccurrence.image_id] ?? `<!--TBA: ${RogueImage[firstOccurrence.image_id]?.ImagePath}-->`)
		.addParam('domains_su', occurrence.modes.includes('su') ? 'Unknown' : '')
		// .addParam('domains_ext', '')
		.addParam('domains_swarm', occurrence.modes.includes('swarm') ? 'Unknown' : '')
		.addParam('domains_gng', occurrence.modes.includes('gng') ? 'Unknown' : '')
		.addParam('domains_du', occurrence.modes.includes('du') ? 'Unknown' : '')
		.addParam('domains_und', occurrence.modes.includes('und') ? 'Unknown' : '')
		.addParam('requirements', '')
		.addParam('prev', '')
		.addParam('next', '')
		.addParam('characters', '')
		.addParam('factions', '')
		.addParam('order', firstOccurrence.order ? zeroPad(firstOccurrence.order, 3) : '')
		.addParam('order_du', duOccurrence?.order_du ? zeroPad(duOccurrence.order_du, 3) : '')
		
	const output: string[] = [
		pageInfoHeader(wikiTitle(firstOccurrence.name)),
		'{{Stub}}',
		infobox.block(13),
		`'''${firstOccurrence.name}''' is an [[${occurrence.modes.includes('du') ? 'Divergent' : 'Simulated'} Universe/Occurrence|Occurrence]] in ${displaySUMode(occurrence.modes[0], true)}${occurrence.modes.length > 1 && occurrence.modes.includes('du') ? ' and [[Divergent Universe]]' : ''}.`,
		'',
		'==Possible Outcomes==',
		'{{Possible Outcomes'
	]
	
	for (let [i, option] of occurrence.options.entries()) {
		if (option.choice == '' && option.result == '') continue
		i += 1
		output.push(
			`|choice_${i} = ${option.choice}`,
			`|result_${i} = ${option.result}`
		)
		
		if (option.path) {
			output.push(`|path_${i}   = ${option.path}`)
		}
		
		if (option.modes.toString() != occurrence.active_modes.toString()) {
			output.push(`|modes_${i}  = ${option.modes.join(',') }`)
		}
		
		output.push('')
	}
	
	output.push(
		'}}',
		'<!--',
		'==Gameplay Notes==',
		'* ',
		'-->',
		'==Dialogue==',
		'{{Dialogue Start}}',
	)
	
	if (occurrence.active_occurrences.length == 1) {
		const dialogue = await firstOccurrence.loadDialogue()
		
		output.push(
			(await dialogue?.optimize()?.wikitext()) || '',
		)
		const unused = (await dialogue?.unusedWikitext())?.join('\n\n')
		if (unused) {
			output.push('', unused)
		}
	} else {
		output.push(':{{tx}}')
	}
	
	output.push(
		'{{Dialogue End}}',
		'',
		'==Other Languages==',
		await TextMap.generateOL(firstOccurrence.name_hash),
		'',
		'==Change History==',
		`{{Change History|${(await ChangeHistory.occurrences.findAdded(firstOccurrence.series.id))[0]}}}`,
		'',
		'==Navigation==',
		'{{Occurrence Navbox}}'
	)
	
	const container = `./output/occurrences/${sanitizeString(firstOccurrence.name)}-${occurrence.id}`
	await mkdir(container, { recursive: true })
	
	await writeFile(`${container}/${sanitizeString(firstOccurrence.name)}-${occurrence.id}.wikitext`, output.join('\n'))
	
	for (const occurrenceVariant of occurrence.occurrences) {
		const dialogue = await occurrenceVariant.loadDialogue()
		
		const voutput: string[] = []
		voutput.push(
			'{{Dialogue Start}}',
			(await dialogue?.optimize()?.wikitext()) || '',
		)
		
		const unused = (await dialogue?.unusedWikitext())?.join('\n\n')
		if (unused) {
			voutput.push('', unused)
		}
		
		voutput.push(
			// '<nowiki>\n' + dialogue?.toJSON() + '\n</nowiki>',
			'{{Dialogue End}}'
		)
		await writeFile(`${container}/${occurrenceVariant.mode}-${sanitizeString(occurrenceVariant.name)}${occurrenceVariant.progress ? '-' + occurrenceVariant.progress : ''}.wikitext`, voutput.join('\n'))
	}
}