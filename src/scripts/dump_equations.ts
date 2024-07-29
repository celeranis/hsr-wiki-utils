import { writeFile } from 'fs/promises';
import { Blessing } from '../Blessing.js';
import { Equation, override } from '../Equation.js';
import { AeonPath, pathDisplayName } from '../Shared.js';
import { textMap } from '../TextMap.js';
import { Table } from '../util/Table.js';

const equations = Equation.loadAll()

const output: string[] = ['{{Divergent Universe Tabs}}', '']
const output2: string[] = ['{{Divergent Universe Tabs}}', '']
const glossary = new Set<number>()
const glossary2 = new Set<number>()

function addEquationRarity(id: string, display: string) {
	output.push(
		`===${display} Equations===`,
		'{{Equation/Header}}'
	)
	
	for (const equation of equations) {
		if (equation.rarity != id) continue
		output.push(equation.entry())
		equation.traits.forEach(trait => glossary.add(trait))
	}
	
	output.push(
		'{{Equation/Footer}}',
		''
	)
}

function addBlessingPath(path: AeonPath) {
	output2.push(`===${pathDisplayName(path)}===`)
	const blessings = [...Blessing.loadAll()].sort((a, b) => ((a.id - (a.rarity * 1000000000)) - (b.id - (b.rarity * 1000000000))))
	const table = new Table('sortable mw-collapsible article-table', ['Icon', 'Name', 'Effect', 'Enhanced Effect'])
	for (const blessing of blessings) {
		if (blessing.path != path || blessing.enhanced) continue
		const enhanced = blessings.find(eblessing => eblessing.buff_id == blessing.buff_id && eblessing.enhanced)
		table.addRowWithAttr(`id="${blessing.name.replaceAll('"', '&quot;')}"`, [
			`{{SU Blessing Card|${pathDisplayName(blessing.path)}|${blessing.icon_variant}|${blessing.rarity}}}`,
			blessing.name,
			blessing.description
				.replaceAll('\n', '<br />')
				.replaceAll(/<u>(.+?)<\/u>/gi, (_, trait) => override[trait] ? `{{Trait|${override[trait]}|${trait}}}` : `{{Trait|${trait}}}`),
			enhanced!.description
				.replaceAll('\n', '<br />')
				.replaceAll(/<u>(.+?)<\/u>/gi, (_, trait) => override[trait] ? `{{Trait|${override[trait]}|${trait}}}` : `{{Trait|${trait}}}`)
		])
		blessing.traits.forEach(trait => glossary2.add(trait))
	}
	output2.push(table.wikitable(false), '')
}

output.push('==Equations==')
addEquationRarity('boundary', 'Boundary')
addEquationRarity('3', '3-Star')
addEquationRarity('2', '2-Star')
addEquationRarity('1', '1-Star')

output2.push('==Blessings==')
addBlessingPath('Preservation')
addBlessingPath('Remembrance')
addBlessingPath('Nihility')
addBlessingPath('Abundance')
addBlessingPath('TheHunt')
addBlessingPath('Destruction')
addBlessingPath('Elation')
addBlessingPath('Propagation')
addBlessingPath('Erudition')

output.push('==Glossary==')
output2.push('==Glossary==')
const traits = [...glossary.values()].map(id => Equation.getExtraEffect(id)).sort((a, b) => {
	const name1 = textMap.getText(a.ExtraEffectName)
	const name2 = textMap.getText(b.ExtraEffectName)
	
	if (name1 > name2) {
		return 1
	} else if (name2 > name1) {
		return -1
	} else return 0
})
const traits2 = [...glossary2.values()].map(id => Equation.getExtraEffect(id)).sort((a, b) => {
	const name1 = textMap.getText(a.ExtraEffectName)
	const name2 = textMap.getText(b.ExtraEffectName)

	if (name1 > name2) {
		return 1
	} else if (name2 > name1) {
		return -1
	} else return 0
})
for (const trait of traits) {
	output.push(
		`===${textMap.getText(trait.ExtraEffectName)}===`,
		`${textMap.getText(trait.ExtraEffectDesc, trait.DescParamList).replaceAll('\n', '<br />')}`,
		''
	)
}
for (const trait of traits2) {
	output2.push(
		`===${textMap.getText(trait.ExtraEffectName)}===`,
		`${textMap.getText(trait.ExtraEffectDesc, trait.DescParamList).replaceAll('\n', '<br />')}`,
		''
	)
}

output.push('==Change History==', '{{Change History|2.3}}')
output2.push('==Change History==', '{{Change History|2.3}}')


await writeFile('./output/du-paths.wikitext', output.join('\n'))
await writeFile('./output/du-paths2.wikitext', output2.join('\n'))