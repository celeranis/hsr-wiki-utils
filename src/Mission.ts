import { Dictionary } from './Shared.js';
import { textMap } from './TextMap.js';
import { getFile } from './files/GameFile.js';
import { InternalFateAtlasEntry, InternalMainMission, MissionType } from './files/Mission.js';

const data: Dictionary<InternalMainMission> = await getFile('ExcelOutput/MainMission.json')
const fatesAtlas: Dictionary<InternalFateAtlasEntry> = await getFile('ExcelOutput/ChronicleConclusion.json')

export class Mission {
	static readonly missionData = data
	static readonly fatesAtlasData = fatesAtlas
	name: string
	type: MissionType
	description?: string
	
	constructor(public data: InternalMainMission) {
		this.name = textMap.getText(data.Name)
		this.type = data.Type
		this.description = textMap.getText(fatesAtlas[data.MainMissionID]?.MissionConclusion)
	}
	
	link(): string {
		return `{{Mission|${this.name}}}`
	}
	
	static fromId(missionId: string | number): Mission {
		if (!this.missionData[missionId]) {
			throw new TypeError(`Unknown mission ID ${missionId}`)
		}
		return new Mission(this.missionData[missionId])
	}
}