import { writeFile } from 'fs/promises';
import { InternalExtraEffect } from '../files/Equation.js';
import { getExcelFile } from '../files/GameFile.js';
import { textMap } from '../TextMap.js';
import { pageInfoHeader } from '../util/General.js';

const ExtraEffectConfig = await getExcelFile<InternalExtraEffect>('ExtraEffectConfig.json', 'ExtraEffectID')

const ALIASES: Record<string, string[]> = {
	'Action Delayed': ['delayed'],
	'Action Advanced': ['advanced', 'advanced forward', 'advance forward', 'action advances', 'advances its action'],
	'Extra Turn': ['extra action'],
	'Follow-up ATK': ['follow-up attack', 'follow-up'],
	'Additional DMG': ['additional damage', 'additional', 'additional ice dmg'],
	'Weakness Break State': ['weakness broken', 'weakness break'],
	'Downed State': ['downed', 'knocked down'],
	'Buff': ['buffs', 'buff(s)'],
	'Debuff': ['debuffs', 'debuff(s)'],
	'DoT Debuff': ['dot'],
	'distribute': ['distributed'],
	'Grit': ['fighting spirit'],
	'Spores': ['spore', 'spore(s)'],
	'AoE ATK': ['aoe', 'aoe attack'],
	'Overflow DMG': ['overflow', 'overflows', 'overflow damage'],
	'Summon Memosprite': ['summons the memosprite'],
	'Even Distribution': ['distributed evenly'],
	
	// inconsistent
	'Joint Attack': ['joint atk'],
	'Joint ATK': ['joint attack'],
}

const output = [
	pageInfoHeader('Template:Extra Effect'),
	`<includeonly><!--`,
	``,
	`	This template is automatically generated from game data.`,
	``,
	`	For any manual changes, please notify [[User:Celeranis]]`,
	`	or submit a PR to the script on GitHub (https://github.com/celeranis/hsr-wiki-utils/blob/main/src/scripts/dump_extra_effects.ts)`,
	`	to prevent your changes from being overwritten with the next version update.`,
	``,
	`	--><span class="custom-tt-wrapper srw-extra-effect-wrapper toggle-tooltip mw-collapsible mw-made-collapsible mw-collapsed srw-collapsible"><!--`,
	`		--><span class="mw-collapsible-toggle mw-collapsible-toggle-default mw-collapsible-toggle-collapsed srw-extra-effect toggle-tooltip">{{{1}}}</span><!--`,
	`		--><span class="mw-collapsible-content srw-extra-effect" style="display:none"><!--`,
	`			-->{{#switch:{{#replace:{{#replace:{{lc:{{{2|{{{1}}}}}}}}|"|}}|.|}}`,
]

function resolvePriority(name: string, id0: number) {
	let id1 = priority[name]
	if (!id1) {
		priority[name] = id0
		return
	}
	
	const isEvent0 = id0.toString().startsWith('70')
	const isEvent1 = id1.toString().startsWith('70')
	if (isEvent1 && !isEvent0) {
		priority[name] = id0
	} else if (isEvent0 && !isEvent1) {
		priority[name] = id1
	} else {
		console.warn(`Collission between ${id0} and ${id1} for "${name}"`)
		priority[name] = id0 < id1 ? id0 : id1
	}
}

const priority: Record<string, number> = {}
for (const effect of Object.values(ExtraEffectConfig)) {
	const effectName = textMap.getText(effect.ExtraEffectName)
	if (!effectName) continue
	
	resolvePriority(effectName.toLowerCase(), effect.ExtraEffectID)
	
	if (ALIASES[effectName]) {
		for (const alias of ALIASES[effectName]) {
			resolvePriority(alias, effect.ExtraEffectID)
		}
	}
}

for (const effect of Object.values(ExtraEffectConfig).sort((e0, e1) => e0.ExtraEffectID - e1.ExtraEffectID)) {
	const name = textMap.getText(effect.ExtraEffectName)
	if (!name) continue
	let names: string[] = [name.toLowerCase()]
	if (ALIASES[name]) {
		names.push(...ALIASES[name])
	}
	names = names.filter(name => priority[name] == effect.ExtraEffectID)
	names.push(effect.ExtraEffectID.toString())
	
	output.push(`\t\t\t\t| ${names.map(n => n.replaceAll(/[\.\"]/gi, '')).join(' | ')} = <!--\n\t\t\t\t\t--><span class="srw-extra-effect-header">${name}</span><!--\n\t\t\t\t\t--><span class="srw-extra-effect-content">${textMap.getText(effect.ExtraEffectDesc, effect.DescParamList).replaceAll('\n', '<br />')}</span>`)
}

output.push(
	`			}}<!--`,
	`		--></span><!--`,
	`	--></span><!--`,
	`--></includeonly><noinclude>{{Documentation|type=Design}}</noinclude>`,
)

await writeFile('./output/extra_effects.wikitext', output.join('\n'))