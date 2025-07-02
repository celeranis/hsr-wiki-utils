import { writeFile } from 'fs/promises'
import { BelobogShopExchange } from '../events/MaterialSubmitter/MaterialSubmitter.js'
import { Item } from '../Item.js'
import { teardown } from '../util/JSONParser.js'

await Item.loadAll()

const output: string[] = [
	'{{Event Tabs',
	'|subpage1 = Product Plan',
	'|gallery  = false',
	'}}',
	''
]

for (const entry of BelobogShopExchange.loadGroup('BelobogShop')) {
	output.push(entry.wikitext(), '')
}

writeFile('./output/belobog-shop.wikitext', output.join('\n'))

teardown()