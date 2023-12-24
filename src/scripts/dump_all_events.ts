import { readFileSync, writeFileSync } from 'fs';
import config from '../../config.json' with { "type": "json" };
import { BlessingGroup } from '../Blessing.js';
import { Event } from '../Event.js';

BlessingGroup.loadAll()

const skip = ['30', '31', '32']

const PAGE_FORMAT = 
`{{Simulated Universe Event Infobox
|title        = <<NAME>>
|image        = Random Event <<IMAGE>>.png
|type         =
|appearsIn    = <<APPEARS_IN_1>>
|appearsIn2   = <<APPEARS_IN_2>>
|appearsIn3   = <<APPEARS_IN_3>>
|requirements =
|prev         = <<PREV>>
|next         = <<NEXT>>
|indexRewards =
|characters   =
}}
'''<<NAME>>''' is an [[Simulated Universe/Events|Event]] in the <<APPEARS_IN_1>>.

==Possible Outcomes==
{| class="article-table"
!Choice
!Result

|}

<!--
==Gameplay Notes==

-->
==Dialogue==
{{Dialogue Start}}
<<DIALOGUE>>
{{Dialogue End}}

==Other Languages==
{{Other Languages
|zhs   = <<OL_ZHS>>
|zht   = <<OL_ZHT>>
|ja    = <<OL_JA>>
|ko    = <<OL_KO>>
|es    = <<OL_ES>>
|fr    = <<OL_FR>>
|ru    = <<OL_RU>>
|th    = <<OL_TH>>
|vi    = <<OL_VI>>
|de    = <<OL_DE>>
|id    = <<OL_ID>>
|pt    = <<OL_PT>>
}}

==Change History==
{{Change History|1.0}}
`

const IMAGE_MAP = {
	101: 'Normal',
	102: 'Historian',
	103: 'Pixel',
	104: 'Toy',
	105: 'Bond',
	106: 'Bonus',
	107: 'ThreePig',
	108: 'Profiteer',
	109: 'Twin',
	110: 'Battle',
	111: 'Trade',
	112: '1',
	113: '2',
	114: '3',
	115: '4',
	116: '5',
	117: '7'
}

function readMap(name: string) {
	return JSON.parse(readFileSync(`./versions/${config.target_version}/TextMap${name}.json`).toString())
}

const OTHER_LANGUAGES = {
	ZHS: readMap('CHS'),
	ZHT: readMap('CHT'),
	JA: readMap('JP'),
	KO: readMap('KR'),
	ES: readMap('ES'),
	FR: readMap('FR'),
	RU: readMap('RU'),
	TH: readMap('TH'),
	VI: readMap('VI'),
	DE: readMap('DE'),
	ID: readMap('ID'),
	PT: readMap('PT')
}

for (const id in Event.HANDBOOK) {
	if (skip.includes(id)) continue
	const event = new Event(Number.parseInt(id))
	await event.loadSequences()
	const output = event.output()
	
	let finalOutput = PAGE_FORMAT
		.replaceAll('<<NAME>>', event.name)
		.replaceAll('<<IMAGE>>', IMAGE_MAP[event.image_id])
		.replaceAll('<<PREV>>', event.name.includes('(') ? '{{tx}}' : '')
		.replaceAll('<<NEXT>>', event.name.includes('(') ? '{{tx}}' : '')
		.replaceAll('<<DIALOGUE>>', output)
	
	for (let i = 1; i < 4; i++) {
		finalOutput = finalOutput.replaceAll(`<<APPEARS_IN_${i}>>`, event.type_list[i - 1] ? `[[${event.type_list[i - 1]}]]` : '')
	}
	
	for (const [replace, map] of Object.entries(OTHER_LANGUAGES)) {
		finalOutput = finalOutput.replaceAll(`<<OL_${replace}>>`, map[event.name_hash])
	}
	
	writeFileSync(`./output/events/${event.name.replace(/[\/\<\>\:\"\\\|\?\*]/g, '')}.wikitext`, finalOutput)
}