import clipboard from 'clipboardy';
import { program } from 'commander';
import { Item } from '../Item.js';
import { Dictionary, objectDiff } from '../Shared.js';
import { getFile } from '../files/GameFile.js';
import { InternalItem, ItemSubType } from '../files/Item.js';

program
	.option('-n <name>')
	.option('-v1 <version1>')
	.option('-v2 <version2>')
	.parse()

const opts = program.opts()

type T = InternalItem

const data1 = await getFile<Dictionary<T>>(opts.n, opts.V1)
const data2 = await getFile<Dictionary<T>>(opts.n, opts.V2)

const diff = objectDiff(data1, data2)
console.log(diff)

const EXCLUDE: ItemSubType[] = ['TravelBrochurePaster', 'Book', 'Relic', 'RelicRarityShowOnly', 'RelicSetShowOnly', 'Formula', 'Mission']

const addedItems = diff.added
	.filter(item => !EXCLUDE.includes(item.ItemSubType))
	.map(item => new Item(item))
	.filter(item => item.name)

const output = addedItems.map(item => item.name.replaceAll("''", '')).join(';\n')
clipboard.writeSync(output)