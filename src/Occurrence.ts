import { ActDialogueTree, DialogueTask, DialogueTaskEntry } from './dialogue/Dialogue.js'
import { BaseDialogueTask } from './dialogue/DialogueBase.js'
import { DialogueEvent, DialogueEventTask, RogueOption, RogueRandomEvent, RogueTalkNameConfig } from './dialogue/tasks/Occurrence.js'
import { getExcelFile, getFile } from './files/GameFile.js'
import type { Act } from './files/graph/Dialog.js'
import { DynamicDisplay, InternalEventSectionDisplay, InternalNPC, InternalRogueImage, OptData, RogueNPCData, RogueNPCDialogue } from './files/Occurrence.js'
import { Dictionary } from './Shared.js'
import { HashReference, textMap } from './TextMap.js'
import { DialogueNode, TranscriptionNote } from './util/AbstractDialogueTree.js'
import { WeirdKey } from './WeirdKey.js'

export const RogueNPC = await getExcelFile<InternalNPC>('RogueNPC.json', 'RogueNPCID')
export const RogueTournNPC = await getExcelFile<InternalNPC>('RogueTournNPC.json', 'RogueNPCID')
export const RogueMagicNPC = await getExcelFile<InternalNPC>('RogueMagicNPC.json', 'RogueNPCID')
export const RogueDialogueOptionDisplay = await getExcelFile<InternalEventSectionDisplay>('RogueDialogueOptionDisplay.json', 'OptionDisplayID')
export const RogueDialogueDynamicDisplay = await getExcelFile<DynamicDisplay>('RogueDialogueDynamicDisplay.json', 'DisplayID')
export const RogueImage = await getExcelFile<InternalRogueImage>('RogueImage.json', 'ImageID')
export const RogueHandBookEvent = await getFile<any[]>('ExcelOutput/RogueHandBookEvent.json')
export const RogueTournHandBookEvent = await getFile<any[]>('ExcelOutput/RogueTournHandBookEvent.json')

export const SPECIAL_OPTION_PATHS: { [key: number]: string } = {
	1: textMap.getText(6178763687218641443n), // Preservation
	2: textMap.getText(6247479463014894143n), // Remembrance
	3: textMap.getText(9769058996315038438n), // Nihility
	4: textMap.getText(4791291087730112112n), // Abundance
	5: textMap.getText(10382082583325775186n), // The Hunt
	6: textMap.getText(4615555231162745037n), // Destruction
	7: textMap.getText(13070270830580014015n), // Elation
	8: textMap.getText(14981730811477752852n), // Propagation
	9: textMap.getText(15904619425728612032n), // Erudition

	101: textMap.getText(4222254373063957829n), // Ruan Mei
	
	201: textMap.getText(5878176038809002817n), // Day
	202: textMap.getText(12174553876493060569n), // Night
}

const OVERRIDE_PROGRESS: Record<string, number> = {
	'319601-0': 6, // The Cuckoo Clock Fanatic (III); Gold and Gears
	'314401-0': 3, // Loneliness, Cosmic Beauty Bugs, Simulated Universe (II); Gold and Gears
	'614401-2': 3, // Loneliness, Cosmic Beauty Bugs, Simulated Universe (II); Divergent Universe: Protean Hero
	'414401-2': 3, // Loneliness, Cosmic Beauty Bugs, Simulated Universe (II); Divergent Universe: The Human Comedy
}

export type SUMode = 'su' | 'pinf' | 'swarm' | 'gng' | 'du' | 'du_thc' | 'und'

export function displaySUMode(mode: SUMode, the?: boolean): string | undefined {
	switch (mode) {
		case 'su':
			return (the ? 'the ' : '') + '[[Simulated Universe]]'
		case 'swarm':
			return '[[Simulated Universe: Swarm Disaster]]'
		case 'gng':
			return '[[Simulated Universe: Gold and Gears]]'
		case 'pinf':
			return '[[Planar Infinity]]'
		case 'du':
			return (the ? 'the ' : '') + '[[Divergent Universe]]'
		case 'und':
			return '[[Simulated Universe: Unknowable Domain]]'
	}
}

export class OccurrenceSeries {
	id: number
	story_id: number
	path: string
	mode: SUMode
	
