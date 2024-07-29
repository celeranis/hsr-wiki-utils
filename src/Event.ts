import { BlessingGroup } from './Blessing.js'
import { CurioGroup } from './Curio.js'
import { DynamicContent } from './DynamicContent.js'
import { AeonPath, Dictionary, pathDisplayName } from './Shared.js'
import { Stage } from './Stage.js'
import { HashReference, TextMap } from './TextMap.js'
import { Act, DialogSequence, DialogTask } from './files/Dialog.js'
import { getFile } from './files/GameFile.js'
import type { CostType, EffectType, InternalEventSection, InternalEventSectionDisplay, InternalHandbookEvent, InternalNPC, InternalTalkName } from './files/Occurrence.js'

const ITEMS = {
	31: 'Cosmic Fragments'
}

function describeWeight(weight: number) {
	if (weight < 50) {
		return 'Greatly decreases'
	} else if (weight < 100) {
		return 'Slightly decreases'
	} else if (weight <= 150) {
		return 'Slightly increases'
	} else if (weight <= 300) {
		return 'Significantly increases'
	} else {
		return 'Greatly increases'
	}
}

const SIMPLE_EFFECTS: {[effectType: string]: (...args: number[]) => (string)} = {
	GetItem: (itemId, count) => `Obtain ${count} ${ITEMS[itemId] ?? `[Unknown Item ${itemId}]`}`,
	GetRogueBuff: (blessingGroup) => `Obtain a random ${BlessingGroup.nameForId(blessingGroup, false)}`,
	GetChessRogueCheatDice: (count) => `Obtain ${count} cheat chance(s)`,
	GetRogueMiracle: (curioGroup, count) => `Obtain ${count || 1} random ${CurioGroup.nameForId(curioGroup, count > 1)}`,
	FinishChessRogue: () => 'Immediately ends the current run.',
	RecoverLineup: (hp, energy, tp) => `Immediately recovers ${hp}% Max HP, ${energy}% Energy, and ${tp} Technique Points`,
	ChangeLineupData: (hp, energy, tp) => `Immediately recovers ${hp}% Max HP, ${energy}% Energy, and ${tp} Technique Points`,
	TriggerRogueBuffSelect: (blessingGroup, optionCount, _unknown) => `Obtain a ${BlessingGroup.nameForId(blessingGroup, false)}`,
	TriggerRogueMiracleSelect: (curioGroup, optionCount) => `Obtain a ${CurioGroup.nameForId(curioGroup, false)}`,
	UpRogueBuffLevel: (blessingGroup, count) => `Enhance ${count} random ${BlessingGroup.nameForId(blessingGroup, count != 1)}`,
	TriggerRogueBuffEnhance: (blessingGroup, _unknown, count) => `Enhance ${count} random ${BlessingGroup.nameForId(blessingGroup, count != 1)}`,
	EnhanceRogueBuff: (blessingGroup, count) => `Enhance ${count} random ${BlessingGroup.nameForId(blessingGroup, count != 1)}`,
	TriggerRogueBuffReforge: (discardGroup, discardOptionCount, _unknown2, replacementGroup, replacementOptionCount, _unknown) => 
		`Discard a ${BlessingGroup.nameForId(discardGroup, false)} in exchange for a ${BlessingGroup.nameForId(replacementGroup, false)}`,
	GetAllRogueBuffInGroup: (blessingGroup) => `Obtain all ${BlessingGroup.nameForId(blessingGroup, true)}`,
	GetAllRogueBuffInGroupAndGetItem: (blessingGroup, itemId, amount, _unknown) =>
		`Obtain all ${BlessingGroup.nameForId(blessingGroup, true)} and ${amount} ${ITEMS[itemId] ?? `[Unknown Item ${itemId}]`}`,
	ReplaceRogueBuff: (discardGroup, discardCount, replacementGroup, replacementCount) =>
		`Discard ${discardCount || 1} random ${BlessingGroup.nameForId(discardGroup, discardCount != 1)} in exchange for ${replacementCount || 1} ${BlessingGroup.nameForId(replacementGroup, replacementCount != 1)}`,
	ChangeRogueMiracleToRogueCoin: (discardGroup, fragments, _unknown) => `Exchange all ${CurioGroup.nameForId(discardGroup)} for ${fragments} Cosmic Fragments each`,
	RemoveRogueMiracle: (curioGroup, count) => `Discard ${count ? `${count} random` : 'all'} ${CurioGroup.nameForId(curioGroup, count != 1)}`,
	GetItemByPercent: (itemId, percent) => `Obtain ${percent}% of currently possessed ${ITEMS[itemId] || `[Unknown Item ${itemId}]`}`,
	RemoveRogueBuff: (blessingGroup, count) => `Discard ${count || 'all'} ${BlessingGroup.nameForId(blessingGroup, count != 1)}`,
	RepairRogueMiracleByGroup: (curioGroup, count) => `Repair ${count || 'all'} ${CurioGroup.nameForId(curioGroup, count != 1)}`,
	RepairRogueMiracle: (curioGroup, count) => `Repair ${count || 'all'} ${CurioGroup.nameForId(curioGroup, count != 1)}`,
	TriggerRogueMiracleRepair: (curioGroup, _unknown, count) => `Select ${count || '?'} ${CurioGroup.nameForId(curioGroup, count != 1)} to repair`,
	TriggerRogueBuffDrop: (blessingGroup, optionCount) => `Discard a ${BlessingGroup.nameForId(blessingGroup, false)}`,
	ChangeRogueMiracleToRogueMiracle: (discardGroup, replaceGroup, count) => 
		`Discard ${count || 'all'} ${CurioGroup.nameForId(discardGroup, count != 1)} in exchange for the same number of random ${CurioGroup.nameForId(replaceGroup, true)}`,
	ChangeRogueMiracleToRogueBuff: (discardGroup, replaceGroup, count) =>
		`Discard ${count || 'all'} ${CurioGroup.nameForId(discardGroup, count != 1)} in exchange for the same number of random ${BlessingGroup.nameForId(replaceGroup, true)}`,
	DestroyRogueMiracle: (destroyGroup, count) => `Destroy ${count || 'all'} ${CurioGroup.nameForId(destroyGroup)}`,
	GetChessRogueRerollDice: (count) => `Obtain ${count} reroll chance(s)`,
	ChangeNousValue: (amount) => `${amount > 0 ? 'Increase' : 'Decrease'} Cognition Value by ${Math.abs(amount)}`,
	ReviveAvatar: (charCount, hpAmount, energyAmount) =>
		`Immediately revive ${charCount > 20 || charCount < 1 ? 'all' : charCount} characters and restore them to ${hpAmount}% Max HP`,
	GetRogueBuffByMiracleCount: (blessingGroup) => `Obtain a random ${BlessingGroup.nameForId(blessingGroup, false)} for every Curio currently in possession`,
	ChangeRogueNpcWeight: (npc_id, weight, _unknown) => `${describeWeight(weight)}<!--weight=${weight}--> the chance of encountering [[${TextMap.default.getText(Event.TALK_NAMES[npc_id]?.Name)}]]`,
	GetCoinByLoseCoin: (loseAmnt, _unknown, gainAmnt, _unknown2) => `Lose ${loseAmnt}% of Cosmic Fragments, but immediately regain ${gainAmnt}% of the amount lost{{Verify}}`,
	TriggerDestroyedRogueMiracleSelect: (curioGroup, _unknown, count) => `Select ${count} destroyed ${CurioGroup.nameForId(curioGroup, count != 1)}`,
	GetDestroyedRogueMiracle: (curioGroup, count) => `Obtain ${count} random destroyed ${CurioGroup.nameForId(curioGroup, count != 1)}`,
	ReplaceRogueBuffKeepLevel: (discardGroup, replaceGroup) => `Replace all ${BlessingGroup.nameForId(discardGroup)} with ${BlessingGroup.nameForId(replaceGroup)}, retaining the original Enhancement status`,
	DestroyRogueMiracleThenGetRogueMiracle: (destroyGroup, replaceGroup) => `Destroy all ${CurioGroup.nameForId(destroyGroup)} and obtain 2 ${CurioGroup.nameForId(replaceGroup)} for every Curio destroyed`,
	ChangeChessRogueActionPoint: (points) => `Obtain ${points} point${points == 1 ? '' : 's'} in the countdown`,
	ChangeDestroyedRogueMiracleToRogueMiracle: (_unknown, replaceGroup, _unknown2, _unknown3) => `Replace all destroyed Curios with ${CurioGroup.nameForId(replaceGroup)}`
}

