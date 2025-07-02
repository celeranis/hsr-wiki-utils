import { mkdir, writeFile } from 'fs/promises';
import { ChangeHistory } from '../ChangeHistory.js';
import { Item } from '../Item.js';
import { ReadableSeries } from '../Readable.js';
import { sanitizeString, wikiTitle, zeroPad } from '../Shared.js';
import { TextMap } from '../TextMap.js';
import { teardown } from '../util/JSONParser.js';
import { getCharacterMentions, getFactionMentions } from '../util/Mentions.js';
import { Template } from '../util/Template.js';

await Item.loadFrom('main', 'readables')

for (const series of ReadableSeries.loadAll()) {
	const readables = series.getReadables()
	
	if (readables.length == 0) {
		console.warn(`Readable series "${series.name}" appears to be empty, skipping...`)
		continue
	}
	
	const pageTitle = wikiTitle(series.name, 'readableseries', series.id)
	const firstReadableItem = await Item.fromId(readables[0].id)?.getImage()
	
	if (!series.visible) {
		const output = readables.map(readable => `===${readable.name}===\n:${readable.content.replaceAll('<br />', '\n:').replaceAll('\n\n', '\n:<br />') }\n`)

		await mkdir(`./output/readables/Mission-Exclusive/`, { recursive: true })
		await writeFile(`./output/readables/Mission-Exclusive/${sanitizeString(series.name)}-${series.id}.wikitext`, output.join('\n'))
		
		continue
	}
	
	const output = [
		`<%-- [PAGE_INFO]`,
		`PageTitle=#${pageTitle}#`,
		`[END_PAGE_INFO] --%>`,
	]
	
	const infobox = new Template('Readable Infobox', {
		id: zeroPad(series.id, 3),
		partIds: readables.map(readable => readable.id).join(';'),
		title: pageTitle != series.name ? series.name : '',
		image: firstReadableItem,
		world: series.getWorld(),
		parts: readables.length,
		author: '<!--to be added-->',
		description: series.description.replaceAll('\n', '<br />'),
	})
	
	for (const [i, readable] of readables.entries()) {
		infobox.addParam(`part${i+1}`, readable.name)
		infobox.addParam(`source${i+1}`, '{{cx|Source missing}}')
	}
	
	let checkStrings = readables.map(book => [book.name, book.content]).flat(1)
	
	infobox.addParam('characters', getCharacterMentions(...checkStrings).join('; '))
	infobox.addParam('factions', getFactionMentions(...checkStrings).join('; '))
	
	output.push(
		infobox.block(12),
		`'''${series.name}''' is a ${readables.length > 1 ? `${readables.length}-part ` : ''}[[readable]] found on [[${series.getWorld()}]].`,
		'<!--',
		'==Location==',
		'{{Map Embed|<map name>|<marker id>}}',
		'-->',
		'==Text=='
	)
	
	for (const readable of readables) {
		if (readables.length > 1) {
			output.push(`===${readable.name}===`)
		}
		output.push(readable.content, '')
	}
	
	output.push(
		'<!--',
		'==Trivia==',
		'* ',
		'-->',
		'==Other Languages==',
		await TextMap.generateOL(series.name_hash),
		'',
		'==Change History==',
		`{{Change History|${(await ChangeHistory.readableSeries.findAdded(series.id))?.[0]}}}`
	)
	
	await mkdir(`./output/readables/${series.getWorld()}/`, { recursive: true })
	await writeFile(`./output/readables/${series.getWorld()}/${sanitizeString(series.name.replaceAll(',', ''))}-${series.id}.wikitext`, output.join('\n'))
}

teardown()