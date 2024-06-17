import { Item } from '../../Item.js'
import { AWB } from '../../util/AWB.js'
import { client } from '../../util/Bot.js'

await Item.loadFrom('relics')

const category = (await client.getPagesInCategory('Relics'))
	.filter(name => !name.startsWith('File:') && !name.startsWith('Category:'))

for (const pageTitle of category) {
	const page = await client.read(pageTitle)
	
	if (!page.revisions) {
		console.warn(`Could not load revisions for ${page.title}`)
		continue
	}
	
	let pageContent = page.revisions[0].content!
	// if (pageContent.includes('{{Relic Infobox\n|id ')) {
	// 	console.log(`"${page.title}" already has id`)
	// 	continue
	// }
	
	const item = Item.find(item => item.name == page.title && item.rarity == 5)
	
	if (!item) {
		console.warn(`Relic "${page.title}" not found`)
		continue
	}
	
	pageContent = pageContent.replace(/{{Relic[_ ]Infobox/, `{{Relic Infobox\n|id       = ${item.id}`)
	
	pageContent = await AWB.viewDiff(page.revisions[0].content!, pageContent)
	
	await client.save(page.title, pageContent, 'add id')
}