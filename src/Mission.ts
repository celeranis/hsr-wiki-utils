import { existsSync } from 'fs';
import config from '../config.json' with { 'type': 'json' };
import { Event } from './Event.js';
import { Item, ItemList } from './Item.js';
import { wikiTitle, wikiTitleLink } from './Shared.js';
import { textMap } from './TextMap.js';
import { ActDialogueTree, DialogueTaskEntry } from './dialogue/Dialogue.js';
import { BaseDialogueTask } from './dialogue/DialogueBase.js';
import type { EnvData } from './dialogue/Environment.js';
import { FinishPerformanceTask } from './dialogue/tasks/Performance.js';
import { getExcelFile, getFile } from './files/GameFile.js';
import { ItemReference } from './files/Item.js';
import { FinishAction, InternalMissionInfo, InternalSubMissionInfo, MainMissionScheduleData, type InternalFateAtlasEntry, type InternalMainMission, type InternalMissionChapter, type InternalMissionType, type InternalSubMission } from './files/Mission.js';
import { Act } from './files/graph/Dialog.js';
import { Area, AreaFloor } from './maps/Area.js';
import type { LevelGroup, LevelGroupDialogueTree } from './maps/LevelGroup.js';
import type { BaseMapDialogue, NPCDialogueTree } from './maps/NPCDialogue.js';
import { DialogueNode } from './util/AbstractDialogueTree.js';

export const MainMission = await getExcelFile<InternalMainMission>('MainMission.json', 'MainMissionID')
export const SubMission = await getExcelFile<InternalSubMission>('SubMission.json', 'SubMissionID')
export const ChronicleConclusion = await getExcelFile<InternalFateAtlasEntry>('ChronicleConclusion.json', 'MissionID')
export const MissionChapterConfig = await getExcelFile<InternalMissionChapter>('MissionChapterConfig.json', 'ID')
export const MainMissionSchedule = await getExcelFile<MainMissionScheduleData>('MainMissionSchedule.json', 'MainMissionID')

export type MissionType = 'Trailblaze' | 'Adventure' | 'Companion' | 'Continuance' | 'Daily'
const missionTypeMap: Record<InternalMissionType, MissionType> = {
	Main: 'Trailblaze',
	Branch: 'Adventure',
	Companion: 'Companion',
	Daily: 'Daily',
	Gap: 'Continuance'
}

export class Mission {
	static readonly missionData = MainMission
	static readonly fatesAtlasData = ChronicleConclusion
	static readonly stepData = MissionChapterConfig
	name: string
	name_hash: number | bigint
	type: MissionType
	id: number
	description?: string
	
	event?: Event
	
	constructor(public data: InternalMainMission) {
		this.name_hash = data.Name?.Hash
		this.name = textMap.getText(data.Name)
		this.type = missionTypeMap[data.Type] || data.Type
		this.id = data.MainMissionID
		this.description = textMap.getText(ChronicleConclusion[data.MainMissionID]?.MissionConclusion)
		
		if (MainMissionSchedule[this.id]?.ActivityModuleID) {
			this.event = Event.fromActivityModuleId(MainMissionSchedule[this.id].ActivityModuleID)
		}
	}
	
	charset: Set<string> = new Set<string>(['Trailblazer'])
	
	get characters(): string[] {
		return [...this.charset.values()]
	}
	
	mission_info?: InternalMissionInfo
	
	async getMissionInfo() {
		return this.mission_info = await getFile<InternalMissionInfo>(`Config/Level/Mission/${this.id}/MissionInfo_${this.id}.json`)
			.catch(err => { console.warn(`No MissionInfo found for ${this.id} "${this.name}" - ${err}`); return undefined })
	}
	
	get displayType(): string {
		switch (this.type) {
			case 'Continuance':
				return 'Trailblaze Continuance'
			
			default:
				return `${this.type} Mission`
		}
	}
	
