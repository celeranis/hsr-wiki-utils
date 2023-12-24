import { readFileSync } from 'fs'
import config from '../config.json' with { type: "json" }
import { BlessingGroup } from './Blessing.js'
import { CurioGroup } from './Curio.js'
import { Act, DialogSequence } from './Dialog.js'
import { AeonPath, VERSION_COMMITS, pathDisplayName, pathIcon } from './Shared.js'
import { Stage } from './Stage.js'
import { HashReference, TextMap } from './TextMap.js'

export interface InternalEventSection {
	EventID: number,
	EventDisplayID?: number,
	EffectType?: EffectType,
	EffectParamList: number[]
	CostType?: CostType
	CostParamList: number[]
	DescValue?: number
	ConditionIDList: number[]
	AeonOption: AeonPath
	
	// legacy
	EventTitle?: HashReference
	EventDesc?: HashReference
	EventDetailDesc?: HashReference
}

export interface InternalEventSectionDisplay {
	EventDisplayID: number
	EventTitle: HashReference
	EventDesc: HashReference
	EventDetailDesc: HashReference
}

export interface InternalEventName {
	TalkNameID: number
	Name: HashReference
	SubName: HashReference
	IconPath: string
	ImgPath: string
	ImageID: number
}

export interface InternalTalkSentence {
	TalkSentenceID: number
	TextmapTalkSentenceName: HashReference
	TalkSentenceText: HashReference
	VoiceID?: number
}

export interface InternalHandbookEvent {
	EventID: number
	EventTitle: HashReference
	EventType: HashReference
	EventDesc: HashReference
	EventImage: string
	EventReward: number
	Order: number
	EventTypeList: number[]
	UnlockHintDesc: HashReference
	ImageID: number
	DialoguePath: string
}

export type EffectType =
	'ReplaceRogueBuffKeepLevel' | 'GetItem' | 'TriggerDialogueEventList'
	| 'GetRogueBuff' | 'GetChessRogueCheatDice' | 'GetRogueMiracle'
	| 'RecoverLineup' | 'TriggerRogueBuffSelect' | 'TriggerRogueMiracleSelect' | 'ChangeChessRogueActionPoint'
	| 'TriggerRandomEvent' | 'UpRogueBuffLevel' | 'TriggerBattle' | 'TriggerRandomResult' | 'TriggerRogueBuffReforge'
	| 'GetAllRogueBuffInGroup' | 'TriggerRogueMiracleTrade' | 'ReplaceRogueBuff' | 'ChangeRogueMiracleToRogueCoin'
	| 'RemoveRogueMiracle' | 'GetItemByPercent' | 'RemoveRogueBuff' | 'RepairRogueMiracleByGroup' | 'TriggerRogueBuffDrop' 
	| 'ChangeRogueMiracleToRogueMiracle' | 'ChangeRogueMiracleToRogueBuff' | 'DestroyRogueMiracle' | 'GetChessRogueRerollDice' 
	| 'GetRogueBuffByMiracleCount'
	| 'SetChessRogueNextStartCellAdventureRoomType' | 'FinishChessRogue'

export type CostType = 'CostItemValue' | 'CostHpCurrentPercent' | 'CostHpMaxPercent' | 'CostItemPercent' | 'CostHpSpToPercent'

const ITEMS = {
	31: 'Cosmic Fragments'
}

