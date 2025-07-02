import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { ChangeHistory } from '../ChangeHistory.js';
import { Item } from '../Item.js';
import { sanitizeString, wikiTitle } from '../Shared.js';
import { TextMap } from '../TextMap.js';
import { uploadPrompt } from '../util/General.js';
import { teardown } from '../util/JSONParser.js';
import { Template } from '../util/Template.js';

if (existsSync('./output/consumables')) {
	rmSync('./output/consumables/', { recursive: true })
}

const SHOP_KEYWORDS: string[] = [
	'exchange', 'shop', 'store', 'stall', 'vend', 'stand',
	'parcel', 'truck', 'depot', 'diner', 'trolley', 'teahouse',
	'nutritreasures', 'anderson', 'sleepless earl'
]
const SHOP_KEYWORD_MATCH = new RegExp(`(?:[^\\w]|^)(${SHOP_KEYWORDS.join('|')})(?:[^\\w]|$)`, 'i')
const sourceEntryLinkOverride = ['Omni-Synthesizer', 'Assignment', 'Simulated Universe']

const groupMap = {
	2000: 'Restorative Consumables',
	2001: 'Energy Regen Consumables',
	2003: 'Attack Consumables',
	2006: 'Defense Consumables',
	2009: 'Special Consumables'
}

for (const itemData of Object.values(await Item.itemData.main.get())) {
	if (itemData.ItemSubType != 'Food') continue

	const item = new Item(itemData)

	const output: string[] = []

	// const types = await item.getTypes()

	output.push(
		'<%-- [PAGE_INFO]',
		`PageTitle=#${item.pagetitle}#`,
		'[END_PAGE_INFO] --%>'
	)

	const infobox = new Template('Consumable Infobox')

	if (item.name != item.pagetitle) {
		infobox.addParam('title', item.name)
	}

	const recipe = await item.getRecipe()
	const img = await item.getImage()

	infobox
		.addParam('id', item.id)
		.addParam('image', img + uploadPrompt(item.icon_path, img, 'Consumable Icons'))
		.addParam('type', groupMap[item.group_id!])
		.addParam('rarity', item.rarity)
		.addParam('effect', item.effect.replaceAll('\n', '<br />'))
		.addParam('description', item.desc.replaceAll('\n', '<br />'))
		.addParam('effectType', '')
		.addParam('effectType2', '')
		.addParam('effectType3', '')
		.addParam('recipe', recipe ? `{{cx|Source missing}}` : '')
		.addParam('source1', '')
		.addParam('source2', '')
		.addParam('source3', '')

	const sources = await item.getSources()
	for (const [i, source] of sources.entries()) {
		const override = sourceEntryLinkOverride.find(link => source.includes(link))
		infobox.addParam(`source${i + 1}`, override ? source.replaceAll(override, `[[${override}]]`) : '[[' + source + ']]')
	}

	output.push(infobox.block())

	if (item.bg_desc) {
		output.push(`{{Description|${item.bg_desc.includes('=') ? '1=' : ''}${item.bg_desc.replaceAll('\n', '<br />')}}}`)
	}
	
	output.push(`'''${item.name}''' is a consumable that the player can ${recipe ? 'synthesize' : 'use'}.`)

	if (sources.find(src => SHOP_KEYWORD_MATCH.test(src) && !src.includes('Synthesize'))) {
		output.push(`\n==Sold By==\n{{Shop Availability}}`)
	}
	
	if (recipe) {
		const recipeTemplate = new Template('Recipe')
		
		recipeTemplate
			.addParam('type', 'Synthesis')
			.addParam('group', 'Consumable')
		
		recipe.data.forEach(({ item, count }) => recipeTemplate.addParam(wikiTitle(item.name, 'item'), count))
		
		recipeTemplate.addParam('sort', recipe.data.map(entry => wikiTitle(entry.item.name, 'item')).join(';'))
		
		output.push(
			'\n==Recipe==',
			recipeTemplate.block()
		)
	}

	// if (sources.find(src => src.match(/enem(?:y|ies)/i) || src.match(/equilibrium level/i))) {
	// 	output.push(`\n==Dropped By==\n{{Dropped By}}`)
	// }

	output.push(
		'\n==Other Languages==',
		await TextMap.generateOL(item.name_hash),
	)

	const [releaseVersion] = await ChangeHistory.item.main.findAdded(item.id.toString())
	output.push(
		'\n==Change History==',
		`{{Change History|${releaseVersion ?? `<!--unknown-->`}}}`,
		
		'\n==Navigation==',
		'{{Consumable Navbox}}'
	)

	mkdirSync(`./output/consumables/`, { recursive: true })
	writeFileSync(`./output/consumables/${sanitizeString(item.name)}-${item.id}.wikitext`, output.join('\n'))
}

teardown()