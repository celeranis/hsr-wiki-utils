import { ItemList } from './Item.js';
import { Dictionary, wikiTitle, wikiTitleLink } from './Shared.js';
import { textMap } from './TextMap.js';
import { getFile } from './files/GameFile.js';
import type { InternalFateAtlasEntry, InternalMainMission, InternalMissionChapter, InternalMissionType, InternalSubMission } from './files/Mission.js';

const data: Dictionary<InternalMainMission> = await getFile('ExcelOutput/MainMission.json')
const stepData: Dictionary<InternalSubMission> = await getFile('ExcelOutput/SubMission.json')
const fatesAtlas: Dictionary<InternalFateAtlasEntry> = await getFile('ExcelOutput/ChronicleConclusion.json')
const chapterData: Dictionary<InternalMissionChapter> = await getFile('ExcelOutput/MissionChapterConfig.json')

export interface MissionStep {
	id: number
	title: string
	description: string
}

export type MissionType = 'Trailblaze' | 'Adventure' | 'Companion' | 'Continuance' | 'Daily'
const missionTypeMap: Record<InternalMissionType, MissionType> = {
	Main: 'Trailblaze',
	Branch: 'Adventure',
	Companion: 'Companion',
	Daily: 'Daily',
	Gap: 'Continuance'
}

export class Mission {
	static readonly missionData = data
	static readonly fatesAtlasData = fatesAtlas
	static readonly stepData = stepData
	name: string
	name_hash: number
	type: MissionType
	id: number
	description?: string
	
	constructor(public data: InternalMainMission) {
		this.name_hash = data.Name.Hash
		this.name = textMap.getText(data.Name)
		this.type = missionTypeMap[data.Type] || data.Type
		this.id = data.MainMissionID
		this.description = textMap.getText(fatesAtlas[data.MainMissionID]?.MissionConclusion)
	}
	
	get displayType(): string {
		switch (this.type) {
			case 'Continuance':
				return 'Trailblaze Continuance'
			
			default:
				return `${this.type} Mission`
		}
	}
	
	link(): string {
		if (!this.name) {
			return `{{cx}}<!--Hidden Exploration Objective ID ${this.id}-->`
		}
		return `{{Mission|${this.name}}}`
	}
	
	plainLink(): string {
		if (!this.name) {
			return `{{cx}}<!--Hidden Exploration Objective ID ${this.id}-->`
		}
		return `[[${this.displayType}]] ''${wikiTitleLink(this.name, 'mission')}''`
	}
	
	static fromId(missionId: string | number): Mission {
		if (!this.missionData[missionId]) {
			throw new TypeError(`Unknown mission ID ${missionId}`)
		}
		return new Mission(this.missionData[missionId])
	}
	
	getSteps(): MissionStep[] {
		const steps: MissionStep[] = []
		let stepList = Object.values(stepData).filter(data => 
			data.SubMissionID.toString().startsWith(this.id.toString()) 
			&& data.SubMissionID.toString().length - this.id.toString().length <= 2
		)
		if (!stepList.length) {
			console.warn(`Could not find any SubMissions for Mission "${this.name}" (${this.id})`)
		}
		let index = 1
		
		for (const currentStep of stepList) {
			steps.push({
				id: currentStep.SubMissionID,
				title: textMap.getText(currentStep.TargetText),
				description: textMap.getText(currentStep.DescrptionText)
			})
			index++
		}
		
		return steps
	}
	
	getRewards() {
		return ItemList.fromRewardId(this.data.RewardID)
	}
	
	getRequirements(): string[] {
		const requirements: string[] = []
		
		for (const paramData of this.data.TakeParam.concat(this.data.BeginParam)) {
			switch (paramData.Type) {
				case 'PlayerLevel':
					requirements.push(`Reach [[Trailblaze Level]] ${paramData.Value}`)
					break
				
				case 'MultiSequence':
					const mission = Mission.fromId(paramData.Value)
					requirements.push(`${mission.plainLink()} completed`)
					break
				
				case 'SequenceNextDay':
					const gateMission = Mission.fromId(paramData.Value)
					requirements.push(`Complete ${gateMission.plainLink()} and wait for the next Daily [[Reset]]`)
					break
				
				case 'WorldLevel':
					requirements.push(`Reach [[Equilibrium Level]] ${paramData.Value}`)
					break
					
				case 'HeliobusPhaseReach':
					requirements.push(`Reach phase ${paramData.Value} in [[A Foxian Tale of the Haunted]]`)
					break
				
				case 'MuseumPhaseRenewPointReach':
					requirements.push(`Reach phase ${paramData.Value} in [[Everwinter City Museum Ledger of Curiosities]]`)
					break
			}
		}
		
		return requirements
	}
	
	getNext(): Mission[] {
		const list = this.data.NextMainMissionList?.map(data => Mission.fromId(data)) || []
		if (this.data.NextTrackMainMission) {
			list.unshift(Mission.fromId(this.data.NextTrackMainMission))
		}
		return list
	}
	
	getChapterName(): string | undefined {
		if (!this.data.ChapterID) return
		
		return wikiTitle(textMap.getText(chapterData[this.data.ChapterID].ChapterName)) + (this.type == 'Companion' ? ' (Companion Mission Chapter)' : '')
	}
	
	getChapterLink(): string | undefined {
		if (!this.data.ChapterID) return
		
		const name = wikiTitle(textMap.getText(chapterData[this.data.ChapterID].ChapterName))
		
		if (this.type == 'Companion') {
			return `[[${wikiTitle(name, 'mission')} (Companion Mission Chapter)|${name}]]`
		}
		else {
			return wikiTitleLink(name, 'mission')
		}
	}
}