const SIMPLE_EFFECTS: {[effectType: string]: (...args: number[]) => (string)} = {
	GetItem: (itemId, count) => `Obtain ${count} ${ITEMS[itemId] ?? `[Unknown Item ${itemId}]`}`,
	GetRogueBuff: (blessingGroup) => `Obtain a random ${BlessingGroup.nameForId(blessingGroup, false)}`,
	GetChessRogueCheatDice: (count) => `Obtain ${count} cheat chance(s)`,
	GetRogueMiracle: (curioGroup, count) => `Obtain ${count || 1} random ${CurioGroup.nameForId(curioGroup, count > 1)}`,
	FinishChessRogue: () => 'Immediately ends the current run.',
	RecoverLineup: (hp, energy, tp) => `Immediately recovers ${hp}% Max HP, ${energy}% Energy, and ${tp} Technique Points`,
	TriggerRogueBuffSelect: (blessingGroup, optionCount, _unknown) => `Obtain a ${BlessingGroup.nameForId(blessingGroup, false)}`,
	TriggerRogueMiracleSelect: (curioGroup, optionCount) => `Obtain a ${CurioGroup.nameForId(curioGroup, false)}`,
	UpRogueBuffLevel: (blessingGroup, count) => `Enhance ${count} random ${BlessingGroup.nameForId(blessingGroup, count != 1)}`,
	TriggerRogueBuffReforge: (discardGroup, discardOptionCount, replacementGroup, replacementOptionCount, _unknown) => 
		`Discard a ${BlessingGroup.nameForId(discardGroup, false)} in exchange for a ${BlessingGroup.nameForId(replacementGroup, false)}`,
	GetAllRogueBuffInGroup: (blessingGroup) => `Obtain all ${BlessingGroup.nameForId(blessingGroup, true)}`,
	ReplaceRogueBuff: (discardGroup, discardCount, replacementGroup, replacementCount) =>
		`Discard ${discardCount || 1} random ${BlessingGroup.nameForId(discardGroup, discardCount != 1)} in exchange for ${replacementCount || 1} ${BlessingGroup.nameForId(replacementGroup, replacementCount != 1)}`,
	ChangeRogueMiracleToRogueCoin: (discardGroup, fragments, _unknown) => `Exchange all ${CurioGroup.nameForId(discardGroup)} for ${fragments} Cosmic Fragments each`,
	RemoveRogueMiracle: (curioGroup, count) => `Discard ${count ? `${count} random` : 'all'} ${CurioGroup.nameForId(curioGroup, count != 1)}`,
	GetItemByPercent: (itemId, percent) => `Obtain ${percent}% of currently possessed ${ITEMS[itemId] || `[Unknown Item ${itemId}]`}`,
	RemoveRogueBuff: (blessingGroup, count) => `Discard ${count || 'all'} ${BlessingGroup.nameForId(blessingGroup, count != 1)}`,
	RepairRogueMiracleByGroup: (curioGroup, count) => `Repair ${count || 'all'} ${CurioGroup.nameForId(curioGroup, count != 1)}`,
	TriggerRogueBuffDrop: (blessingGroup, optionCount) => `Discard a ${BlessingGroup.nameForId(blessingGroup, false)}`,
	ChangeRogueMiracleToRogueMiracle: (discardGroup, replaceGroup, count) => 
		`Discard ${count || 'all'} ${CurioGroup.nameForId(discardGroup, count != 1)} in exchange for the same number of random ${CurioGroup.nameForId(replaceGroup, true)}`,
	ChangeRogueMiracleToRogueBuff: (discardGroup, replaceGroup, count) =>
		`Discard ${count || 'all'} ${CurioGroup.nameForId(discardGroup, count != 1)} in exchange for the same number of random ${BlessingGroup.nameForId(replaceGroup, true)}`,
	DestroyRogueMiracle: (destroyGroup, count) => `Destroy ${count || 'all'} ${CurioGroup.nameForId(destroyGroup)}`,
	GetChessRogueRerollDice: (count) => `Obtain ${count} reroll chance(s)`,
	GetRogueBuffByMiracleCount: (blessingGroup) => `Obtain a random ${BlessingGroup.nameForId(blessingGroup, false)} for every Curio currently in possession`,
	TriggerBattle: (stageId) => {
		const stage = Stage.infoFor(stageId)
		if (stage.elite) {
			return `Enter a ${stage.waves.length}-wave battle against ${stage.elite_count} ${stage.type}-type Elite ${stage.elite_count > 1 ? 'Enemies' : 'Enemy'}`
		} else {
			return `Enter a ${stage.waves.length}-wave battle against Normal Enemies`
		}
	}
}

const SIMPLE_COSTS: {[costType: string]: (...args: number[]) => (string)} = {
	CostItemValue: (itemId, count) => `Lose ${count} ${ITEMS[itemId] ?? `[Unknown Item ${itemId}]`}`,
	CostHpCurrentPercent: (percent) => `All allies lose ${percent}% of their current HP`,
	CostHpMaxPercent: (percent) => `All allies lose ${percent}% of their Max HP`,
	CostItemPercent: (itemId, percent) => `Lose ${percent}% of currently possessed ${ITEMS[itemId] ?? `[Unknown Item ${itemId}]`}`,
	CostHpSpToPercent: (hp, energy) => `Set allies' HP to ${hp}% of Max HP and Energy to ${energy}% of Max Energy`
}

