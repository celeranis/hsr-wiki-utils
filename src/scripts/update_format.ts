import { Item } from '../Item.js';
import { TextMap, textMap } from '../TextMap.js';
import { AWB } from '../util/AWB.js';

await Item.loadFrom('main')

let page = AWB.init()
let id = page.match(/\|id\s*=\s*(\d+)/)?.[1]?.trim()
if (!id || !Item.itemData.disks.data![id]) {
	id = Object.values(Item.itemData.disks.data!).find(item => textMap.getText(item.ItemName) == AWB.page_name || textMap.getText(item.ItemName) == `"${AWB.page_name}"`)?.ID?.toString()

	if (!id) {
		id = await AWB.prompt(`Could not find valid ID for: ${AWB.page_name}`)
	}

	page = page.replace(/\|id(\s*)=.*?(?:\r?\n)/, `|id$1= ${id}\n`)
}

const item = Item.fromId(id)!

if (!page.includes('{{Description')) {
	page = page.replace(/}}\r?\n'/, `}}\n{{Description|${item.bg_desc}}}\n'`)
}

const OL = await TextMap.generateOL(item.name_hash)
if (!page.includes('{{Other Languages')) {
	if (page.includes('==Change History==')) {
		page.replace(/==\s*Change History==/, '\n\n==Change History==')
	}
} else {
	page = page.replace(/{{Other Languages.+?}}(\r?\n|=)/si, OL + '$1')
}

AWB.sendOutput(page)