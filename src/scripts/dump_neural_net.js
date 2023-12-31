import { readFileSync, writeFileSync } from 'fs';
import config from '../../config.json' with { "type": "json" };
import { TextMap } from '../TextMap.js';
const talentData = JSON.parse(readFileSync(`./versions/${config.target_version}/RogueNousTalent.json`).toString());
const ICON_MAP = {
    'SpriteOutput/Rogue/Talent/1004.png': 'Icon DMG Reduction.png',
    'SpriteOutput/Rogue/Talent/1005.png': 'Icon Path Resonance Buff.png',
    'SpriteOutput/Rogue/Talent/1006.png': 'Icon Additional Mechanism.png',
    'SpriteOutput/BuffIcon/Inlevel/IconBuffAttackUp.png': 'Icon ATK.png',
    'SpriteOutput/BuffIcon/Inlevel/IconBuffHPBoost.png': 'Icon HP.png',
    'SpriteOutput/BuffIcon/Inlevel/IconBuffDefenceUp.png': 'Icon DEF.png',
    'SpriteOutput/BuffIcon/Inlevel/IconBuffSpeedUp.png': 'Icon SPD.png',
    'SpriteOutput/BuffIcon/Inlevel/IconBuffStatusProbability.png': 'Icon Effect Hit Rate.png',
    'SpriteOutput/BuffIcon/Inlevel/IconBuffDamageResistance.png': 'Icon Effect RES.png',
    'SpriteOutput/UI/Avatar/Icon/IconCriticalChance.png': 'Icon CRIT Rate.png',
    'SpriteOutput/UI/Avatar/Icon/IconCriticalDamage.png': 'Icon CRIT DMG.png',
    'SpriteOutput/BuffIcon/Inlevel/IconBuffAttackUpElement.png': 'Icon All DMG Boost.png',
};
const output = [];
let totalCost = 0;
for (const data of Object.values(talentData)) {
    output.push('|-', '|', '{{SU Ability', `|${TextMap.default.getText(data.EffectTitle)}`, `|${TextMap.default.getText(data.EffectDesc, data.EffectDescParamList.map(v => v.Value))}`, `|icon      = ${ICON_MAP[data.Icon]}`, `|icon_size = 50`, `|item      = Neural Impulse`, `|price     = ${data.Cost[0].ItemNum}`, '}}');
    totalCost += data.Cost[0].ItemNum;
}
output.push(`Total cost: ${totalCost}`);
writeFileSync('./output/neural_net.wikitext', output.join('\n'));