	constructor(data: InternalNPC) {
		this.id = data.RogueNPCID
		this.story_id = data.RogueNPCID % 1e5
		this.path = data.NPCJsonPath
		
		if (this.id > 6e5) {
			this.mode = 'du' // protean hero ids: 60000-69999
		} else if (this.id > 5e5) {
			this.mode = 'und' // unknowable domain ids: 50001-59999
		} else if (this.id > 4e5) {
			this.mode = 'du_thc' // the human comedy ids: 40001-49999
		} else if (this.id >= 3e5) {
			this.mode = 'gng' // gold and gears ids: 30001-39999
		} else if (this.id >= 2e5) {
			this.mode = 'pinf' // planar infinity ids: 20001-29999
		} else if (this.id >= 1e5) {
			this.mode = 'swarm' // swarm disaster ids: 10001-19999
		} else {
			this.mode = 'su' // simulated universe ids: 1-9999
		}
	}
	
	async getOccurrences(): Promise<Occurrence[]> {
		const npcData = await getFile<RogueNPCData>(this.path)
		const occurrences: Occurrence[] = []
		
		// if (npcData.DialogueType != 'Event') return occurrences
		
		for (const dialogueInfo of npcData.DialogueList) {
			if (!dialogueInfo.OptionPath) continue
			occurrences.push(await Occurrence.fromNpcDialogue(this, dialogueInfo))
		}
		
		return occurrences
	}
	
	static loadAll(): OccurrenceSeries[] {
		return [...Object.values(RogueNPC), ...Object.values(RogueTournNPC), ...Object.values(RogueMagicNPC)]
			.map(data => new this(data))
	}
	
	static async loadAllAbstract() {
		(await Promise.all(this.loadAll().map(series => series.getOccurrences()))).flat()
			.map(occurence => AbstractOccurrence.fromOccurrence(occurence))
		
		return AbstractOccurrence.abstractOccurrences
	}
}

export interface OptionData {
	id: number
	display_id: number
	choice: string
	result: string
	path?: string
	modes: string[]
}

export class Occurrence {
	options: OptionData[] = []
	mode: SUMode
	progress?: number
	
	name: string
	name_hash: HashReference
	
	image_id: number
	image_path: string
	sfx_name: string
	
	order?: number
	order_du?: number
	
	constructor(public series: OccurrenceSeries, dialogueInfo: RogueNPCDialogue, optData: OptData, private dialogueData?: Act) {
		this.mode = series.mode
		this.progress = dialogueInfo.DialogueProgress ?? 0
		
		if (OVERRIDE_PROGRESS[`${series.id}-${this.progress}`]) {
			this.progress = OVERRIDE_PROGRESS[`${series.id}-${this.progress}`]
		}
		
		const talkName = RogueTalkNameConfig[dialogueInfo.TalkNameID]
		this.name = textMap.getText(talkName?.Name) ?? ''
		this.name_hash = talkName?.Name ?? 0
		
		this.image_id = talkName?.ImageID
		const image = RogueImage[this.image_id]
		this.image_path = image?.ImagePath
		this.sfx_name = image?.ParamStr1
		
		const suIndexEvent = RogueHandBookEvent.find(hev => hev.UnlockNPCProgressIDList.find(criteria => criteria[WeirdKey.get('UnlockNPCID')] == this.series.id && (criteria[WeirdKey.get('UnlockProgress')] == this.progress || (!criteria[WeirdKey.get('UnlockProgress')] && !this.progress))))
		if (suIndexEvent) {
			this.order = suIndexEvent.Order
		}

		const duIndexEvent = RogueTournHandBookEvent.find(hev => hev.UnlockNPCProgressIDList.find(criteria => (criteria[WeirdKey.get('UnlockNPCID')] % 1e5 == this.series.id % 1e5) && (criteria[WeirdKey.get('UnlockProgress')] == this.progress || (!criteria[WeirdKey.get('UnlockProgress')] && !this.progress))))
		if (duIndexEvent) {
			this.order_du = duIndexEvent.Priority
		}
		
		for (const internalOption of optData.OptionList) {
			const displayData = RogueDialogueOptionDisplay[internalOption.DisplayID]
			
			const params = [
				internalOption.DynamicMap ? '(' + Object.values(internalOption.DynamicMap)
					.map(map => textMap.getText(RogueDialogueDynamicDisplay[map.DisplayID]?.ContentText))
					.join('/') + ')' : '{{cx|???}}',
				internalOption.DescValue,
				'{{cx|??}}', // ramping chances, such as those seen in Nildis
				'{{cx|??}}', // other dynamic value
				internalOption.DescValue2,
				internalOption.DescValue3,
				internalOption.DescValue4
			]
			
			const option: OptionData = {
				id: internalOption.OptionID,
				display_id: internalOption.DisplayID,
				choice: textMap.getText(displayData.OptionTitle, params),
				result: textMap.getText(displayData.OptionDesc, params),
				path: internalOption.SpecialOptionID ? SPECIAL_OPTION_PATHS[internalOption.SpecialOptionID] : undefined,
				modes: this.mode.startsWith('du_') ? [] : [this.mode],
			}
			this.options.push(option)
		}
	}
	
