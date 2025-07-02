import { writeFile } from 'fs/promises'
import { InternalMiscDisplay } from '../files/AudienceDice.js'
import { getExcelFile, getFile } from '../files/GameFile.js'
import { ItemReference } from '../files/Item.js'
import { Component } from '../Scepter.js'
import { HashReference, textMap } from '../TextMap.js'
import { pageInfoHeader, uploadPrompt } from '../util/General.js'
import { teardown } from '../util/JSONParser.js'
import { WeirdKey } from '../WeirdKey.js'

export const RogueMagicMiscDisplay = await getExcelFile<InternalMiscDisplay>('RogueMagicMiscDisplay.json', 'DisplayID')
export const RogueMagicTalent = await getFile<CogBoundTalent[]>('ExcelOutput/RogueMagicTalent.json')

export interface CogBoundTalent {
	TalentID: number
	Level: number
	Cost: ItemReference[]
	TalentIcon: string
	NameDisplayID: number
	EffectDesc: HashReference
	DescParams: any[]
}

const output: string[] = [
	pageInfoHeader('Simulated Universe: Unknowable Domain/Cognitive Boundary'),
	'{{Simulated Universe: Unknowable Domain Tabs}}',
	'',
	'==Nodes==',
	'{{SU Ability',
	'|currency = Conjecture',
]

for (const talent of RogueMagicTalent) {
	const name = textMap.getText(RogueMagicMiscDisplay[talent.NameDisplayID].DisplayContent)
	let desc = textMap.getText(talent.EffectDesc, talent.DescParams.map(param => param[WeirdKey.get('DescParamType')] == 'Number' ? Number(param[WeirdKey.get('TalentDescParamValue')]) : undefined))
	let components = talent.DescParams
		.filter(param => param[WeirdKey.get('DescParamType')] == 'MagicUnit')
		.map(param => new Component(Number(param[WeirdKey.get('TalentDescParamValue')].replace(/_.+/, ''))))
	
	let componentsList = components.length > 0 ? ` {{Item List|${components.map(cmp => cmp.name).join('; ')}|type=Component}}` : ''
	
	let icon = `${name}${uploadPrompt(talent.TalentIcon, `Icon ${name}.png`, 'SU Ability Tree Icons')}`
	if (talent.TalentIcon == 'SpriteOutput/Rogue/Talent/1006.png') {
		icon = 'Additional Mechanism'
	}
	
	output.push(
		'',
		`|${talent.Level}_price  = ${talent.Cost[0].ItemNum}`,
		`|${talent.Level}_title  = ${name}`,
		`|${talent.Level}_icon   = ${icon}`,
		`|${talent.Level}_effect = ${desc}${componentsList}`
	)
}

output.push(
	'}}',
	'',
	'==Change History==',
	'{{Change History|2.6}}'
)

await writeFile('./output/und-cogbound.wikitext', output.join('\n'))

teardown()