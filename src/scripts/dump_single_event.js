import { readFileSync, writeFileSync } from 'fs';
import config from '../../config.json' with { "type": "json" };
import { BlessingGroup } from '../Blessing.js';
import { Event } from '../Event.js';
BlessingGroup.loadAll();
const PAGE_FORMAT = `{{Simulated Universe Event Infobox
|title        = <<NAME>>
|image        = <<IMAGE>>.png
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
`;
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
    201: 'Aeon Qlipoth',
    202: 'Aeon Fuli',
    203: 'Aeon IX',
    204: 'Aeon Yaoshi',
    205: 'Aeon Lan',
    206: 'Aeon Nanook',
    207: 'Aeon Aha',
    208: 'Aeon Ena',
    209: 'Aeon Xipe',
    210: 'Aeon Oroboros',
    211: 'Aeon Tayzzyronth',
    301: 'Herta Simulated Universe',
    401: 'Trailblaze Secret 1',
    402: 'Trailblaze Secret 2',
    403: 'Trailblaze Secret 3',
    404: 'Trailblaze Secret 4',
    405: 'Trailblaze Secret 5',
    406: 'Trailblaze Secret 6',
};
function readMap(name) {
    return JSON.parse(readFileSync(`./versions/${config.target_version}/TextMap${name}.json`).toString());
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
};
const MOCK_HANDBOOK = {
    EventID: -1,
    EventTitle: { Hash: 1389708315 },
    EventType: { Hash: 1339543455 },
    DialoguePath: 'Config/Level/RogueDialogue/RogueNpcDialogEvent/Act/Act403050000.json',
    EventReward: 0,
    ImageID: 201,
    Order: -1,
    EventImage: '',
    EventTypeList: [],
    UnlockHintDesc: { Hash: 0 },
    EventDesc: { Hash: 0 },
};
const event = new Event(MOCK_HANDBOOK);
await event.loadSequences();
const output = event.output();
let finalOutput = PAGE_FORMAT
    .replaceAll('<<NAME>>', event.name)
    .replaceAll('<<IMAGE>>', IMAGE_MAP[event.image_id])
    .replaceAll('<<PREV>>', event.name.includes('(') ? '{{tx}}' : '')
    .replaceAll('<<NEXT>>', event.name.includes('(') ? '{{tx}}' : '')
    .replaceAll('<<DIALOGUE>>', output);
for (let i = 1; i < 4; i++) {
    finalOutput = finalOutput.replaceAll(`<<APPEARS_IN_${i}>>`, event.type_list[i - 1] ? `[[${event.type_list[i - 1]}]]` : '');
}
for (const [replace, map] of Object.entries(OTHER_LANGUAGES)) {
    finalOutput = finalOutput.replaceAll(`<<OL_${replace}>>`, map[event.name_hash]);
}
writeFileSync(`./output/events/${event.name.replace(/[\/\<\>\:\"\\\|\?\*]/g, '')}.wikitext`, finalOutput);
