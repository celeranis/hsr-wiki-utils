import { readFileSync, writeFileSync } from 'fs';
import config from '../../config.json' with { "type": "json" };
import { AudienceDice, DiceSurface } from '../AudienceDice.js';
import { TextMap } from '../TextMap.js';
const diceBranchTags = JSON.parse(readFileSync(`./versions/${config.target_version}/RogueNousDiceBranchTag.json`).toString());
DiceSurface.loadAll();
AudienceDice.loadAll();
const branches = [];
for (const tag of Object.values(diceBranchTags)) {
    const branch = [];
    branches.push(branch);
    branch.push(`==={{Icon/Dark|Dice Category ${TextMap.default.getText(tag.BranchTagName).replace(/:.+/, '')}.png|32}} ${TextMap.default.getText(tag.BranchTagName)}===`, '{| class="article-table"', '!Name', '!Effect');
    for (const dice of AudienceDice.forTag(tag.TagID)) {
        branch.push(`|- id="${dice.name}"`, `|[[File:Custom Dice ${dice.name}.png|100px]]<br />'''${dice.name}'''`, `|${dice.intro}<br /><br />`, `'''Initial Effect:'''<br />`, `${dice.initial_desc}<br /><br />`, `'''Passive Effect:'''<br />`, `${dice.passive_desc}<br /><br />`, `'''Default Combo:<br />'''`, `{{Card List|${dice.default_surfaces.map(surface => surface.name).join(',')}|show_caption=1|type=Dice Face}}`);
    }
    branch.push('|}');
}
const surfaces = [
    '===Dice Surfaces===',
    '{| class="article-table"',
    '!Icon',
    '!Name',
    '!Effect',
    '!Unlock via'
];
for (const surface of [...DiceSurface.map.values()].sort((f1, f2) => ((f2.rarity * 1000) - f2.sort) - ((f1.rarity * 1000) - f1.sort))) {
    surfaces.push(`|- id="${surface.name.replaceAll(/#|"/g, '')}"`, `|${surface.card()}`, `|${surface.name}`, `|${surface.description}`, `|${surface.obtained_via}`);
}
surfaces.push('|}');
writeFileSync('./output/audience_dice.wikitext', branches.map(s => s.join('\n')).join('\n\n') + '\n\n' + surfaces.join('\n'));
