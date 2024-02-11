import { mkdirSync, writeFileSync } from 'fs';
import { Item } from '../Item.js';
import { n, sanitizeString } from '../Shared.js';
import { TextMap } from '../TextMap.js';
import { ItemSubType } from '../files/Item.js';
import { Template } from '../util/Template.js';

await Item.loadAll()

const SKIP_TYPES: ItemSubType[] = ['AetherSpirit', 'AvatarCard', 'Book', 'Formula', 'HeadIcon']
const SHOP_KEYWORDS: string[] = [
	'exchange', 'shop', 'store', 'stall', 'vend', 'stand', 
	'parcel', 'truck', 'depot', 'diner', 'trolley', 'teahouse', 
	'nutritreasures', 'anderson', 'sleepless earl'
]
const sourceEntryLinkOverride = ['Omni-Synthesizer', 'Assignment']

const typeLinkOverride = {
	'Dreamscape Pass Sticker': '[[Dreamscape Pass]] Sticker'
}

for (const [source, data] of Object.entries(Item.itemData)) {
	for (const itemData of Object.values(data.data!)) {
		if (SKIP_TYPES.includes(itemData.ItemSubType)) continue
		
		const item = new Item(itemData)
		
		const output: string[] = []
		
		const types = await item.getTypes()
		
		const pageTitle = item.name
			.replaceAll('#', '')
			.replaceAll(/<.+?>/g, '')
			.replaceAll("''", '')
		
		output.push(
			'<%-- [PAGE_INFO]',
			`PageTitle=#${pageTitle}#`,
			'[END_PAGE_INFO] --%>'
		)
		
		if (types.includes('Dreamscape Pass Sticker')) {
			output.push('{{Stub|Location information}}')
		}
		
		const infobox = new Template('Item Infobox')
		
		if (item.name != pageTitle) {
			infobox.addParam('title', item.name)
		}
		
		infobox
			.addParam('id', item.id)
			.addParam('image', await item.getImage())
			.addParam('type', types[0] || '')
		
		for (const [i, type] of types.entries()) {
			if (i == 0) continue
			infobox.addParam(`type${i + 1}`, type)
		}
		
		infobox
			.addParam('invCategory', item.inventory_tab || '')
			.addParam('rarity', item.rarity)
			.addParam('effect', item.effect.replaceAll('\n', '<br />'))
			.addParam('description', item.desc.replaceAll('\n', '<br />'))
		
		const sources = await item.getSources()
		for (const [i, source] of sources.entries()) {
			const override = sourceEntryLinkOverride.find(link => source.includes(link))
			infobox.addParam(`source${i + 1}`, override ? source.replaceAll(override, `[[${override}]]`) : '[[' + source + ']]')
		}
		
		output.push(infobox.block())
		
		if (item.bg_desc) {
			output.push(`{{Description|${item.bg_desc.includes('=') ? '1=' : ''}${item.bg_desc.replaceAll('\n', '<br />')}}}`)
		}
		
		switch (item.purpose_id) {
			case 2:
				const forType = item.desc.match(/Ascension of (\w+) characters/)?.[1]
				output.push(`'''${item.name}''' is a ${item.rarity}-star [[Character Ascension Material]]. It is used to ascend characters of the {{Color|${forType}|link=1}} type.`)
				break
				
			case 3:
				output.push(`'''${item.name}''' is a ${item.rarity}-star [[Trace Material]] and [[Light Cone Ascension Material]].`)
				break
			
			case 7:
				output.push(`'''${item.name}''' is a ${item.rarity}-star [[Trace Material]] and [[Character Ascension Material]].`)
				break
			
			case 17:
				output.push(`'''${item.name}''' is a Tier-${item.rarity} [[Synthesis Material]].`)
				break
			
			default:
				const firstType = types[0] || 'Item'
				output.push(`'''${item.name}''' is a${n(firstType)} ${typeLinkOverride[firstType] || `[[${firstType}]]`}.`)
				break
		}
		
		if (sources.find(src => SHOP_KEYWORDS.find(keyword => src.toLowerCase().includes(keyword) && !src.includes('Synthesize')))) {
			output.push(`\n==Sold By==\n{{Shop Availability}}`)
		}
		
		if (sources.find(src => src.match(/enem(?:y|ies)/i) || src.match(/equilibrium level/i))) {
			output.push(`\n==Dropped By==\n{{Dropped By}}`)
		}
		
		if (types.find(type => type.includes('Ascension'))) {
			output.push(`\n==Ascension Usage==\n{{Ascension Usage}}`)
		}

		if (types.find(type => type.includes('Trace'))) {
			output.push(`\n==Trace Usage==\n{{Trace Usage}}`)
		}
		
		if (types.includes('Synthesis Material')) {
			output.push(`\n==Usage==\n{{Craft Usage}}`)
		}
		
		output.push(
			'\n==Other Languages==',
			await TextMap.generateOL(item.name_hash),
			`\n==Change History==\n{{Change History|2.0}}`,
		)

		switch (item.inventory_tab) {
			case 'Consumables':
				output.push(`\n==Navigation==\n{{Consumable Navbox}}`)
				break
			
			case 'Other Materials':
				output.push(`\n==Navigation==\n{{Synthesis Material Navbox}}`)
				break
			
			case 'Upgrade Materials':
				output.push(`\n==Navigation==\n{{Upgrade Material Navbox}}`)
				break
		}

		mkdirSync(`./output/items/${source}/${sanitizeString(types[0] || 'Unknown')}/`, { recursive: true })
		writeFileSync(`./output/items/${source}/${sanitizeString(types[0] || 'Unknown')}/${sanitizeString(item.name)}-${item.id}.wikitext`, output.join('\n'))
	}
}