const SIMPLE_COSTS: {[costType: string]: (...args: number[]) => (string)} = {
	CostItemValue: (itemId, count) => `Lose ${count} ${ITEMS[itemId] ?? `[Unknown Item ${itemId}]`}`,
	CostHpCurrentPercent: (percent) => `All allies lose ${percent}% of their current HP`,
	CostHpMaxPercent: (percent) => `All allies lose ${percent}% of their Max HP`,
	CostItemPercent: (itemId, percent) => `Lose ${percent}% of currently possessed ${ITEMS[itemId] ?? `[Unknown Item ${itemId}]`}`,
	CostHpSpToPercent: (hp, energy) => `Set allies' HP to ${hp}% of Max HP and Energy to ${energy}% of Max Energy`
}

export type OutputList = (string | OutputList)[]

export const PERFORMANCE_MAP: {[key: number]: AeonPath} = {
	1: 'Preservation',
	2: 'Remembrance',
	3: 'Nihility',
	4: 'Abundance',
	5: 'TheHunt',
	6: 'Destruction',
	7: 'Elation',
	8: 'Propagation',
	9: 'Erudition',
	
	101: 'Ruan Mei',
}

const GNG_CONDITION_MAP = {
	801: -40,
	802: -30,
	803: -20,
	804: -10,
	805: 0,
	806: 10,
	807: 20,
	808: 30,
	
	809: 40,
	810: 30,
	811: 20,
	812: 10,
	813: 0,
	814: -10,
	815: -20,
	816: -30,
}

