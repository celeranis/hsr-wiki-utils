import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import config from '../../config.json' with { "type": "json" };
import { BlessingGroup } from '../Blessing.js';
import { Event } from '../Event.js';
BlessingGroup.loadAll();
const skip = [30, 31, 32];
const PAGE_FORMAT = `{{Simulated Universe Event Infobox
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
|characters    = <<CHARACTERS>>
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
`;
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
};
const LOOK_FOR_CHARACTERS = [
    'Argenti', 'Arlan', 'Asta', 'Bailu', 'Blade', 'Bronya', 'Clara', 'Dan Heng', 'Dr. Ratio', 'Veritas Ratio', 'Fu Xuan', 'Gepard', 'Guinafen',
    'Hanya', 'Herta', 'Himeko', 'Hook', 'Huohuo', 'Jing Yuan', 'Jingliu', 'Kafka', 'Luka', 'Luocha', 'Lynx', 'March 7th', 'Natasha', 'Pela', 'Qingque',
    'Ruan Mei', 'Sampo', 'Seele', 'Serval', 'Silver Wolf', 'Sushang', 'Tingyun', 'Topaz', 'Topaz and Numby', 'Numby', 'Welt', 'Xueyi', 'Yanqing',
    'Yukong', 'Xueyi',
    'Aha', 'Akivili', 'Ena', 'Fuli', 'HooH', 'Idrila', 'Lan', 'Mythus', 'Nanook', 'Nous', 'Oroboros', 'Qlipoth', 'Tayzzyronth', 'Terminus', 'Xipe', 'Yaoshi',
    'Screwllum', 'Yingxing', 'Baiheng', 'Elio', 'Findie', 'Oleg', 'Owlbert', 'Peppy', 'Phantylia', 'Pom-Pom', 'Sam', 'Sparkle', 'Acheron', 'Sunday',
    'Firefly', 'Gallagher', 'Misha', 'Robin', 'Duke Inferno', 'Ifrit', 'Black Swan'
];
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
function sanitize(str) {
    return str.replace(/[\/\<\>\:\"\\\|\?\*]/g, '');
}
const MERGE_FOLDERS = { Occurrence: true, Unknown: true, Encounter: true, Deal: true };
for (const npc of (Object.values(Event.NPC_DIALOG).map(v => Object.values(v)).flat())) {
    if (npc.HandbookEventID && skip.includes(npc.HandbookEventID))
        continue;
    const event = new Event(npc);
    await event.loadSequences();
    let output = event.output();
    const chars = [];
    for (const char of LOOK_FOR_CHARACTERS) {
        const pattern = new RegExp(`(\\s|^)${char}(\\s|\\.|$|!|\\?|,|'|")`);
        if (pattern.test(output)) {
            chars.push(char);
            output = output.replace(pattern, `$1[[${char}]]$2`);
        }
    }
    let finalOutput = PAGE_FORMAT
        .replaceAll('<<NAME>>', event.name)
        .replaceAll('<<IMAGE>>', IMAGE_MAP[event.image_id] || event.image_id)
        .replaceAll('<<PREV>>', event.name.includes('(') ? '{{tx}}' : '')
        .replaceAll('<<NEXT>>', event.name.includes('(') ? '{{tx}}' : '')
        .replaceAll('<<DIALOGUE>>', output)
        .replaceAll('<<CHARACTERS>>', chars.join(';'));
    const IN_NORMAL_SU = event.type_list.includes('Simulated Universe');
    const IN_SWARM_DISASTER = event.type_list.includes('Simulated Universe: Swarm Disaster');
    const IN_GOLD_AND_GEARS = event.type_list.includes('Simulated Universe: Gold and Gears');
    if (IN_NORMAL_SU) {
        finalOutput = finalOutput.replaceAll('<<DOMAINS_SU>>', 'Occurrence');
    }
    if (IN_SWARM_DISASTER) {
        if (IN_GOLD_AND_GEARS) {
            finalOutput = finalOutput.replaceAll('<<DOMAINS_EXT>>', 'Occurrence')
                .replaceAll('<<SOURCE>>', IN_NORMAL_SU ? 'the [[Simulated Universe]]' : '[[Simulated Universe]] Extensions');
        }
        else {
            finalOutput = finalOutput.replaceAll('<<DOMAINS_SWARM>>', event.name.includes('Praetorian') ? 'Swarm' : 'Occurrence')
                .replaceAll('<<SOURCE>>', '[[Simulated Universe: Swarm Disaster]]');
        }
    }
    else if (IN_GOLD_AND_GEARS) {
        finalOutput = finalOutput.replaceAll('<<DOMAINS_GNG>>', finalOutput.includes('Cognition Value') ? 'Abnormal' : 'Occurrence')
            .replaceAll('<<SOURCE>>', '[[Simulated Universe: Gold and Gears]]');
    }
    else {
        finalOutput = finalOutput.replaceAll('<<SOURCE>>', 'the [[Simulated Universe]]');
    }
    for (const [replace, map] of Object.entries(OTHER_LANGUAGES)) {
        finalOutput = finalOutput.replaceAll(`<<OL_${replace}>>`, map[event.name_hash]);
    }
    finalOutput = finalOutput.replaceAll(/<<\w+>>/gi, '');
    const dir = `./output/events/${sanitize(MERGE_FOLDERS[event.subname] ? 'Occurrence' : event.subname)}/${sanitize(event.series_name)}`;
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/${event.npc_dialog.RogueNPCID}-${event.part_num} - ${sanitize(event.name)}.wikitext`, finalOutput);
}
