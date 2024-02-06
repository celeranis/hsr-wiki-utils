import { writeFileSync } from 'fs';
import type { Dictionary, Value } from '../Shared.js';
import { HashReference, TextMap } from '../TextMap.js';
import { getFile } from '../files/GameFile.js';

const talentData: Dictionary<InternalTalentData> = await getFile('ExcelOutput/RogueNousTalent.json')

export interface InternalTalentData {
	TalentID: number
	NextTalentIDList: number[]
	Cost: [{ItemId: number, ItemNum: number}],
	UnlockIDList: unknown[]
	Icon: string
	EffectTag: HashReference
	EffectTitle: HashReference
	EffectDesc: HashReference
	EffectDescParamList: Value<number>[]
}

const layers: Map<number, InternalTalentData>[] = []

function recurse(talent: InternalTalentData, depth: number) {
	layers[depth] ??= new Map<number, InternalTalentData>()
	layers[depth].set(talent.TalentID, talent)
	talent.NextTalentIDList.forEach(id => recurse(talentData[id], depth + 1))
}
recurse(Object.values(talentData)[0], 0)

const output: string[] = []
let totalCost = 0
for (let [i, layer] of Object.entries(layers)) {
	i = (Number(i) + 1).toString()
	const layerContent = [...layer.values()]
	output.push(
		`|${i}_cost   = ${layerContent[0].Cost[0].ItemNum}`
	)
	let n = 0
	for (const talent of layerContent) {
		n++
		const p = layerContent.length == 1 ? i : `${i}_${n}`
		output.push(
			`|${p}_title  = ${TextMap.default.getText(talent.EffectTitle)}`,
			`|${p}_effect = ${TextMap.default.getText(talent.EffectDesc, talent.EffectDescParamList.map(v => v.Value)).replaceAll('\n', '<br />')}`,
			''
		)
		totalCost += talent.Cost[0].ItemNum
	}
}

output.push(`Total cost: ${totalCost}`)

writeFileSync('./output/neural_net.wikitext', output.join('\n'))