import { mkdirSync, writeFileSync } from 'fs';
import { BlessingGroup } from '../Blessing.js';
import { ChangeHistory } from '../ChangeHistory.js';
import { Event } from '../Event.js';
import { Dictionary } from '../Shared.js';
import { TextMap } from '../TextMap.js';
import { getFile } from '../files/GameFile.js';
import type { InternalNPCDialogue, InternalSecret, InternalSecretGroup } from '../files/Occurrence.js';

BlessingGroup.loadAll()

const skip = [30, 31, 32]

const PAGE_FORMAT = 
`{{Simulated Universe Event Infobox
|title         = <<NAME>>
|image         = <<IMAGE>>.png
|type          =
|domains_su    = <<DOMAINS_SU>>
|domains_ext   = <<DOMAINS_EXT>>
|domains_swarm = <<DOMAINS_SWARM>>
|domains_gng   = <<DOMAINS_GNG>>
|requirements  =
|prev          = <<PREV>>
|next          = <<NEXT>>
|indexRewards  =
|characters    = <<CHARACTERS>>
}}
'''<<NAME>>''' is an [[Simulated Universe/Occurrence|Occurrence]] in <<SOURCE>>.

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
<<OL>>

==Change History==
{{Change History|<<VERSION>>}}
`

const IMAGE_MAP = {
	101: 'Random Event Normal',
	102: 'Random Event Historian',
	103: 'Random Event Pixel',
	104: 'Random Event Toy',
	105: 'Random Event Bond',
	106: 'Random Event Bonus',
	107: 'Random Event ThreePig',
	108: 'Random Event Profiteer',
	109: 'Random Event Twin',
	110: 'Random Event Battle',
	111: 'Random Event Trade',
	112: 'Random Event 1',
	113: 'Random Event 2',
	114: 'Random Event 3',
	115: 'Random Event 4',
	116: 'Random Event 5',
	117: 'Random Event 7',
	118: 'Random Event 8',
	119: 'Random Event 9',
	120: 'Random Event 10',

	201: 'Aeon Qlipoth',
	202: 'Aeon Fuli',
	203: 'Aeon IX',
	204: 'Aeon Yaoshi',
	205: 'Aeon Lan',
	206: 'Aeon Destruction',
	207: 'Aeon Aha',
	208: 'Aeon Ena',
	209: 'Aeon Xipe',
	210: 'Aeon Oroboros',
	211: 'Aeon Tayzzyronth',
	212: 'Aeon Nous',
	213: 'Aeon HooH',
	214: 'Aeon Mythus',

	301: 'Herta Simulated Universe',
	302: 'Ruan Mei Simulated Universe',
	303: 'Screwllum Simulated Universe',
	304: 'Screwllum Stephen Lloyd 1',
	305: 'Screwllum Stephen Lloyd 2',

	401: 'Trailblaze Secret 1',
	402: 'Trailblaze Secret 2',
	403: 'Traiblaze Secret 3',
	404: 'Traiblaze Secret 5',
	405: 'Trailblaze Secret 4', //sic
	406: 'Trailblaze Secret 6',
	407: 'Trailblaze Secret 7',
	408: 'Trailblaze Secret 8',
	409: 'Trailblaze Secret 9',
	410: 'Trailblaze Secret 10',
	411: 'Trailblaze Secret 11',
	412: 'Trailblaze Secret 12',
}

const LOOK_FOR_CHARACTERS = [
	'Argenti', 'Arlan', 'Asta', 'Bailu', 'Blade', 'Bronya', 'Clara', 'Dan Heng', 'Dr. Ratio', 'Veritas Ratio', 'Fu Xuan', 'Gepard', 'Guinafen',
	'Hanya', 'Herta',  'Himeko', 'Hook', 'Huohuo', 'Jing Yuan', 'Jingliu', 'Kafka', 'Luka', 'Luocha', 'Lynx', 'March 7th', 'Natasha', 'Pela', 'Qingque',
	'Ruan Mei', 'Sampo', 'Seele', 'Serval', 'Silver Wolf', 'Sushang', 'Tingyun', 'Topaz', 'Topaz and Numby', 'Numby', 'Welt', 'Xueyi', 'Yanqing', 
	'Yukong', 'Xueyi',
	
	'Aha', 'Akivili', 'Ena', 'Fuli', 'HooH', 'Idrila', 'Lan', 'Mythus', 'Nanook', 'Nous', 'Oroboros', 'Qlipoth', 'Tayzzyronth', 'Terminus', 'Xipe', 'Yaoshi',
	
	'Screwllum', 'Yingxing', 'Baiheng', 'Elio', 'Findie', 'Oleg', 'Owlbert', 'Peppy', 'Phantylia', 'Pom-Pom', 'Sam', 'Sparkle', 'Acheron', 'Sunday',
	'Firefly', 'Gallagher', 'Misha', 'Robin', 'Duke Inferno', 'Ifrit', 'Black Swan'
]

