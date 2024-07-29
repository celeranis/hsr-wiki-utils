import { writeFileSync } from 'fs';
import { Curio } from '../Curio.js';

const rarities = ['1', '2', '3', 'Negative', 'Weighted', undefined]

const output: string[] = ['{{Divergent Universe Tabs}}','']

const curios = Curio.loadAll()

for (const rarity of rarities) {
	output.push(
		`==${rarity}-Star Curios==`,
		'{{Curio Information/Header}}'
	)
	
	output.push(...curios.filter(curio => curio.rarity == rarity).map(curio => curio.entry()))

	output.push('{{Curio Information/Footer}}','')
}

writeFileSync('./output/curios-du.wikitext', output.join('\n'))

const module_output: string[] = ['return {']
module_output.push(...curios.filter(curio => curio.rarity).map(curio => `\t["${curio.name.replaceAll('"', '\\"')}"] = { rarity = "${curio.rarity}" },`))

module_output.push('}')

writeFileSync('./output/curios-du-module.lua', module_output.join('\n'))