export type OutputList = (string | OutputList)[]

export class EventSection {
	id: number
	display_id?: number
	effect_type?: EffectType
	effect_params: number[]
	cost_type?: CostType
	cost_params: number[]
	path_choice?: AeonPath
	
	title?: string
	description?: string
	description_detail?: string
	
	readonly text_map: TextMap
	
	constructor(public parent: Event, public internal: InternalEventSection, public display?: InternalEventSectionDisplay, public customString?: string) {
		this.id = internal.EventID
		this.display_id = internal.EventDisplayID
		this.effect_type = internal.EffectType
		this.effect_params = internal.EffectParamList
		this.cost_type = internal.CostType
		this.cost_params = internal.CostParamList
		this.path_choice = internal.AeonOption
		
		this.text_map = parent.text_map
		
		const params = ['[current path]', internal.DescValue]
		this.title = this.text_map.getText(internal.EventTitle || display?.EventTitle, params)
		this.description_detail = this.text_map.getText(internal.EventDetailDesc || display?.EventDetailDesc, params)
		this.description = this.text_map.getText(internal.EventDesc || display?.EventDesc, params) + (this.description_detail ? ` (${this.description_detail})` : '')
		
		this.parent.sections.set(this.id, this)
	}
	
	/**
	 * Ramping chance of a main event
	 */
	descTriggerRandomEvent(output: OutputList, isLoop: boolean) {
		const startingPercent = this.effect_params[1]
		const incrementPercent = this.effect_params[2]

		const percentages: number[] = [startingPercent]
		
		for (let percent = startingPercent; percent < 100;) {
			percent = Math.min(percent + incrementPercent, 100)
			percentages.push(percent)
		}
		
		const percentDisplay = `(${percentages.join('/')})`
		if (this.description) {
			this.description = this.text_map.replaceParams(this.description, ['[current path]', this.internal.DescValue, percentDisplay])
		}
		output.push(`;(Main outcome, ${percentDisplay}%)`)
		const section = this.parent.addSection(this.effect_params[0], isLoop)
		output.push(section?.output(undefined, isLoop) || [])
		
		const altOutcomes = this.effect_params.slice(3)
		const totalPercent = altOutcomes.reduce((total, val, i) => i % 2 == 0 ? total : total + val, 0)
		for (let i = 0; i < altOutcomes.length; i += 2) {
			const percent = Math.round((altOutcomes[i + 1] / totalPercent) * 100)
			output.push(`;(Alternate outcome ${(i / 2) + 1}, ${percent}%)`)
			const section = this.parent.addSection(altOutcomes[i], isLoop)
			output.push(section?.output(undefined, isLoop) || [])
		}
	}

	/**
	 * Traditional random outcome
	 */
	descTriggerRandomResult(output: OutputList, isLoop: boolean) {
		const totalPercent = this.effect_params.reduce((total, val, i) => i % 2 == 0 ? total : total + val, 0)

		for (let i = 0; i < this.effect_params.length; i += 2) {
			const percent = Math.round((this.effect_params[i + 1] / totalPercent) * 100)
			output.push(`;(Outcome ${(i / 2) + 1}, ${percent}%)`)
			const section = this.parent.addSection(this.effect_params[i], isLoop)
			output.push(section?.output(undefined, isLoop) || [])
		}
	}
	
	descTriggerCurioTrade(output: OutputList, isLoop: boolean) {
		output.push(`;(Discard a ${CurioGroup.nameForId(this.effect_params[0], false)})`)
		const section = this.parent.addSection(this.effect_params[2], isLoop)
		output.push(...section?.output(undefined, isLoop) || [])
	}
	
	descTriggerDialogEventList(output: OutputList, isLoop: boolean) {
		for (const sectionId of this.effect_params) {
			const section = this.parent.addSection(sectionId, isLoop)
			output.push(...section?.output(undefined, isLoop) || [])
		}
	}
	
