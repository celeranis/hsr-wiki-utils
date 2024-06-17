import { writeFile } from 'fs/promises';
import { GBBGear } from '../events/LOGB/Gear.js';
import { Table } from '../util/Table.js';

const allGear = GBBGear.getAll()
const weapons = allGear.filter(gear => gear.type == 'Weapon')
const legendaryWeapons = allGear.filter(gear => gear.type == 'Legendary Weapon')
const accessories = allGear.filter(gear => gear.type == 'Accessory')

const output: string[] = [
	'{{Event Tabs',
	'|subpage1 = Adventure Index',
	'|subpage2 = Planets',
	'|subpage3 = Cosmic Reputation',
	'|subpage4 = Cosmic Store',
	'}}',
]

const weaponTable = new Table('fandom-table tdc1 tdc3 tdc4 sortable', ['style="width: 64px" | Icon', 'Weapon', 'Type(s)', 'Tag(s)'])
const legWeaponTable = new Table('fandom-table tdc1 tdc3 tdc4 sortable', ['style="width: 64px" | Icon', 'Weapon', 'Type(s)', 'Tag(s)', 'Synthesis'])
const accessoryTable = new Table('fandom-table tdc1 tdc3 tdc4 sortable', ['style="width: 64px" | Icon', 'Accessory', 'Type(s)', 'Tag(s)'])

function popupateTable(fromArray: GBBGear[], toTable: Table) {
	fromArray.sort((i0, i1) => i0.id - i1.id)
	for (const item of fromArray) {
		let types: string = ''
		if (item.elements.length == 0) {
			if (item.type != 'Accessory') {
				types = 'Random Type'
			} else {
				types = '&mdash;'
			}
		} else {
			types = item.elements.map(type => `{{Nowrap|{{Icon/Type|${type}|l=1|s=1|nobr=1}}}}`).join(' • ')
		}
		
		const firstRow = [
			`data-sort-value="${item.name.replaceAll('"', '&quot;')}" | [[File:${item.icon}|64x64px|${item.name}]]`,
			item.name,
			types,
			item.tags.map(type => `{{Nowrap|{{Icon/White|Icon GBB Tag ${type}.png|32}} ${type}}}`).join(' • ') || '&mdash;',
		]
		
		if (item.type == 'Legendary Weapon') {
			firstRow.push('* ' + item.getRecipe().map(entry => entry.gear.asItem(entry.level)).join('\n* '))
		}
		
		toTable.addRowWithAttr(`id="${item.name.replaceAll(' ', '_').replaceAll('"', '&quot;')}"`, firstRow)
		
		let append = ''
		if (item.type != 'Legendary Weapon') {
			const levelsTable = new Table('wikitable tdc1', ['Lv.', 'Effect'])
			for (const [i, effect] of item.level_descs.entries()) {
				if (i == 0 && item.type != 'Accessory') continue
				levelsTable.addRow('+' + (i + 1), effect)
			}
			append = `<br /><!--\n-->{{Collapsible\n|${levelsTable.wrapper()}\n|Upgrades\n|collapsed=1\n}}`
		}
		
		toTable.addRowWithAttr('class="expand-child"', [
			`colspan="5" class="align-left" | ${item.overview_desc}${append}`
		])
	}
}

popupateTable(weapons, weaponTable)
popupateTable(legendaryWeapons, legWeaponTable)
popupateTable(accessories, accessoryTable)

output.push(
	'',
	'=={{Icon|GBB Weapon|32}} Weapons==',
	weaponTable.wikitable(false),
	'',
	'=={{Icon|GBB Legendary Weapon|32}} Legendary Weapons==',
	legWeaponTable.wikitable(false),
	'',
	'=={{Icon|GBB Accessory|32}} Accessories==',
	accessoryTable.wikitable(false),
	'',
	'==Change History==',
	'{{Change History|2.2}}',
)

await writeFile('./output/gbb_index.wikitext', output.join('\n'))