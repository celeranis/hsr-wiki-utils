import { writeFileSync } from 'fs';
import { Curio } from '../Curio.js';
import { uploadPrompt } from '../util/General.js';

const rarities = ['Weighted', '3', '2', '1', 'Negative', undefined]

// DIVERGENT UNIVERSE //
const outputDU: string[] = ['{{Divergent Universe Tabs}}','']

const curiosDU = Curio.loadAll(true)

for (const rarity of rarities) {
	outputDU.push(
		`==${rarity}-Star Curios==`,
		'{{Curio Information/Header}}'
	)
	
	outputDU.push(...curiosDU.filter(curio => curio.rarity == rarity && curio.period == 'Tourn2').map(curio => curio.entry() + uploadPrompt(curio.icon_path, `Curio ${curio.name.replaceAll(/<\s*\/?\s*\w+\s*>/gi, '') }.png`, 'Curio Icons')))

	outputDU.push('{{Curio Information/Footer}}','')
}

writeFileSync('./output/curios-du.wikitext', outputDU.join('\n'))

// CARD MODULE //
const module_output: string[] = ['return {']
module_output.push(...curiosDU.filter(curio => curio.rarity && curio.period == 'Tourn2').map(curio => `\t["${curio.name.replaceAll('"', '\\"')}"] = { rarity = "${curio.rarity}" },`))

module_output.push('}')

writeFileSync('./output/curios-du-module.lua', module_output.join('\n'))

// SIMULATED UNIVERSE //
const outputSU: string[] = []

const curiosSUTemp = Curio.loadAll(false)
const curiosSU: Curio[] = []

for (const curio of curiosSUTemp) {
	if (!curiosSU.find(ecurio => ecurio.name == curio.name && ecurio.effect == curio.effect && ecurio.index_id == curio.index_id)) {
		curiosSU.push(curio)
	}
}

outputSU.push('{{Curio Information/Header}}')
for (const curio of curiosSU) {
	outputSU.push(curio.entry() + uploadPrompt(curio.icon_path, `Curio ${curio.name.replaceAll(/<\s*\/?\s*\w+\s*>/gi, '')}.png`, 'Curio Icons'))
}
outputSU.push('{{Curio Information/Footer}}')

writeFileSync('./output/curios.wikitext', outputSU.join('\n'))