	output(triggerCustomString: string | undefined = this.parent.sectionCustomStrings.get(this.id), isLoop = false): OutputList {
		console.group(`Starting section output for ${this.id}`)
		const output2: OutputList = []
		const output: OutputList = [output2]
		
		if (this.cost_type) {
			if (SIMPLE_COSTS[this.cost_type]) {
				output2.push(`;(${SIMPLE_COSTS[this.cost_type](...this.cost_params)})`)
			} else {
				console.warn(`Unknown CostType ${this.cost_type}. Params:`, this.cost_params)
			}
		}
		
		if (this.effect_type) {
			if (SIMPLE_EFFECTS[this.effect_type]) {
				output2.push(`;(${SIMPLE_EFFECTS[this.effect_type](...this.effect_params)})`)
			} else if (this.effect_type == 'TriggerRandomEvent') {
				this.descTriggerRandomEvent(output2, isLoop)
			} else if (this.effect_type == 'TriggerRandomResult') {
				this.descTriggerRandomResult(output2, isLoop)
			} else if (this.effect_type == 'TriggerRogueMiracleTrade') { // not sure why this isn't a cost
				this.descTriggerCurioTrade(output2, isLoop)
			} else if (this.effect_type == 'TriggerDialogueEventList') {
				this.descTriggerDialogEventList(output2, isLoop)
			} else {
				console.warn(`Unknown EffectType ${this.effect_type}. Params:`, this.effect_params)
			}
		}

		if (this.title) {
			output.unshift(`:${this.path_choice ? pathIcon(this.path_choice) : '{{DIcon|Star}}'} ${this.title} &mdash; ${this.description}`)
			if (this.path_choice) {
				output.unshift(`;(If embarking on the Path of [[Simulated Universe/Paths#${pathDisplayName(this.path_choice)}|${pathDisplayName(this.path_choice) }]] in a Simulated Universe Expansion)`)
			}
		}
		
		if (triggerCustomString) {
			output2.push(...this.parent.customString(triggerCustomString, isLoop))
		}
		
		console.groupEnd()
		
		return output
	}
}

export class Event {
	readonly text_map: TextMap = TextMap.default
	handbook_id: number
	name: string
	name_hash: number
	type: string
	description?: string
	image: string
	image_id: number
	reward_id: number
	handbook_order: number
	type_list: string[]
	graph_path: string

	sequences: DialogSequence[] = []
	
	static DIALOG_EVENT = JSON.parse(readFileSync(`./versions/${config.target_version}/DialogueEvent.json`).toString())
	static DIALOG_EVENT_DISPLAY = JSON.parse(readFileSync(`./versions/${config.target_version}/DialogueEventDisplay.json`).toString())
	static NPC_DIALOG = JSON.parse(readFileSync(`./versions/${config.target_version}/RogueNPCDialogue.json`).toString())
	static TALK_NAMES = JSON.parse(readFileSync(`./versions/${config.target_version}/RogueTalkNameConfig.json`).toString())
	static HANDBOOK = JSON.parse(readFileSync(`./versions/${config.target_version}/RogueHandBookEvent.json`).toString())
	static HANDBOOK_TYPES = JSON.parse(readFileSync(`./versions/${config.target_version}/RogueHandBookEventType.json`).toString())
	
	sections = new Map<number, EventSection>()
	sectionCustomStrings = new Map<number, string>()
	triggeredStrings = new Set<string>()
	
	constructor(handbook_id: number | InternalHandbookEvent) {
		const handbookEntry: InternalHandbookEvent = typeof handbook_id == 'object' ? handbook_id : Event.HANDBOOK[handbook_id]
		this.handbook_id = handbookEntry.EventID
		this.name = this.text_map.getText(handbookEntry.EventTitle)
		this.name_hash = handbookEntry.EventTitle.Hash
		this.type = this.text_map.getText(handbookEntry.EventType)
		this.description = this.text_map.getText(handbookEntry.EventDesc)
		this.image = handbookEntry.EventImage
		this.image_id = handbookEntry.ImageID
		this.reward_id = handbookEntry.EventReward
		this.handbook_order = handbookEntry.Order
		this.type_list = handbookEntry.EventTypeList.map(id => this.text_map.getText(Event.HANDBOOK_TYPES[id].RogueEventTypeTitle)!)
		this.graph_path = handbookEntry.DialoguePath
	}
	
	addSection(id: number, isLoop?: boolean): EventSection | null
	addSection(id: number): EventSection
	addSection(id: number, isLoop = false): EventSection | null {
		if (this.sections.has(id)) {
			return isLoop ? null : this.sections.get(id)!
		}
		
		const eventData = Event.DIALOG_EVENT[id]
		if (!eventData) {
			throw new TypeError(`No event data found for ${id}`)
		}
		return new EventSection(this, eventData, Event.DIALOG_EVENT_DISPLAY[eventData.EventDisplayID])
	}
	
