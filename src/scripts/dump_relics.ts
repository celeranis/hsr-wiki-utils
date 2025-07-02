import { existsSync } from 'fs';
import { mkdir, rm, writeFile } from 'fs/promises';
import { ChangeHistory } from '../ChangeHistory.js';
import { Item } from '../Item.js';
import { RelicSet } from '../Relics.js';
import { sanitizeString, wikiTitle } from '../Shared.js';
import { TextMap } from '../TextMap.js';
import { pageInfoHeader, uploadPrompt } from '../util/General.js';
import { teardown } from '../util/JSONParser.js';
import { Template } from '../util/Template.js';

const PARAM_KEYS = {
	HEAD: 'head',
	HAND: 'hand',
	BODY: 'body',
	FOOT: 'feet',
	OBJECT: 'planarsphere',
	NECK: 'linkrope'
} as const
const SETPARAM_VALUES = {
	HEAD: 'Head',
	HAND: 'Hand',
	BODY: 'Body',
	FOOT: 'Feet',
	OBJECT: 'Planar Sphere',
	NECK: 'Link Rope'
} as const

if (existsSync('./output/relics')) {
	await rm('./output/relics', { recursive: true })
}

await Item.loadFrom('main', 'relics')

for (const relicSet of RelicSet.loadAll()) {
	const setTitle = wikiTitle(relicSet.name, 'item', relicSet.display_item_id)
	
	const setInfobox = new Template('Relic Set Infobox', {
		id: relicSet.display_item_id,
		image1: `Item ${sanitizeString(setTitle)}.png` + uploadPrompt(relicSet.icon_path, `Item ${sanitizeString(setTitle)}.png`, 'Relic Icons'),
		type: relicSet.is_planar ? 'Planar Ornament' : 'Cavern Relic',
		'2pcBonus': relicSet.bonus2pc,
	})
	
	if (relicSet.bonus4pc) {
		setInfobox.addParam('4pcBonus', relicSet.bonus4pc)
	}

	const setFolder = `${sanitizeString(setTitle)}-${relicSet.id}`
	await mkdir(`./output/relics/${setFolder}`, { recursive: true })
	
	const relics = relicSet.getSetMembers()
	
	for (const relic of relics) {
		const relicTitle = wikiTitle(relic.name, 'item', relic.id)
		setInfobox.addParam(PARAM_KEYS[relic.slot], relicTitle)
		
		const relicInfobox = new Template('Relic Infobox', {
			id: relic.id,
			image: `Item ${sanitizeString(relicTitle)}.png` + uploadPrompt(relic.icon_path, `Item ${sanitizeString(relicTitle)}.png`, 'Relic Icons'),
			set: setTitle,
			piece: SETPARAM_VALUES[relic.slot] as any,
			mentions: ''
		})
		
		const relicOutput: string[] = [
			pageInfoHeader(relicTitle),
			relicInfobox.block(9),
			`{{Description|${relic.story_intro.trim().replaceAll('\n', '<br />')}}}`,
			`'''${relic.name}''' is a [[Relic]] in the set ${setTitle == relicSet.name ? `[[${setTitle}]]` : `[[${setTitle}|${relicSet.name}]]`}.`,
			'\n==Description==',
			relic.story.trim().replaceAll(/(?<!\n)\n(?!\n)/g, '<br />'),
			'\n==Other Languages==',
			await TextMap.generateOL(relic.name_hash),
			'\n==Change History==',
			`{{Change History|${(await ChangeHistory.item.relics.findAdded(relic.id))?.[0] ?? '<!--unknown-->'}}}`
		]
		
		await writeFile(`./output/relics/${setFolder}/${relic.name}-${relic.slot}.wikitext`, relicOutput.join('\n'))
	}
	
	const source = (await relicSet.display_item?.getSources())?.filter(src => src != 'Synthesize Relics')?.[0] ?? '{{cx|Source missing}}' // TODO: make it not suck
	
	setInfobox
		.addParam('rarity', '2345')
		.addParam('source2.1', `[[${source}]]`)
		.addParam('source3.1', `[[${source}]]`)
		.addParam('source4.1', `[[${source}]]`)
		.addParam('source5.1', `[[${source}]]`)
		.addParam('source5.2', '[[Synthesize Relics]]')
		.addParam('utility1', '')
		.addParam('utility2', '')
		.addParam('utility3', '')
	
	const setOutput: string[] = [
		pageInfoHeader(setTitle),
		setInfobox.block(12),
		`'''${relicSet.name}''' is a ${relicSet.is_planar ? '[[Relic#Planar Ornaments|Planar Ornament]]' : 'Cavern'} [[Relic/Sets|Relic Set]] that can be obtained by challenging [[${source}]] in 2-5{{Icon/Stars|1}} rarities.`,
		'\n==Lore==',
		"This Relic Set's story is based on {{tx}}.",
		`{{Relic Lore|${setTitle}}}`,
		'\n==Other Languages==',
		await TextMap.generateOL(relicSet.name_hash),
		'\n==Change History==',
		`{{Change History|${(await ChangeHistory.item.main.findAdded(relicSet.display_item_id))?.[0] ?? '<!--unknown-->'}}}`,
		'\n==Navigation==',
		'{{Relic Set Navbox}}'
	]
	
	await writeFile(`./output/relics/${setFolder}/${setFolder}.wikitext`, setOutput.join('\n'))
}

teardown()