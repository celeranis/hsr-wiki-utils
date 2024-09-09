import { existsSync } from 'fs';
import config from '../config.json' with { 'type': 'json' };
import { ItemList } from './Item.js';
import { Dictionary, wikiTitle, wikiTitleLink } from './Shared.js';
import { textMap } from './TextMap.js';
import { Act } from './files/Dialog.js';
import { getExcelFile, getFile, getFileSafe } from './files/GameFile.js';
import { Performance, PerformanceFile, type InternalFateAtlasEntry, type InternalMainMission, type InternalMissionChapter, type InternalMissionType, type InternalSubMission } from './files/Mission.js';
import { Area } from './maps/Area.js';

const data: Dictionary<InternalMainMission> = await getFile('ExcelOutput/MainMission.json')
const stepData: Dictionary<InternalSubMission> = await getFile('ExcelOutput/SubMission.json')
const fatesAtlas = await getExcelFile<InternalFateAtlasEntry>('ExcelOutput/ChronicleConclusion.json')
const chapterData: Dictionary<InternalMissionChapter> = await getFile('ExcelOutput/MissionChapterConfig.json')

export const performance = {
	A: await getFile<PerformanceFile>('ExcelOutput/PerformanceA.json'),
	C: await getFile<PerformanceFile>('ExcelOutput/PerformanceC.json'),
	CG: await getFile<PerformanceFile>('ExcelOutput/PerformanceCG.json'),
	D: await getFile<PerformanceFile>('ExcelOutput/PerformanceD.json'),
	DS: await getFile<PerformanceFile>('ExcelOutput/PerformanceDS.json'),
	E: await getFile<PerformanceFile>('ExcelOutput/PerformanceE.json'),
}

export interface MissionStep {
	id: number
	title: string
	description: string
	location?: Area
	characters: string[]
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
	
	private charset: Set<string> = new Set<string>(['Trailblazer'])
	
	get characters(): string[] {
		return [...this.charset.values()]
	}
	
	static findPerformance(id: string | number): Performance | null {
		for (const file of Object.values(performance)) {
			const found = Object.values(file).find(perf => perf.PerformanceID == id)
			if (found) return found
		}
		return null
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
		const dat = Object.values(this.missionData).find(dat => dat.MainMissionID == missionId)
		if (!dat) {
			throw new TypeError(`Unknown mission ID ${missionId}`)
		}
		return new Mission(dat)
	}

	get pagetitle(): string {
		return wikiTitle(this.name, 'mission', this.id)
	}
	
	prev?: Mission
	
	async getSteps(): Promise<MissionStep[]> {
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
			const perfData = Mission.findPerformance(currentStep.SubMissionID)
			
			const characters = new Set<string>()
			const addChars = (talk: { TalkSentenceID: number }) => {
				const chr = textMap.getSentenceMeta(talk.TalkSentenceID)?.speaker
				if (chr && chr != '(Trailblazer)') {
					characters.add(chr)
					this.charset.add(chr)
				}
			}
			
			if (perfData && perfData.PerformancePath) {
				const act = await getFileSafe<Act>(perfData.PerformancePath)
				for (const sequence of act?.OnStartSequece || []) {
					for (const task of sequence.TaskList) {
						switch (task.$type) {
							case 'RPG.GameCore.PlayAndWaitRogueSimpleTalk':
							case 'RPG.GameCore.PlayAndWaitSimpleTalk':
							case 'RPG.GameCore.PlayRogueSimpleTalk':
								task.SimpleTalkList.forEach(addChars)
								break
						}
					}
				}
			}
			
			steps.push({
				id: currentStep.SubMissionID,
				title: textMap.getText(currentStep.TargetText),
				description: textMap.getText(currentStep.DescrptionText),
				location: perfData?.PlaneID ? await Area.fromId(perfData.PlaneID).catch(err => void console.error(err)) : undefined,
				characters: [...characters.values()]
			})
			index++
		}
		
		steps.sort((step1, step2) => step1.id - step2.id)
		
		return steps
	}
	
	getRewards() {
		const initRewards = ItemList.fromRewardId(this.data.RewardID)
		return initRewards.length > 0 ? initRewards : ItemList.fromRewardId(this.data.DisplayRewardID)
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
					if (mission.type == this.type && mission.name != this.name) {
						this.prev = mission
					}
					break
				
				case 'SequenceNextDay':
					const gateMission = Mission.fromId(paramData.Value)
					requirements.push(`Complete ${gateMission.plainLink()} and wait for the next Daily [[Reset]]`)
					if (gateMission.type == this.type && gateMission.name != this.name) {
						this.prev = gateMission
					}
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
	
	static searchByName(name: string, type: MissionType, prioritizeRewards?: boolean): Mission | undefined {
		const found: Mission[] = []
		for (const mission of Object.values(this.missionData)) {
			if (textMap.getText(mission.Name) == name && missionTypeMap[mission.Type] == type) {
				found.push(new Mission(mission))
			}
		}
		
		if (!prioritizeRewards) {
			const foundDesc = found.find(data => data.description)
			if (foundDesc) return foundDesc
		}
		
		return found.find(data => data.getRewards().length > 0) || (found.length == 1 && found[0] || undefined)
	}
	
	getNext(): Mission[] {
		const list = this.data.NextMainMissionList?.map(data => Mission.fromId(data)) || []
		if (this.data.NextTrackMainMission) {
			let next = Mission.fromId(this.data.NextTrackMainMission)
			if (next.id == this.id) return list
			else if (next.name == this.name) next = next.getNext()[0]
			list.unshift(next)
		}
		return list
	}
	
	getChapterName(): string | undefined {
		if (!this.data.ChapterID) return
		
		const name = textMap.getText(Object.values(chapterData).find(chap => chap.ID == this.data.ChapterID)?.ChapterName)
		return wikiTitle(name + ((this.type == 'Companion' && name != 'Slices of Life Before the Furnace' && name != 'Age of Awakening' && name != 'Cosmic Splendor and Merited Praises') ? ' (Companion Mission Chapter)' : ''))
	}
	
	getChapterLink(): string | undefined {
		if (!this.data.ChapterID) return
		
		const name = wikiTitle(textMap.getText(Object.values(chapterData).find(chap => chap.ID == this.data.ChapterID)?.ChapterName))
		
		if (this.type == 'Companion' && name != 'Slices of Life Before the Furnace' && name != 'Age of Awakening' && name != 'Cosmic Splendor and Merited Praises') {
			return `[[${wikiTitle(name, 'mission')} (Companion Mission Chapter)|${name}]]`
		}
		else {
			return wikiTitleLink(name, 'mission')
		}
	}
	
	async getImage() {
		if (!this.description) {
			return undefined
		}
		
		if (existsSync(config.asset_roots.Texture2D + `/SpriteOutput/Chronicle/${this.id}_m.png`)) { // "Chronicle" configs are out of date since 2.2
			return {
				stelle: `SpriteOutput/Chronicle/${this.id}_f.png`,
				caelus: `SpriteOutput/Chronicle/${this.id}_m.png`,
			}
		} else if (existsSync(config.asset_roots.Texture2D + `/SpriteOutput/Chronicle/${this.id}.png`)) {
			return `SpriteOutput/Chronicle/${this.id}.png`
		} else {
			return undefined
		}
	}
}