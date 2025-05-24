import { Mission } from './Mission.js';
import { Dictionary } from './Shared.js';
import { textMap } from './TextMap.js';
import { getExcelFile } from './files/GameFile.js';
import type { FinishType, InternalFinishWay, InternalQuestData, InternalUnlockConfig } from './files/Unlock.js';
import { andList } from './util/General.js';

export const mainUnlock: Dictionary<InternalUnlockConfig> = await getExcelFile('RogueUnlockConfig.json', 'RogueUnlockID')
export const dlcUnlock: Dictionary<InternalUnlockConfig> = await getExcelFile('RogueDLCUnlock.json', 'RogueUnlockID')
export const finishWays: Dictionary<InternalFinishWay> = await getExcelFile('FinishWay.json', 'ID')
export const suFinishWays: Dictionary<InternalFinishWay> = await getExcelFile('FinishWayRogue.json', 'ID')
export const suExpansionFinishWays: Dictionary<InternalFinishWay> = await getExcelFile('RogueDLCFinishWay.json', 'ID')

export const QuestData: Dictionary<InternalQuestData> = await getExcelFile('QuestData.json', 'QuestID')

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
	RogueDLCFinishCnt: data => `after completing ${lazyDlcAreas[data.ParamInt1!] || '???'}`,
	
}

export class Unlock {
	finish_way: InternalFinishWay
	desc: string
	
	constructor(public id: number, desc?: string) {
		this.finish_way = finishWays[id] ?? suFinishWays[id] ?? suExpansionFinishWays[id]
		const params = [
			this.finish_way.ParamInt1,
			this.finish_way.ParamInt2,
			this.finish_way.ParamInt3,
			...this.finish_way.ParamIntList
		]
		this.desc = finishTypes[this.finish_way.FinishType]?.(this.finish_way) || textMap.replaceParams(desc?.replace(/^Unlock(?:ed)?\s+/i, '') || `Unlocked after ???<!--${this.finish_way.FinishType}-->`, params)
	}
	
	toString() {
		return this.desc
	}
	
	static fromUnlockId(id: number) {
		const unlock = mainUnlock[id] || dlcUnlock[id]
		return new this(unlock.UnlockFinishWay, textMap.getText(unlock.RogueUnlockDetail))
	}
	
	static fromQuestId(id: number) {
		const quest = QuestData[id]
		return new this(quest.FinishWayID, textMap.getText(quest.QuestTitle))
	}
}