	loadDialogue() {
		if (!this.dialogueData) return undefined
		return OccurrenceDialogueTree.fromOccurrence(this.dialogueData, this)
	}
	
	static async fromNpcDialogue(series: OccurrenceSeries, dialogueInfo: RogueNPCDialogue): Promise<Occurrence> {
		if (!dialogueInfo.OptionPath) {
			console.log(series.id, dialogueInfo)
		}
		const optData = await getFile<OptData>(dialogueInfo.OptionPath.trim())
		const dialogueData = await getFile<Act>(dialogueInfo.DialoguePath.trim())
		return new this(series, dialogueInfo, optData, dialogueData)
	}
}

export class AbstractOccurrence {
	options: OptionData[] = []
	occurrences: Occurrence[] = []
	modes: SUMode[] = []
	
	get active_modes() {
		return this.modes.filter(mode => !mode.startsWith('du_'))
	}

	get active_occurrences() {
		return this.occurrences.filter(occurrence => !occurrence.mode.startsWith('du_'))
	}
	
	constructor(public id: string) {
		AbstractOccurrence.abstractOccurrences[this.id] = this
	}
	
	static abstractOccurrences: Dictionary<AbstractOccurrence> = {}
	
	addOccurrence(occurrence: Occurrence) {
		if (this.occurrences.includes(occurrence)) return this
		// if (occurrence.mode.startsWith('du_')) return this // ignore old DU versions
		
		if (!this.modes.includes(occurrence.mode) || occurrence.mode.startsWith('du_')) {
			this.modes.push(occurrence.mode)
		}
		
		for (let [i, option] of occurrence.options.entries()) {
			// console.log(this.options)
			if (option.path) {
				i = (this.options.findLastIndex(opt => opt.path) + 1) || 0
			} else {
				i = Math.max(this.options.findIndex(opt => !opt.path) || 0, i)
			}
			
			const existingOption = this.options.find(eopt => eopt.choice == option.choice && eopt.result == option.result && eopt.path == option.path)
			
			if (existingOption) {
				if (existingOption.modes.includes(occurrence.mode) || occurrence.mode.startsWith('du_')) continue
				existingOption.modes.push(occurrence.mode)
			} else {
				for (let ci = Math.max(this.options.length - 1, 0); ci > i - 1; ci--) {
					if (!this.options[ci]) continue
					this.options[ci + 1] = this.options[ci]
				}
				this.options[Math.min(i, this.options.length)] = {...option}
			}
		}
		this.occurrences.push(occurrence)
		return this
	}
	
	get active_options() {
		return this.options.filter(opt => opt.modes.find(mode => !mode.startsWith('du_')))
	}
	
	static fromOccurrence(occurrence: Occurrence) {
		const aid = occurrence.progress ? `${occurrence.series.story_id}-${occurrence.progress}` : occurrence.series.story_id.toString()
		if (this.abstractOccurrences[aid]) {
			return this.abstractOccurrences[aid].addOccurrence(occurrence)
		} else {
			return new this(aid).addOccurrence(occurrence)
		}
	}
}

export interface OccurrenceOptionTreeEntry {
	choice?: string
	chance?: string
	result?: string
	modes?: SUMode[]
	path?: string
	children: OccurrenceOptionTreeEntry[]
}

export class OccurrenceDialogueTree extends ActDialogueTree {
	option_data: Dictionary<OptionData>
	su_mode: SUMode
	
	type: 'occurrence' = 'occurrence'
	
	protected constructor(act: Act, occurrence: Occurrence) {
		super(act, `occurrence_${occurrence.name}_${occurrence.series.id}`)
		this.su_mode = occurrence.mode
		this.option_data = Object.fromEntries(occurrence.options.map(opt => [opt.id, opt]))
	}
	
	static async fromOccurrence(act: Act, occurrence: Occurrence) {
		const tree = new this(act, occurrence)
		tree.root = await tree.processAct(act)
		return tree
	}
	