export class EventSection {
	id: number
	display_id?: number
	effect_type?: EffectType
	effect_params: number[]
	cost_type?: CostType
	cost_params: number[]
	path_choice?: AeonPath
	condition_ids: number[]
	
	dynamic_content?: DynamicContent
	
	title?: string
	description?: string
	description_detail?: string
	
	readonly text_map: TextMap
	
	constructor(public parent: Event, public internal: InternalEventSection, public display?: InternalEventSectionDisplay, public customString?: string, overrideTitle?: HashReference) {
		this.id = internal.EventID
		this.display_id = internal.EventDisplayID
		this.effect_type = internal.RogueEffectType
		this.effect_params = internal.RogueEffectParamList
		this.cost_type = internal.CostType
		this.cost_params = internal.CostParamList
		this.path_choice = internal.AeonOption || PERFORMANCE_MAP[internal.PerformanceType || 0]
		this.condition_ids = internal.ConditionIDList
		
		this.text_map = parent.text_map
		
		if (internal.DynamicContentID) {
			this.dynamic_content = new DynamicContent(internal.DynamicContentID)
		}
		
		const params = [this.dynamic_content?.text_params?.join('/') || '[path]', internal.DescValue, undefined, undefined, internal.DescValue2, internal.DescValue3]
		this.title = this.text_map.getText(overrideTitle || internal.EventTitle || display?.OptionTitle, params)
		this.description_detail = this.text_map.getText(internal.EventDetailDesc || display?.OptionDetailDesc, params)
		this.description = this.text_map.getText(internal.EventDesc || display?.OptionDesc, params) + (this.description_detail ? ` (${this.description_detail})` : '')
		
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
		const section = this.parent.addSection(this.effect_params[3], isLoop)
		output.push(...section?.output(undefined, isLoop) || [])
	}
	
	descTriggerDialogEventList(output: OutputList, isLoop: boolean) {
		const firstEvent = this.effect_params[0]
		const allSame = !this.effect_params.find(id => id != firstEvent)
		
		if (allSame) {
			const section = this.parent.addSection(firstEvent, isLoop)
			output.push(
				`;(Repeat ${this.effect_params.length} times)`,
				section?.output(undefined, isLoop) || []
			)
		} else {
			for (const sectionId of this.effect_params) {
				const section = this.parent.addSection(sectionId, isLoop)
				output.push(...section?.output(undefined, isLoop) || [])
			}
		}
	}
	
	descTriggerBattle(output: OutputList) {
		const enemies = (this.dynamic_content || new Stage(this.effect_params[0])).asEnemyLists()
		output.push(';(Enter battle)')
		output.push([enemies])
	}
	
