import clipboard from 'clipboardy';
import { setTimeout } from 'timers/promises';
import { Dictionary, VERSION_LIST, Version } from '../Shared.js';
import { TextMap } from '../TextMap.js';
import { getFile } from '../files/GameFile.js';
import type { InternalItem } from '../files/Item.js';
import type { InternalBookSeries } from '../files/Readable.js';
import { AWB } from '../util/AWB.js';

type PerVersion<T> = [Version, Dictionary<T>][]

const readablesPerVersion: PerVersion<InternalBookSeries> = []
const itemsPerVersion: PerVersion<InternalItem> = []

const modeMap: Dictionary<PerVersion<unknown>> = {
	Readable: readablesPerVersion,
	Item: itemsPerVersion
}
const modeTitleMap: Dictionary<string> = {
	Readable: 'BookSeries',
	Item: 'ItemName'
}

for (const version of VERSION_LIST) {
	readablesPerVersion.push([version, await getFile('ExcelOutput/BookSeriesConfig.json', version)])
	itemsPerVersion.push([version, await getFile('ExcelOutput/ItemConfig.json', version)])
}

function findAdded(id: string | number, data: PerVersion<unknown>): Version | undefined {
	return data.find(dict => dict[1][id])?.[0]
}

function getOL(id: string | number, data: PerVersion<any>, prop: string) {
	return TextMap.generateOL(data[data.length - 1][1][id][prop])
}

while (true) {
	let mode = await AWB.presentOptions("Looking for...", ['Readable', 'Item', 'Cancel'])
	if (mode == 'Cancel') break
	let id = await AWB.prompt('Enter an id:')
	if (!id) continue
	let version = findAdded(id, modeMap[mode])
	if (version) {
		console.log(`Added in Version ${version}`)
		let result = `==Change History==\n{{Change History|${version}}}`
		
		const yesinclude = await AWB.confirm('Include OL?')
		if (yesinclude) {
			result = `==Other Languages==\n${await getOL(id, modeMap[mode], modeTitleMap[mode])}\n\n` + result
		}
		
		await clipboard.write(result)
		console.log('Copied template to clipboard!')
	} else {
		console.log(`Could not find id "${id}"`)
	}
	await setTimeout(1000)
}