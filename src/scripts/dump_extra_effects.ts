import { writeFile } from 'fs/promises';
import { EE_ALIASES, EE_PRIORITY, ExtraEffectConfig } from '../ExtraEffect.js';
import { textMap } from '../TextMap.js';
import { pageInfoHeader } from '../util/General.js';

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

for (const effect of Object.values(ExtraEffectConfig).sort((e0, e1) => e0.ExtraEffectID - e1.ExtraEffectID)) {
	const name = textMap.getText(effect.ExtraEffectName)
	if (!name) continue
	let names: string[] = [name.toLowerCase()]
	if (EE_ALIASES[name]) {
		names.push(...EE_ALIASES[name])
	}
	names = names.filter(name => EE_PRIORITY[name] == effect.ExtraEffectID)
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