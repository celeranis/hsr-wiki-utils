import { Mission } from './Mission.js';
import { Dictionary } from './Shared.js';
import { textMap } from './TextMap.js';
import { getFile } from './files/GameFile.js';
import type { FinishType, InternalFinishWay, InternalUnlockConfig } from './files/Unlock.js';
import { andList } from './util/General.js';

export const mainUnlock: Dictionary<InternalUnlockConfig> = await getFile('ExcelOutput/RogueUnlockConfig.json')
export const dlcUnlock: Dictionary<InternalUnlockConfig> = await getFile('ExcelOutput/RogueDLCUnlock.json')
export const finishWays: Dictionary<InternalFinishWay> = await getFile('ExcelOutput/FinishWay.json')

export const finishTypes: Partial<Record<FinishType, (data: InternalFinishWay) => string>> = {
	FinishMission: data => {
		const missionList = data.ParamIntList.map(mission => Mission.fromId(mission).link())
		return `Unlocked after completing ${andList(missionList)}`
	},
	PlayerLevel: data => `Unlocked after reaching Trailblaze Level ${data.Progress}`,
	WorldLevel: data => `Unlocked after reaching Equilibirium Level ${data.Progress}`
}

export class Unlock {
	finish_way: InternalFinishWay
	desc: string
	
	constructor(public id: number, desc?: string) {
		this.finish_way = finishWays[id]
		this.desc = desc || finishTypes[this.finish_way.FinishType]?.(this.finish_way) || `Unlocked after ???<!--${this.finish_way}-->`
		if (!finishTypes[this.finish_way.FinishType]) {
			console.warn(`Unknown FinishType ${this.finish_way.FinishType}`)
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