	output(triggerCustomString: string | undefined = this.parent.sectionCustomStrings.get(this.id), isLoop = false): OutputList {
		console.group(`Starting section output for ${this.id}${this.path_choice ? ` (${this.path_choice})` : ''}`)
		const output2: OutputList = []
		const output: OutputList = this.title ? [output2] : output2
		
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
			} else if (this.effect_type == 'TriggerRandomEvent' || this.effect_type == 'RepeatableGamble') {
				this.descTriggerRandomEvent(output2, isLoop)
			} else if (this.effect_type == 'TriggerRandomResult' || this.effect_type == 'TriggerRandomEventList') {
				this.descTriggerRandomResult(output2, isLoop)
			} else if (this.effect_type == 'TriggerRogueMiracleTrade') { // not sure why this isn't a cost
				this.descTriggerCurioTrade(output2, isLoop)
			} else if (this.effect_type == 'TriggerDialogueEventList') {
				this.descTriggerDialogEventList(output2, isLoop)
			} else if (this.effect_type == 'TriggerBattle') {
				this.descTriggerBattle(output2)
			} else {
				console.warn(`Unknown EffectType ${this.effect_type}. Params:`, this.effect_params)
			}
		}

		if (this.title) {
			output.unshift(
				this.path_choice ? 
					`:{{SU Special Dialogue|${pathDisplayName(this.path_choice)}|${this.title}|${this.description}}}`
					: `:{{DIcon|Star}} ${this.title} &mdash; ${this.description}`
			)
			if (this.path_choice) {
				if (this.path_choice == 'Ruan Mei') {
					output.unshift(`;(If [[Ruan Mei]] has been Downloaded for the current run)`)
				} else if (this.path_choice == 'Erudition') {
					output.unshift(`;(If Intra-Cognition is between ${this.condition_ids.map(id => GNG_CONDITION_MAP[id]).filter(v => v != null).sort().join(' and ')} in [[Simulated Universe: Gold and Gears]])`)
				} else {
					output.unshift(`;(If embarking on the Path of [[Simulated Universe/Paths#${pathDisplayName(this.path_choice)}|${pathDisplayName(this.path_choice)}]] in [[Simulated Universe: Swarm Disaster]])`)
				}
			}
		}
		
		if (triggerCustomString) {
			output2.push(...this.parent.customString(triggerCustomString, isLoop))
		}
		
		console.groupEnd()
		
		return output
	}
}

const VALID_DIALOGUE_TYPES = new Set<DialogTask['$type']>([
	'RPG.GameCore.PlayAndWaitRogueSimpleTalk',
	'RPG.GameCore.PlayRogueOptionTalk',
	'RPG.GameCore.PlayRogueSimpleTalk',
	'RPG.GameCore.TriggerCustomString'
])

const DIALOG_EVENT: Dictionary<InternalEventSection> = await getFile('ExcelOutput/DialogueEvent.json')
const DIALOG_EVENT_DISPLAY: Dictionary<InternalEventSectionDisplay> = await getFile('ExcelOutput/RogueDialogueOptionDisplay.json')
const NPC_DIALOG: Dictionary<Dictionary<InternalNPC>> = await getFile('ExcelOutput/RogueNPC.json')
const TALK_NAMES: Dictionary<InternalTalkName> = await getFile('ExcelOutput/RogueTalkNameConfig.json')
const HANDBOOK: Dictionary<InternalHandbookEvent> = await getFile('ExcelOutput/RogueHandBookEvent.json')
const HANDBOOK_TYPES: Dictionary<any> = await getFile('ExcelOutput/RogueHandBookEventType.json')

export class Event {
	readonly text_map: TextMap = TextMap.default
	handbook_id?: number
	name: string
	series_name: string
	subname: string
	name_hash: number
	type: string
	description?: string
	image: string
	image_id: number
	reward_id?: number
	handbook_order?: number
	type_list: string[]
	graph_path: string
	part_num: number

	sequences: DialogSequence[] = []
	
	static DIALOG_EVENT = DIALOG_EVENT
	static DIALOG_EVENT_DISPLAY = DIALOG_EVENT_DISPLAY
	// static NPC_DIALOG = NPC_DIALOG
	static TALK_NAMES = TALK_NAMES
	static HANDBOOK = HANDBOOK
	static HANDBOOK_TYPES = HANDBOOK_TYPES
	
	sections = new Map<number, EventSection>()
	sectionCustomStrings = new Map<number, string>()
	triggeredStrings = new Set<string>()
	