	async triggerCS(customString: string, onNode: DialogueNode<DialogueTask | DialogueTaskEntry>): Promise<void> {
		const dialogueEventId = customString.match(/^triggerEvent_(\d+)$/)?.[1]
		if (dialogueEventId && DialogueEvent[dialogueEventId]) {
			if (this.inverseFind(onNode, n => n.item instanceof DialogueEventTask && n.item.id.toString() == dialogueEventId)) {
				const noteNode = {
					item: new TranscriptionNote('custom-string-loop', 'Return to previous option selection'),
					prev: onNode
				}
				onNode.next = noteNode
				return
			}
			
			const event = new DialogueEventTask(DialogueEvent[dialogueEventId])
			onNode = await this.makeNodesFromList([event], onNode)
		}
		
		await super.triggerCS(customString, onNode)
	}
	
	async wikitext(): Promise<string> {
		let wikitext = await super.wikitext()
		if (wikitext.endsWith(';(Immediately ends the occurrence)')) {
			wikitext = wikitext.substring(0, wikitext.length - 35)
		}
		return wikitext
	}
	
	getOptionTree(from: DialogueNode<BaseDialogueTask | DialogueTaskEntry> = this.root!): OccurrenceOptionTreeEntry[] {
		let currentNode: DialogueNode<BaseDialogueTask | DialogueTaskEntry> | undefined = from
		let tree: OccurrenceOptionTreeEntry[] = []
		const treeRoot = tree
		while (currentNode) {
			if (currentNode.item instanceof RogueOption && currentNode.item.option_id) {
				tree.push({
					choice: currentNode.item.option_id ? this.option_data[currentNode.item.option_id]?.choice : textMap.getSentence(currentNode.item.sentence_id!, false, false)!,
					result: currentNode.item.option_id ? this.option_data[currentNode.item.option_id]?.result : undefined,
					path: currentNode.item.option_id ? this.option_data[currentNode.item.option_id]?.path : undefined,
					modes: [this.su_mode],
					children: tree = []
				})
			} else if (currentNode.item instanceof RogueRandomEvent) {
				tree.push({
					chance: currentNode.item.chance,
					result: undefined,
					modes: [this.su_mode],
					children: tree = []
				})
			}
			if (currentNode.children?.length) {
				tree.push(...currentNode.children.map(child => this.getOptionTree(child)).flat(1))
			}
			currentNode = currentNode.next
		}
		return treeRoot
	}
	
	static mergeOptionBranch(merged: OccurrenceOptionTreeEntry[], branch: OccurrenceOptionTreeEntry[], modes?: SUMode[]) {
		for (const entry of branch) {
			let existingMerged = merged.find(mentry => mentry.choice == entry.choice && mentry.result == entry.result && mentry.chance == entry.chance && mentry.path == entry.path)
			if (existingMerged) {
				if (existingMerged.modes && !existingMerged.modes?.includes(entry.modes![0])) {
					existingMerged.modes.push(entry.modes![0])
				}
			} else {
				existingMerged = {
					...entry,
					children: []
				}
				if (entry.path) {
					merged.unshift(existingMerged)
				} else {
					merged.push(existingMerged)
				}
			}
			if (entry.children?.length) {
				this.mergeOptionBranch(existingMerged.children, entry.children, modes?.filter(mode => !entry.modes || entry.modes.includes(mode)))
			}
			if (modes && existingMerged.modes && existingMerged.modes.length == modes.length) {
				existingMerged.modes = undefined
			}
		}
		merged.sort((entry0, entry1) => {
			if (entry0.path && !entry1.path) return -1
			if (entry1.path && !entry0.path) return 1
			const index0 = branch.findIndex(mentry => mentry.choice == entry0.choice && mentry.result == entry0.result && mentry.chance == entry0.chance && mentry.path == entry0.path)
			const index1 = branch.findIndex(mentry => mentry.choice == entry1.choice && mentry.result == entry1.result && mentry.chance == entry1.chance && mentry.path == entry1.path)
			if (index0 != -1 && index1 != -1) {
				return index0 - index1
			} else {
				return 0
			}
		})
		return merged
	}
	
	static mergeOptionTrees(trees: OccurrenceOptionTreeEntry[][], modes?: SUMode[]) {
		let mergedTree: OccurrenceOptionTreeEntry[] = []
		for (const tree of trees) {
			this.mergeOptionBranch(mergedTree, tree, modes)
		}
		return mergedTree
	}
}