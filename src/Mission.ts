import { Dictionary } from './Shared.js';
import { textMap } from './TextMap.js';
import { getFile } from './files/GameFile.js';
import { InternalMainMission, MissionType } from './files/Mission.js';

const data: Dictionary<InternalMainMission> = await getFile('ExcelOutput/MainMission.json')

export class Mission {
	static readonly missionData = data
	name: string
	type: MissionType
	
	constructor(public data: InternalMainMission) {
		this.name = textMap.getText(data.Name)
		this.type = data.Type
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