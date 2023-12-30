import { readFileSync, writeFileSync } from 'fs';
import config from '../../config.json' with { "type": "json" };
import { TextMap } from '../TextMap.js';
const data = JSON.parse(readFileSync(`./versions/${config.target_version}/RogueDLCBossDecay.json`).toString());
const buffData = JSON.parse(readFileSync(`./versions/${config.target_version}/MazeBuff.json`).toString());
const output = [];
for (const decay of Object.values(data)) {
    output.push(`* ${TextMap.default.getText(decay.BossDecayDesc, decay.DescParam.map(v => v.Value))}`);
    output.push(...decay.EffectParamList.map(effectId => {
        const effect = buffData[effectId][1];
        if (!effect)
            return '** {{tx}}';
        return `** '''${TextMap.default.getText(effect.BuffName)}:''' ${TextMap.default.getText(effect.BuffDesc, effect.ParamList.map(param => Math.round(param.Value * 100)))}`;
    }));
}
writeFileSync('./output/boss_decay.wikitext', output.join('\n'));