	async loadSequences() {
		const act: Act = await fetch(`https://raw.githubusercontent.com/Dimbreath/StarRailData/${VERSION_COMMITS[config.target_version]}/${this.graph_path}`).then(res => res.json())
		this.sequences = act.OnStartSequece
		for (const sequence of this.sequences) {
			for (const task of sequence.TaskList) {
				if (task.$type == 'RPG.GameCore.WaitDialogueEvent') {
					for (const { DialogueEventID: sectionId, FailureCustomString: failString, SuccessCustomString: successString } of task.DialogueEventList) {
						this.sectionCustomStrings.set(sectionId, (successString || failString)!)
					}
				}
			}
		}
	}
	
	recurseOutput(output: OutputList, currentLevel: number): string {
		const finalOutput: string[] = []
		for (const text of output) {
			if (typeof text == 'string') {
				finalOutput.push(':'.repeat(currentLevel) + text)
			} else {
				finalOutput.push(this.recurseOutput(text, currentLevel + 1))
			}
		}
		return finalOutput.filter(v=>v.trim()).join('\n')
	}
	
	output(): string {
		console.group(`Starting output for ${this.name} (${this.graph_path})`)
		const output: OutputList = []
		
		if (this.sequences.length == 0) {
			throw new TypeError('Sequences not yet loaded')
		}
		
		output.push(...this.runSequence(this.sequences[0]))
		
		const finalOutput = this.recurseOutput(output, 0)
		
		console.groupEnd()
		
		return finalOutput
	}
	
	runSequence(sequence: DialogSequence): OutputList {
		const output: OutputList = []
		for (const task of sequence.TaskList) {
			switch (task.$type) {
				case 'RPG.GameCore.PlayAndWaitSimpleTalk':
				case 'RPG.GameCore.PlaySimpleTalk':
					for (const talk of task.SimpleTalkList) {
						const sentence = this.text_map.getSentence(talk.TalkSentenceID)
						output.push(':' + (sentence || '{{tx}}'))
					}
					break
				case 'RPG.GameCore.PlayOptionTalk':
					const isSimple = !task.OptionList[0].DialogueEventID
					let allSame: string | undefined = undefined

					for (const option of task.OptionList) {
						if (!allSame) allSame = option.TriggerCustomString
						else if (!option.TriggerCustomString || allSame != option.TriggerCustomString) {
							allSame = undefined
							break
						}
					}
					
					if (!isSimple) {
						// output.push(':{{DIcon|Arrow}} Select')
						
						// const choices: OutputList = []
						const nonPath = [] // put path choices first
						for (const option of task.OptionList) {
							const section = this.addSection(option.DialogueEventID!, sequence.IsLoop);
							(section?.path_choice ? output : nonPath).push(...section?.output(allSame ? undefined : option.TriggerCustomString, sequence.IsLoop) || [])
						}
						
						output.push(...nonPath)
						// output.push(choices)
					} else {
						for (const option of task.OptionList) {
							output.push(`:{{DIcon|Arrow}} ${this.text_map.getSentence(option.TalkSentenceID!, true)}`)
							if (!allSame && option.TriggerCustomString) {
								output.push(this.customString(option.TriggerCustomString, sequence.IsLoop))
							}
						}
					}
					
					if (allSame) {
						output.push(...this.customString(allSame, sequence.IsLoop))
					}
					break
				case 'RPG.GameCore.TriggerCustomString':
					output.push(...this.customString(task.CustomString.Value, sequence.IsLoop))
					break
			}
		}
		return output
	}
	
	customString(string: string, isLoop = false): OutputList {
		console.group(`CustomString ${string} triggered`)
		if (isLoop && this.triggeredStrings.has(string)) {
			return []
		}
		const sequence = this.sequences.find(seq => seq.TaskList.find(task => task.$type == 'RPG.GameCore.WaitCustomString' && task.CustomString.Value == string))
		if (!sequence) {
			console.error(`CustomString "${string}" not found`)
			return []
		}
		
		this.triggeredStrings.add(string)
		
		const output = this.runSequence(sequence)
		
		console.groupEnd()
		
		return output
	}
}