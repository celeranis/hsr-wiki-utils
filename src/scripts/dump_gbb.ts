import { writeFile } from 'fs/promises';
import { GBBGear } from '../events/LOGB/Gear.js';
import { uploadPrompt } from '../util/General.js';
import { teardown } from '../util/JSONParser.js';
import { Table } from '../util/Table.js';

const allGear = GBBGear.getAll()
const weapons = allGear.filter(gear => gear.type == undefined)
const legendaryWeapons = allGear.filter(gear => gear.type == 'Forge')
const accessories = allGear.filter(gear => gear.type == 'Plugin')
const dualWeapons = allGear.filter(gear => gear.type == 'DuelForge')
const esteemedWeapons = allGear.filter(gear => gear.type == 'UltraForge')

const output: string[] = [
	'{{Event Tabs',
	'|subpage1 = Adventure Index',
	'|subpage2 = Planets',
	'|subpage3 = Cosmic Reputation',
	'|subpage4 = Cosmic Store',
	'|gallery  = no',
	'}}',
]

const weaponTable = new Table('fandom-table tdc1 tdc3 tdc4 sortable', ['style="width: 64px" | Icon', 'Weapon', 'Type(s)', 'Tag(s)', 'Requirements'])
const legWeaponTable = new Table('fandom-table tdc1 tdc3 tdc4 sortable', ['style="width: 64px" | Icon', 'Weapon', 'Type(s)', 'Tag(s)', 'Synthesis'])
const dualWeaponTable = new Table('fandom-table tdc1 tdc3 tdc4 sortable', ['style="width: 64px" | Icon', 'Weapon', 'Type(s)', 'Tag(s)', 'Synthesis'])
const esteemedWeaponTable = new Table('fandom-table tdc1 tdc3 tdc4 sortable', ['style="width: 64px" | Icon', 'Weapon', 'Type(s)', 'Tag(s)', 'Synthesis'])
const accessoryTable = new Table('fandom-table tdc1 tdc3 tdc4 sortable', ['style="width: 64px" | Icon', 'Accessory', 'Type(s)', 'Tag(s)', 'Requirements'])

function popupateTable(fromArray: GBBGear[], toTable: Table) {
	fromArray.sort((i0, i1) => i1.id - i0.id)
	for (const item of fromArray) {
		let types: string = ''
		if (item.elements.length == 0 || item.elements.length == 7) {
			if (item.type != 'Plugin') {
				types = 'Random Type'
			} else {
				types = '&mdash;'
			}
		} else {
			types = item.elements.map(type => `{{Nowrap|{{Icon/Type|${type}|l=1|s=1|nobr=1}}}}`).join(' • ')
		}
		
		const firstRow = [
			`data-sort-value="${item.name.replaceAll('"', '&quot;')}" | [[File:${item.icon}|64x64px|${item.name}]]${uploadPrompt(item.icon_path, item.icon, `Galactic Baseballer ${item.type == 'Plugin' ? 'Accessory' : 'Weapon'} Icons`)}`,
			item.name,
			types,
			item.tags.map(type => `{{Nowrap|{{Icon/White|Icon GBB Tag ${type}.png|32}} ${type}}}`).join(' • ') || '&mdash;',
		]
		
		if (item.type == 'Forge' || item.type == 'DuelForge' || item.type == 'UltraForge') {
			firstRow.push('* ' + item.getRecipe().map(entry => entry.gear.asItem(entry.level)).join('\n* '))
		} else {
			firstRow.push(item.unlock_desc || '&mdash;')
		}
		
		toTable.addRowWithAttr(`id="${item.name.replaceAll(' ', '_').replaceAll('"', '&quot;')}"`, firstRow)
		
		let append = ''
		if (item.type == undefined || item.type == 'Plugin') {
			const levelsTable = new Table('wikitable tdc1', ['Lv.', 'Effect'])
			for (const [i, effect] of item.level_descs.entries()) {
				if (i == 0 && item.type != 'Plugin') continue
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
popupateTable(dualWeapons, dualWeaponTable)
popupateTable(esteemedWeapons, esteemedWeaponTable)
popupateTable(accessories, accessoryTable)

output.push(
	'',
	'=={{Icon|GBB Weapon|32}} Weapons==',
	weaponTable.wikitable(false),
	'',
	'=={{Icon|GBB Legendary Weapon|32}} Legendary Weapons==',
	legWeaponTable.wikitable(false),
	'',
	'=={{Icon|GBB Twin Weapons|32}} Twin Weapons==',
	dualWeaponTable.wikitable(false),
	'',
	'=={{Icon|GBB Esteemed Weapon|32}} Esteemed Weapons==',
	esteemedWeaponTable.wikitable(false),
	'',
	'=={{Icon|GBB Accessory|32}} Accessories==',
	accessoryTable.wikitable(false),
	'',
	'==Change History==',
	'{{Change History|3.3}}',
)

await writeFile('./output/gbb2_index.wikitext', output.join('\n'))

teardown()