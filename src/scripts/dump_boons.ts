import { writeFileSync } from 'fs';
import { GoldenBloodBoon } from '../Boon.js';
import { Dictionary } from '../Shared.js';
import { textMap, TextMap } from '../TextMap.js';
import { pageInfoHeader, uploadPrompt } from '../util/General.js';
import { Table } from '../util/Table.js';

const sets: Dictionary<Dictionary<boolean>> = {}

const boons = GoldenBloodBoon.loadAll()
for (const boon of boons) {
	sets[boon.cycle_name] ??= {}
	sets[boon.cycle_name][boon.titan_heir] = true
}

const output = [
	pageInfoHeader('Divergent Universe: Protean Hero/Golden Blood\'s Boons'),
	'{{Divergent Universe: Protean Hero Tabs}}',
	'{{Stub|Lacking general gameplay details}}',
	"'''Golden Blood's Boons''' are unique items in [[Divergent Universe: Protean Hero]] that provide powerful buffs based on the current time.",
	'',
]

const LEVEL_NAMES = [
	'',
	textMap.getText(17071722397368373557n),
	textMap.getText(4012427840480718761n),
	textMap.getText(10677933335688389864n)
]

for (const [cycle, heirs] of Object.entries(sets)) {
	output.push(`==${cycle}==`)
	for (const heir of Object.keys(heirs)) {
		output.push(`===${heir}===`)
		
		const table = new Table('article-table tdc1', ['Icon', 'Name', 'Effects'])
		let level = 0
		for (const boon of boons.filter(boon => boon.titan_heir == heir).sort((b0, b1) => ((b0.level * 1000000) + b0.id) - ((b1.level * 1000000) + b1.id))) {
			if (boon.level != level) {
				table.addRow(`! colspan="3" | ${LEVEL_NAMES[boon.level]}`)
				level = boon.level
			}
			table.addRowWithAttr(
				`id="${boon.name.replaceAll('"', '&quot;')}"`,
				[
					`[[File:Icon Golden Blood's Boon ${heir}.png|50px|link=|alt=${heir}]]${uploadPrompt(boon.icon, `Icon Golden Blood's Boon ${heir}.png`, "Golden Blood's Boon Icons")}`,
					`'''${boon.name}'''`,
					boon.description.replaceAll('\n', '<br />')
				]
			)
		}
		
		output.push(table.wikitable(false), '')
	}
}

output.push(
	'==Other Languages==',
	await TextMap.generateOL(1805423062616447802n),
	'',
	'==Change History==',
	'{{Change History|3.1}}'
)

writeFileSync('./output/du-boons.wikitext', output.join('\n'))