	link(noChapter?: boolean): string {
		if (!this.name) {
			return `{{cx}}<!--Hidden Mission ID ${this.id}-->`
		}
		return noChapter ? `{{Mission|${this.pagetitle}|showChapter=0}}` : `{{Mission|${this.pagetitle}}}`
	}
	
	plainLink(): string {
		if (!this.name) {
			return `{{cx}}<!--Hidden Mission ID ${this.id}-->`
		}
		return `[[${this.displayType}]] ''${wikiTitleLink(this.name, 'mission')}''`
	}
	
	static fromId(missionId: string | number): Mission {
		const dat = this.missionData[missionId]
		if (!dat) {
			throw new TypeError(`Unknown mission ID ${missionId}`)
		}
		return new Mission(dat)
	}

	get pagetitle(): string {
		return wikiTitle(this.name, 'mission', this.id)
	}
	
	prev?: Mission
	
	async getSteps(sortedWithDialogue: boolean): Promise<MissionStep[]> {
		const missionInfo = await this.getMissionInfo()
		if (missionInfo) {
			// preferred method
			const unsortedSteps: MissionStep[] = missionInfo.SubMissionList.map(info => new MissionStep(SubMission[info.ID], this, info))
			
			if (!sortedWithDialogue) return unsortedSteps
			
			const dialogue: (MissionDialogueTree | NPCDialogueTree | LevelGroupDialogueTree)[] = []
			for (const step of unsortedSteps) {
				const thisDialogue = await step.loadDialogue()
				if (thisDialogue) {
					dialogue.push(thisDialogue)
				}
				for (const npcDialogue of await step.getMapDialogue()) {
					const npcd = await npcDialogue.loadDialogue(thisDialogue?.environment ?? { main_mission_id: this.id, sub_mission_id: step.id })
					if (!npcd) continue
					dialogue.push(npcd)
				}
			}
			await ActDialogueTree.crossResolveStrings(dialogue)
			
			for (const tree of dialogue) {
				tree.optimize()
			}
			
			const sortedSteps: MissionStep[] = []
			const addSteps = (steps: MissionStep[], why: string | ((step: MissionStep) => string)) => {
				if (!steps.length) return
				
				for (const step of steps) {
					if (step && !sortedSteps.includes(step)) {
						step.order_reason = typeof why == 'function' ? why(step) : why
						sortedSteps.push(step)
						
						if (step.finish_condition?.type == 'SubMissionFinishCnt') {
							addSteps(
								unsortedSteps.filter(ustep => 
									step.finish_condition!.param_list_int!.includes(ustep.id)
									&& !sortedSteps.includes(ustep),
								),
								`${typeof why == 'function' ? why(step) : why}-${step.id}:list`
							)
						}
					}
				}

				addSteps(
					unsortedSteps.filter(ustep =>
						ustep.start_condition?.type == 'AnySequence'
						&& ustep.start_condition.param_list_int!.find(id => steps.find(step => step.id == id))
						&& !sortedSteps.includes(ustep)
					),
					(ustep => {
						const fstep = steps.find(step => ustep.start_condition?.param_list_int!.find(id => step.id == id))
						return `${fstep?.order_reason}-${fstep?.id}:chain`
					})
				)
			}
			
			addSteps(missionInfo.StartSubMissionList.map(id => unsortedSteps.find(step => step.id == id)).filter(s => s != undefined), 'startids')
			addSteps(unsortedSteps.filter(step => step.start_condition!.type == 'Auto'), 'auto')

			for (const step of unsortedSteps.toSorted((s0, s1) => (s0.progress ?? 0) - (s1.progress ?? 0))) {
				if (!missionInfo.FinishSubMissionList.includes(step.id)) {
					addSteps([step], 'byid')
				}
			}

			addSteps(missionInfo.FinishSubMissionList.map(id => unsortedSteps.find(step => step.id == id)).filter(s => s != undefined), 'finish')
			
			return sortedSteps
		} else {
			const steps: MissionStep[] = []
			// dumber method when MissionInfo is unavailabile
			let stepList = Object.values(SubMission).filter(data =>
				data.SubMissionID.toString().startsWith(this.id.toString())
				&& data.SubMissionID.toString().length - this.id.toString().length <= 2
			)
			if (!stepList.length) {
				console.warn(`Could not find any SubMissions for Mission "${this.name}" (${this.id})`)
			}
			let index = 1

			for (const currentStep of stepList) {
				steps.push(new MissionStep(currentStep, this))
				index++
			}

			steps.sort((step1, step2) => step1.id - step2.id)
			
			return steps
		}
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
				
				case 'Auto':
					break
				
				default:
					requirements.push(`{{subst:void|<!--Unknown: ${JSON.stringify(paramData)}-->}}`)
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
		if (this.data.NextTrackMainMission && MainMission[this.data.NextTrackMainMission]) {
			let next = Mission.fromId(this.data.NextTrackMainMission)
			if (next.id == this.id) return list
			else if (next.name == this.name) next = next.getNext()[0]
			list.unshift(next)
		}
		return list
	}
	
