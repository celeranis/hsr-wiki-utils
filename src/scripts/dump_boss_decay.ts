import { writeFileSync } from 'fs';
import { Dictionary } from '../Shared.js';
import { HashReference, TextMap } from '../TextMap.js';
import { getFile } from '../files/GameFile.js';
import { teardown } from '../util/JSONParser.js';

const data: Dictionary<InternalBossDecay> = await getFile('ExcelOutput/RogueDLCBossDecay.json')
const buffData: Dictionary<Dictionary<InternalMazeBuff>> = await getFile('ExcelOutput/MazeBuff.json')

export interface InternalBossDecay {
	BossDecayID: number
	BossDecayName: HashReference
	BossDecayDesc: HashReference
	DescParam: { Value: number }[]
	ExtraDesc: number[]
	BossDecayComeFrom: HashReference
	DecayIcon: string
	EffectType: string
	EffectParamList: number[]
	BossEffectIcon: string
}

export interface InternalMazeBuff {
	ID: number
	BuffSeries: number
	BuffRarity: number
	Lv: number
	LvMax: number
	ModifierName: string
	InBattleBindingType: string
	InBattleBindingKey: string
	ParamList: { Value: number }[],
	BuffIcon: string
	BuffName: HashReference
	BuffDesc: HashReference
	BuffSimpleDesc?: HashReference
	BuffDescBattle: HashReference
	BuffEffect: string
	MazeBuffType: string
	MazeBuffIconType: string
	IsDisplayEnvInLevel: boolean
}

const output: string[] = []

for (const decay of Object.values(data)) {
	output.push(`* ${TextMap.default.getText(decay.BossDecayDesc, decay.DescParam.map(v => v.Value))}`)
	output.push(...decay.EffectParamList.map(effectId => {
		const effect = buffData[effectId][1]
		if (!effect) return '** {{tx}}'
		return `** '''${TextMap.default.getText(effect.BuffName)}:''' ${TextMap.default.getText(effect.BuffDesc, effect.ParamList.map(param => Math.round(param.Value * 100)))}`
	}))
}

writeFileSync('./output/boss_decay.wikitext', output.join('\n'))

teardown()