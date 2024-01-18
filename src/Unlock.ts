import { Mission } from './Mission.js';
import { Dictionary } from './Shared.js';
import { textMap } from './TextMap.js';
import { getFile } from './files/GameFile.js';
import type { FinishType, InternalFinishWay, InternalUnlockConfig } from './files/Unlock.js';
import { andList } from './util/General.js';

export const mainUnlock: Dictionary<InternalUnlockConfig> = await getFile('ExcelOutput/RogueUnlockConfig.json')
export const dlcUnlock: Dictionary<InternalUnlockConfig> = await getFile('ExcelOutput/RogueDLCUnlock.json')
export const finishWays: Dictionary<InternalFinishWay> = await getFile('ExcelOutput/FinishWay.json')
export const suFinishWays: Dictionary<InternalFinishWay> = await getFile('ExcelOutput/FinishWayRogue.json')
export const suExpansionFinishWays: Dictionary<InternalFinishWay> = await getFile('ExcelOutput/RogueDLCFinishWay.json')

const lazyDlcAreas = {
	301: `{{Mission|Gold and Gears: Experimental Teaching}}`,
	303: `{{Mission|Gold and Gears: Finale}}`
}

export const finishTypes: Partial<Record<FinishType, (data: InternalFinishWay) => string>> = {
	FinishMission: data => {
		const missionList = data.ParamIntList.map(mission => Mission.fromId(mission).link())
		return `after completing ${andList(missionList)}`
	},
	PlayerLevel: data => `after reaching Trailblaze Level ${data.Progress}`,
	WorldLevel: data => `after reaching Equilibirium Level ${data.Progress}`,
	RoguePassAreaProgress: data => `after clearing World ${data.ParamInt1 || '?'}.`,
	RogueDLCSelectedAeonDimensionCnt: data => data.ParamInt1 == 7 && data.ParamInt2 == 2 ? `after unlocking the Cheat feature.` : 'after ???',
	RogueDLCFinishCnt: data => `after completing ${lazyDlcAreas[data.ParamInt1!] || '???'}`
}

export class Unlock {
	finish_way: InternalFinishWay
	desc: string
	
	constructor(public id: number, desc?: string) {
		this.finish_way = finishWays[id] ?? suFinishWays[id] ?? suExpansionFinishWays[id]
		this.desc = finishTypes[this.finish_way.FinishType]?.(this.finish_way) || desc?.replace(/^Unlock(?:ed)?\s+/i, '') || `Unlocked after ???<!--${this.finish_way.FinishType}-->`
		if (!finishTypes[this.finish_way.FinishType]) {
			console.warn(`Unknown FinishType ${this.finish_way.FinishType} in`, this.finish_way)
			if (desc) console.warn(`Description: ${desc}`)
		}
	}
	
	toString() {
		return this.desc
	}
	
	static fromUnlockId(id: number) {
		const unlock = mainUnlock[id] || dlcUnlock[id]
		return new this(unlock.UnlockFinishWay, textMap.getText(unlock.RogueUnlockDetail))
	}
}