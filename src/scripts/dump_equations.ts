import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { writeFile } from 'fs/promises';
import { Blessing } from '../Blessing.js';
import { ChangeHistory } from '../ChangeHistory.js';
import { Equation, override, PERIOD_MAP } from '../Equation.js';
import { AeonPath, sanitizeString } from '../Shared.js';
import { pathDisplayName, TextMap, textMap } from '../TextMap.js';
import { pageInfoHeader } from '../util/General.js';
import { Table } from '../util/Table.js';

const equations = Equation.loadAll()

const output: string[] = ['{{Divergent Universe Tabs}}', '']
const output2: string[] = ['{{Divergent Universe Tabs}}', '']
const glossary = new Set<number>()
const glossary2 = new Set<number>()

function addBlessingPath(path: AeonPath) {
	output2.push(`===${pathDisplayName(path)}===`)
	const blessings = [...Blessing.loadAll(true)].sort((a, b) => ((a.id - (a.rarity * 1000000000)) - (b.id - (b.rarity * 1000000000))))
	const table = new Table('sortable mw-collapsible article-table', ['Icon', 'Name', 'Effect', 'Enhanced Effect'])
	for (const blessing of blessings) {
		if (blessing.path != path || !blessing.active || blessing.enhanced) continue
		const enhanced = blessings.find(eblessing => eblessing.buff_id == blessing.buff_id && eblessing.enhanced)
		table.addRowWithAttr(`id="${blessing.name.replaceAll('"', '&quot;').replaceAll("''", '')}"`, [
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

if (existsSync('./output/equations/')) {
	rmSync('./output/equations/', { recursive: true })
}

for (const period of Object.keys(PERIOD_MAP)) {
	mkdirSync(`./output/equations/${period}/boundary`, { recursive: true })
	mkdirSync(`./output/equations/${period}/3`, { recursive: true })
	mkdirSync(`./output/equations/${period}/2`, { recursive: true })
	mkdirSync(`./output/equations/${period}/1`, { recursive: true })
}

for (const equation of equations) {
	if (!equation.in_handbook && equation.rarity != 'boundary') continue
	
	const output: string[] = [
		pageInfoHeader(equation.name),
	]
	
	if (!equation.active) {
		output.push('{{Removed|Equation}}')
	}
	
	output.push(
		equation.infobox(),
		`'''${equation.name}''' ${equation.active ? 'is' : 'was'} a ${equation.rarity == 'boundary' ? 'Boundary' : `${equation.rarity}-star`} [[Divergent Universe: ${equation.period_name}/Equatoins|Equation]] in [[Divergent Universe: ${equation.period_name}]].`,
		'',
		'==Story==',
		`{{Description|${equation.story.replaceAll('\n', '<br />')}}}`,
		'<!--',
		'==Gameplay Notes==',
		'* ',
		'-->',
	)
	
	if (equation.story_json) {
		const dialogue = (await equation.loadDialogue())!.optimize()
		output.push(
			'==Extrapolation Rewind==',
			'{{Dialogue Start}}',
			await dialogue.wikitext(),
			'{{Dialogue End}}',
			'',
		)
	}
	
	output.push(
		'==Other Languages==',
		await TextMap.generateOL(equation.name_hash),
		'',
		'==Change History==',
		`{{Change History|${(await ChangeHistory.equation.findAdded(equation.id))[0]}}}`
	)
	
	writeFileSync(`./output/equations/${equation.period}/${equation.rarity}/${sanitizeString(equation.name)}-${equation.id}.wikitext`, output.join('\n'))
}

output2.push('==Blessings==')
// addBlessingPath('Preservation')
addBlessingPath('Remembrance')
addBlessingPath('Nihility')
// addBlessingPath('Abundance')
addBlessingPath('TheHunt')
addBlessingPath('Destruction')
addBlessingPath('Elation')
addBlessingPath('Propagation')
addBlessingPath('Erudition')
addBlessingPath('Harmony')

output.push('==Glossary==')
output2.push('==Glossary==')
const traits = [...glossary.values()].map(id => Equation.getExtraEffect(id)).sort((a, b) => {
	const name1 = textMap.getText(a?.ExtraEffectName)
	const name2 = textMap.getText(b?.ExtraEffectName)
	
	if (name1 > name2) {
		return 1
	} else if (name2 > name1) {
		return -1
	} else return 0
})
const traits2 = [...glossary2.values()].map(id => Equation.getExtraEffect(id)).sort((a, b) => {
	const name1 = textMap.getText(a?.ExtraEffectName)
	const name2 = textMap.getText(b?.ExtraEffectName)

	if (name1 > name2) {
		return 1
	} else if (name2 > name1) {
		return -1
	} else return 0
})
for (const trait of traits) {
	output.push(
		`===${textMap.getText(trait?.ExtraEffectName)}===`,
		`${textMap.getText(trait?.ExtraEffectDesc, trait?.DescParamList).replaceAll('\n', '<br />')}`,
		''
	)
}
for (const trait of traits2) {
	output2.push(
		`===${textMap.getText(trait?.ExtraEffectName)}===`,
		`${textMap.getText(trait?.ExtraEffectDesc, trait?.DescParamList).replaceAll('\n', '<br />')}`,
		''
	)
}

output.push('==Change History==', '{{Change History|2.3}}')
output2.push('==Change History==', '{{Change History|2.3}}')


await writeFile('./output/du-paths.wikitext', output.join('\n'))
await writeFile('./output/du-paths2.wikitext', output2.join('\n'))