	constructor(public npc_dialog: InternalNPC) {
		this.handbook_id = npc_dialog.HandbookEventID
		const handbookEntry: (InternalHandbookEvent | undefined) = this.handbook_id ? Event.HANDBOOK[this.handbook_id] : undefined
		const talkName = npc_dialog._talk ?? Event.TALK_NAMES[npc_dialog.RogueNPCID]
		this.name_hash = npc_dialog._name?.Hash ?? handbookEntry?.EventTitle.Hash ?? talkName?.Name?.Hash
		this.name = this.text_map.getText(this.name_hash) || `Unknown Event ${npc_dialog.RogueNPCID}-${npc_dialog.DialogueProgress}`
		this.series_name = this.text_map.getText(talkName?.Name) || this.name
		this.type = this.text_map.getText(handbookEntry?.EventType ?? talkName?.SubName)
		this.subname = this.text_map.getText(talkName?.SubName) || 'Unknown'
		this.description = this.text_map.getText(handbookEntry?.EventDesc)
		this.image = handbookEntry?.EventImage ?? talkName?.ImgPath
		this.image_id = handbookEntry?.ImageID ?? talkName?.ImageID
		this.reward_id = handbookEntry?.EventReward
		this.handbook_order = handbookEntry?.Order
		this.type_list = handbookEntry?.EventTypeList.map(id => this.text_map.getText(Event.HANDBOOK_TYPES[id].RogueEventTypeTitle)!) || []
		this.graph_path = npc_dialog.DialoguePath ?? handbookEntry?.DialoguePath
		this.part_num = npc_dialog.DialogueProgress
	}
	
	addSection(id: number, isLoop?: boolean, overrideTitle?: HashReference): EventSection | null
	addSection(id: number): EventSection
	addSection(id: number, isLoop = false, overrideTitle?: HashReference): EventSection | null {
		if (this.sections.has(id)) {
			return isLoop ? null : this.sections.get(id)!
		}
		
		const eventData = Event.DIALOG_EVENT[id]
		if (!eventData) {
			throw new TypeError(`No event data found for ${id}`)
		}
		console.log(overrideTitle, Event.DIALOG_EVENT_DISPLAY[eventData.EventDisplayID!])
		return new EventSection(this, eventData, Event.DIALOG_EVENT_DISPLAY[eventData.EventDisplayID!], undefined, overrideTitle)
	}
	
	async loadSequences() {
		const act: Act = await getFile(this.graph_path)
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
	
	findStartingSequence(): DialogSequence {
		for (const seq of this.sequences) {
			
			const waits = seq.TaskList.find(task => task.$type == 'RPG.GameCore.WaitCustomString')
			if (waits) continue
			
			const hasDialogue = seq.TaskList.find(task => VALID_DIALOGUE_TYPES.has(task.$type))
			if (hasDialogue) return seq
			
		}
		throw new Error(`No starting sequence found for ${this.name}`)
	}
	
	output(): string {
		console.group(`Starting output for ${this.name} (${this.graph_path})`)
		const output: OutputList = []
		
		if (this.sequences.length == 0) {
			throw new TypeError('Sequences not yet loaded')
		}
		
		output.push(...this.runSequence(this.findStartingSequence()))
		
		const finalOutput = this.recurseOutput(output, 0)
		
		console.groupEnd()
		
		return finalOutput
	}
	
	runSequence(sequence: DialogSequence): OutputList {
		const output: OutputList = []
		for (const task of sequence.TaskList) {
			switch (task.$type) {
				case 'RPG.GameCore.PlayAndWaitRogueSimpleTalk':
				case 'RPG.GameCore.PlayRogueSimpleTalk':
					for (const talk of task.SimpleTalkList) {
						const sentence = this.text_map.getSentence(talk.TalkSentenceID, false, true, true)
						output.push(':' + (sentence || '{{tx}}'))
					}
					break
				case 'RPG.GameCore.PlayRogueOptionTalk':
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
							const section = this.addSection(option.DialogueEventID!, sequence.IsLoop, option.OptionTextmapID);
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
				case 'RPG.GameCore.TriggerCustomString':  // TODO: temporary any
					output.push(...this.customString((task.CustomString as any).Value, sequence.IsLoop))
					break
			}
		}
		return output
	}
	
	customString(string: string, isLoop = false): OutputList {
		console.group(`CustomString ${string} triggered`)
		if (isLoop && this.triggeredStrings.has(string)) {
			console.groupEnd()
			return []
		} // TODO: temporary any
		const sequence = this.sequences.find(seq => seq.TaskList.find(task => task.$type == 'RPG.GameCore.WaitCustomString' && (task.CustomString as any).Value == string))
		if (!sequence) {
			console.error(`CustomString "${string}" not found`)
			console.groupEnd()
			return []
		}
		
		this.triggeredStrings.add(string)
		
		const output = this.runSequence(sequence)
		
		console.groupEnd()
		
		return output
	}
}