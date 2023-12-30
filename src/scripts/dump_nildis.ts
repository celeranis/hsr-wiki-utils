import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import config from '../../config.json' with { "type": "json" };
import { BlessingGroup } from '../Blessing.js';
import { Event, OutputList } from '../Event.js';

BlessingGroup.loadAll()

const PAGE_FORMAT =
	`{{Simulated Universe Event Infobox
|title         = <<NAME>>
|image         = Random Event <<IMAGE>>.png
|type          =
|domains_su    = <<DOMAINS_SU>>
|domains_ext   = <<DOMAINS_EXT>>
|domains_swarm = <<DOMAINS_SWARM>>
|domains_gng   = <<DOMAINS_GNG>>
|requirements  =
|prev          = <<PREV>>
|next          = <<NEXT>>
|indexRewards  =
|characters    =
}}
'''<<NAME>>''' is an [[Simulated Universe/Events|Event]] in <<SOURCE>>.

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
	117: '7',
	118: '8',
	119: '9',
	120: '10',
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

function sanitize(str: string) {
	return str.replace(/[\/\<\>\:\"\\\|\?\*]/g, '')
}

const TARGET = ['Nildis']

for (const npc of (Object.values(Event.NPC_DIALOG).map(v => Object.values(v)).flat())) {
	const event = new Event(npc)
	if (!TARGET.find(target => event.name.includes(target))) continue

	await event.loadSequences()

	let output: OutputList = []
	for (const sequence of event.sequences) {
		for (const task of sequence.TaskList) {
			if (task.$type == 'RPG.GameCore.WaitDialogueEvent') {
				for (const { DialogueEventID, SuccessCustomString } of task.DialogueEventList) {
					if (SuccessCustomString?.includes('Battle')) {
						output.push(event.addSection(DialogueEventID, true)?.output(undefined, true)!)
					}
				}
			}
		}
	}

	let finalOutput = PAGE_FORMAT
		.replaceAll('<<NAME>>', event.name)
		.replaceAll('<<IMAGE>>', IMAGE_MAP[event.image_id])
		.replaceAll('<<PREV>>', event.name.includes('(') ? '{{tx}}' : '')
		.replaceAll('<<NEXT>>', event.name.includes('(') ? '{{tx}}' : '')
		.replaceAll('<<DIALOGUE>>', output.flat(21).join('\n'))

	for (const [replace, map] of Object.entries(OTHER_LANGUAGES)) {
		finalOutput = finalOutput.replaceAll(`<<OL_${replace}>>`, map[event.name_hash])
	}

	finalOutput = finalOutput.replaceAll(/<<\w+>>/gi, '')

	const dir = `./output/events/${sanitize(event.series_name)}`
	mkdirSync(dir, { recursive: true })
	writeFileSync(`${dir}/${event.npc_dialog.RogueNPCID}-${event.part_num} - ${sanitize(event.name)}.wikitext`, finalOutput)
}