	getChapterName(): string | undefined {
		if (!this.data.ChapterID) return
		
		const name = textMap.getText(Object.values(MissionChapterConfig).find(chap => chap.ID == this.data.ChapterID)?.ChapterName)
		return wikiTitle(name + ((this.type == 'Companion' && name != 'Slices of Life Before the Furnace' && name != 'Age of Awakening' && name != 'Cosmic Splendor and Merited Praises') ? ' (Companion Mission Chapter)' : ''))
	}
	
	getChapterLink(): string | undefined {
		if (!this.data.ChapterID) return
		
		const name = wikiTitle(textMap.getText(Object.values(MissionChapterConfig).find(chap => chap.ID == this.data.ChapterID)?.ChapterName))
		
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

export interface StepCondition {
	type: InternalSubMissionInfo['TakeType'] | InternalSubMissionInfo['FinishType']
	param_type?: InternalSubMissionInfo['ParamType']
	params_int: number[]
	params_str: string[]
	param_list_int?: number[]
	param_list_str?: string[]
	param_items?: ItemReference[]
}

export class MissionStep {
	id: number
	name: string
	description: string
	
	json_path?: string
	progress?: number
	
	floor_id?: number
	plane_id?: number
	
	start_condition?: StepCondition
	finish_condition?: StepCondition
	
	dialogue?: MissionDialogueTree
	finish_actions?: FinishAction[]
	
	group_ids?: number[]
	
	order_reason?: string
	
	async getArea() {
		return this.plane_id ? await Area.fromId(this.plane_id) : undefined
	}
	
	async getFloor() {
		return this.floor_id && this.plane_id ? await AreaFloor.fromId(this.plane_id, this.floor_id) : undefined
	}
	
	groups?: LevelGroup[]
	async getGroups() {
		return this.groups ??= await (await this.getFloor())?.loadSubMissionGroups(this.id, this.group_ids) ?? []
	}
	
	constructor(data?: InternalSubMission, public main_mission?: Mission, info?: InternalSubMissionInfo) {
		this.id = data?.SubMissionID ?? info?.ID!
		this.name = textMap.getText(data?.TargetText)
		this.description = textMap.getText(data?.DescrptionText)
		
		if (info) {
			this.progress = info.Progress
			
			this.floor_id = info.LevelFloorID
			this.plane_id = info.LevelPlaneID
			
			this.start_condition = MissionStep.getCondition(info, info.TakeType, 'Take')
			this.finish_condition = MissionStep.getCondition(info, info.FinishType, '')
			
			this.json_path = info.MissionJsonPath
			this.finish_actions = info.FinishActionList
			
			this.group_ids = info.GroupIDList ?? []
			if (info.WayPointGroupID && info.WayPointFloorID == this.floor_id && !this.group_ids.includes(info.WayPointGroupID)) {
				this.group_ids.push(info.WayPointGroupID)
			}
		}
	}
	
	async loadDialogue() {
		if (!this.json_path || this.id == 202040105 || this.id == 404011001) return
		const tree = this.dialogue ??= await MissionDialogueTree.fromStep(this)
		if (tree && this.main_mission) {
			tree.environment.characters.forEach(chr => this.main_mission?.charset.add(chr == '(Trailblazer)' ? 'Trailblazer' : chr))
		}
		return tree
	}
	
	async getMapDialogue() {
		const dialogue: (BaseMapDialogue | LevelGroup)[] = []
		const groups = await this.getGroups()
		for (const group of groups) {
			const npcDialogueList = await group.getDialogueForMission(this.id)
			for (const npcDialogue of npcDialogueList) {
				dialogue.push(npcDialogue)
			}
		}
		return dialogue
	}
	
	static getCondition(data: any, type: StepCondition['type'], prefix: string) {
		const conditionData: StepCondition = {
			type,
			params_int: [],
			params_str: [],
			param_items: data[prefix + 'ParamItemList'],
			param_list_int: data[prefix + 'ParamIntList'],
			param_list_str: data[prefix + 'ParamStrList']
		}
		
		let i = 1
		while (data[prefix + 'ParamStr' + i] != undefined) {
			conditionData.params_str.push(data[prefix + 'ParamStr' + i])
			i += 1
		}
		
		i = 1
		while (data[prefix + 'ParamInt' + i] != undefined) {
			conditionData.params_int.push(data[prefix + 'ParamInt' + i])
			i += 1
		}
		
		return conditionData
	}
}

export class MissionDialogueTree extends ActDialogueTree {
	type: 'mission' = 'mission'
	
	finish_keys: string[] = []
	
	protected constructor(public act: Act, public step: MissionStep) {
		super(act, `submission_${step.id}`)
		this.environment.main_mission_id = step.main_mission?.id
		this.environment.sub_mission_id = step.id
	}

	getCharacters() {
		const participants = new Set<string>()
		for (const task of this.list()) {
			if (task && 'character' in task && typeof task.character == 'string' && task.character && task.character != '???') {
				participants.add(task.character)
			}
		}
		return [...participants]
	}
	
	static async fromStep(step: MissionStep, env?: EnvData) {
		const actData = await getFile<Act>(step.json_path!)
			.catch(err => void console.error(`Failed to load ${step.json_path}: ${err}`))
		if (!actData) return undefined
		const tree = new this(actData, step)
		tree.environment.applyData(env)
		tree.root = await tree.processAct(actData)
		return tree
	}
	
	nodeAdded(node: DialogueNode<BaseDialogueTask | DialogueTaskEntry>) {
		if (node instanceof FinishPerformanceTask) {
			this.finish_keys.push(node.key)
		}
	}
	
	async wikitext(): Promise<string> {
		const output: string[] = [await super.wikitext()]
		if (this.step.finish_actions) {
			for (const action of this.step.finish_actions) {
				if (action.FinishActionType == 'addMissionItem' || action.FinishActionType == 'addRecoverMissionItem') {
					output.push(`;(Obtain ${Item.fromId(action.FinishActionPara[0])?.asItemTemplate(20, { x: action.FinishActionPara[1] }) || `[Unknown Item ${action.FinishActionPara[0]} ×${action.FinishActionPara[1]}]`})`)
				} else if (action.FinishActionType == 'delMissionItem') {
					output.push(`;(Lose ${Item.fromId(action.FinishActionPara[0])?.asItemTemplate(20, { x: action.FinishActionPara[1] }) || `[Unknown Item ${action.FinishActionPara[0]} ×${action.FinishActionPara[1]}]`})`)
				} else if (action.FinishActionType == 'Recover') {
					output.push(`;(Fully recovers all allies' HP)`)
				}
			}
		}
		return output.join('\n')
	}
}