function sanitize(str: string) {
	return str.replace(/[\/\<\>\:\"\\\|\?\*]/g, '')
}

const MERGE_FOLDERS = {Occurrence: true, Unknown: true, Encounter: true, Deal: true}

async function output(npc: InternalNPCDialogue) {
	if (npc.HandbookEventID && skip.includes(npc.HandbookEventID)) return

	const event = new Event(npc)
	await event.loadSequences()
	let output = event.output()

	const chars: string[] = []
	for (const char of LOOK_FOR_CHARACTERS) {
		const pattern = new RegExp(`(\\s|^)${char}(\\s|\\.|$|!|\\?|,|'|")`)
		if (pattern.test(output)) {
			chars.push(char)
			output = output.replace(pattern, `$1[[${char}]]$2`)
		}
	}

	let finalOutput = PAGE_FORMAT
		.replaceAll('<<NAME>>', event.name)
		.replaceAll('<<IMAGE>>', IMAGE_MAP[event.image_id] || event.image_id)
		.replaceAll('<<PREV>>', event.name.includes('(') ? '{{tx}}' : '')
		.replaceAll('<<NEXT>>', event.name.includes('(') ? '{{tx}}' : '')
		.replaceAll('<<DIALOGUE>>', output)
		.replaceAll('<<CHARACTERS>>', chars.join(';'))

	const IN_NORMAL_SU = event.type_list.includes('Simulated Universe')
	const IN_SWARM_DISASTER = event.type_list.includes('Simulated Universe: Swarm Disaster')
	const IN_GOLD_AND_GEARS = event.type_list.includes('Simulated Universe: Gold and Gears')

	if (IN_NORMAL_SU) {
		finalOutput = finalOutput.replaceAll('<<DOMAINS_SU>>', 'Occurrence')
	}
	if (IN_SWARM_DISASTER) {
		if (IN_GOLD_AND_GEARS) {
			finalOutput = finalOutput.replaceAll('<<DOMAINS_EXT>>', 'Occurrence')
				.replaceAll('<<SOURCE>>', IN_NORMAL_SU ? 'the [[Simulated Universe]]' : '[[Simulated Universe]] Extensions')
		} else {
			finalOutput = finalOutput.replaceAll('<<DOMAINS_SWARM>>', event.name.includes('Praetorian') ? 'Swarm' : 'Occurrence')
				.replaceAll('<<SOURCE>>', '[[Simulated Universe: Swarm Disaster]]')
		}
	} else if (IN_GOLD_AND_GEARS) {
		finalOutput = finalOutput.replaceAll('<<DOMAINS_GNG>>', finalOutput.includes('Cognition Value') ? 'Abnormal' : 'Occurrence')
			.replaceAll('<<SOURCE>>', '[[Simulated Universe: Gold and Gears]]')
	} else {
		finalOutput = finalOutput.replaceAll('<<SOURCE>>', 'the [[Simulated Universe]]')
	}

	finalOutput = finalOutput
		.replaceAll('<<OL>>', await TextMap.generateOL(event.name_hash))
		.replaceAll('<<VERSION>>', (await ChangeHistory.occurrences.findAdded(event.npc_dialog.RogueNPCID.toString()))[0] ?? '<!--unknown-->')
		.replaceAll(/<<\w+>>/gi, '')
	
	const dir = `./output/events/${sanitize(MERGE_FOLDERS[event.subname] ? 'Occurrence' : event.subname)}/${sanitize(event.series_name)}`
	mkdirSync(dir, { recursive: true })
	writeFileSync(`${dir}/${event.npc_dialog.RogueNPCID}-${event.part_num} - ${sanitize(event.name)}.wikitext`, finalOutput)
}

for (const npc of (Object.values(Event.NPC_DIALOG).map(v => Object.values(v)).flat())) {
	await output(npc)
}

const secretGroups: Dictionary<InternalSecretGroup> = await getFile('ExcelOutput/RogueDLCSubStoryGroup.json')
const secrets: Dictionary<InternalSecret> = await getFile('ExcelOutput/RogueDLCSubStory.json')

for (const secretGroup of Object.values(secretGroups)) {
	for (const secret of secretGroup.SubStoryList.map(id => secrets[id])) {
		const imageId = Number(secret.ImgPath.match(/RoguePicEventDLC_(\d+)\.png/i)?.[1])
		await output({
			DialoguePath: secret.LevelGraphPath,
			DialogueProgress: secret.Layer,
			ImageID: imageId,
			RogueNPCID: -1,
			TexturePath: secret.ImgPath,
			_talk: {
				Name: secretGroup.SubStoryGroupName,
				SubName: { Hash: 1090572228 },
				ImageID: imageId,
				IconPath: secret.ImgPath,
				ImgPath: secret.ImgPath,
				TalkNameID: -1
			},
			_name: secret.SubStoryName
		})
	}
}