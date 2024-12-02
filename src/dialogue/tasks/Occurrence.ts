import { BlessingGroup } from '../../Blessing.js'
import { CurioGroup } from '../../Curio.js'
import { DynamicContent } from '../../DynamicContent.js'
import { getExcelFile } from '../../files/GameFile.js'
import { DialogEventMap, PlayOptionTalkSimple, RoguePlayAndWaitSimpleTalk, RoguePlayOptionTalk, TalkOption, TalkOptionSimple, WaitDialogueEvent } from '../../files/graph/Dialog.js'
import { InternalEventSection, InternalTalkName } from '../../files/Occurrence.js'
import { Item } from '../../Item.js'
import type { OccurrenceDialogueTree } from '../../Occurrence.js'
import { DICON_MAP } from '../../Shared.js'
import { Stage } from '../../Stage.js'
import { textMap } from '../../TextMap.js'
import { TranscriptionNote } from '../../util/AbstractDialogueTree.js'
import { DialogueTaskEntry } from '../Dialogue.js'
import { BaseDialogueTask, BaseDialogueTaskEntry, BaseNonTextDialogueTask, TalkSentenceTaskEntry } from '../DialogueBase.js'
import { GraphEnvironment } from '../Environment.js'
import { CustomStringListen } from './CustomString.js'

export const RogueTalkNameConfig = await getExcelFile<InternalTalkName>('RogueTalkNameConfig.json', 'TalkNameID')
export const DialogueEvent = await getExcelFile<InternalEventSection>('DialogueEvent.json', 'EventID', '1.6')

export class RogueOptionTalkTask extends BaseDialogueTask {
	declare $type: 'RPG.GameCore.PlayRogueOptionTalk'
	branches: RogueOption[]
	
	constructor(data: RoguePlayOptionTalk | PlayOptionTalkSimple) {
		super(data)
		this.branches = data.OptionList.map(option => new RogueOption(option))
	}
	
	equals(otherTask: BaseDialogueTask | BaseDialogueTaskEntry | TranscriptionNote): boolean {
		return otherTask instanceof RogueOptionTalkTask 
			&& this.branches.length == otherTask.branches.length
			&& !this.branches.find((opt1, i) => !opt1.equals(otherTask.branches[i]))
	}
	
	wikitext(): undefined {
		return undefined
	}
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

export class RogueOption extends BaseDialogueTask {
	option_id?: number
	sentence_id?: number
	option_text: string
	icon_type?: string
	condition_ids?: number[]
	
	constructor(data: TalkOption | TalkOptionSimple) {
		super({ $type: 'Custom.OccurrenceOption' })
		this.option_id = data.RogueOptionID
		this.option_text = textMap.getText(data.OptionTextmapID)
		this.icon_type = data.OptionIconType
		this.trigger = data.TriggerCustomString
		this.sentence_id = data.TalkSentenceID
		
		if (this.option_id && this.trigger != `triggerEvent_${this.option_id}`) {
			const ev = DialogueEventTask.fromId(this.option_id)
			if (ev) {
				this.entries = [ev]
				this.condition_ids = ev.condition_ids
			}
		}
	}
	
	equals(otherEntry: BaseDialogueTask | BaseDialogueTaskEntry | TranscriptionNote): boolean {
		return otherEntry instanceof RogueOption
			&& this.option_id == otherEntry.option_id
			&& this.sentence_id == otherEntry.sentence_id
			&& this.option_text == otherEntry.option_text
			&& this.trigger == otherEntry.trigger
	}
	
	wikitext(level: number, tree: OccurrenceDialogueTree): string {
		if (this.option_id) {
			const optionData = tree.option_data?.[this.option_id]
			if (optionData?.path) {
				const specialDialogue = `{{SU Special Dialogue|${optionData.path}|${optionData.choice}|${optionData.result}}}`
				let condition: string | undefined = undefined
				if (optionData.path == 'Ruan Mei') {
					condition = tree.su_mode == 'du' ? 'If the player has [[Ruan Mei]]' : `If [[Ruan Mei]] is in the active party`
				} else if (tree.su_mode == 'swarm') {
					condition = `If embarking on the Path of [[Simulated Universe: Swarm Disaster/Paths#${optionData.path}|${optionData.path}]] in [[Simulated Universe: Swarm Disaster]]`
				} else if (tree.su_mode == 'gng' && optionData.path == 'Erudition' && this.condition_ids) {
					condition = `If Intra-Cognition is between ${this.condition_ids.map(id => GNG_CONDITION_MAP[id]).filter(v => v != null).sort().join(' and ')} in [[Simulated Universe: Gold and Gears]]`
				}
				if (condition) {
					return `;(${condition})\n${':'.repeat(level)}${specialDialogue}`
				} else {
					return ':' + specialDialogue
				}
			} else {
				return `:{{DIcon|Star}} ${optionData?.choice} &mdash; ${optionData?.result}`
			}
		} else if (this.sentence_id) {
			return `:{{DIcon|${DICON_MAP[this.icon_type ?? 'ChatContinueIcon']}}} ${textMap.getSentence(this.sentence_id, false, false)}`
		} else {
			throw new TypeError(`Has neither option_id and sentence_id`)
		}
	}
}

export class RogueTalkTask extends BaseDialogueTask {
	declare $type: 'RPG.GameCore.PlayAndWaitRogueSimpleTalk'
	entries?: TalkSentenceTaskEntry[]
	
	constructor(data: RoguePlayAndWaitSimpleTalk, env: GraphEnvironment) {
		super(data)
		this.entries = data.SimpleTalkList.map(sent => new TalkSentenceTaskEntry(sent, env))
	}
	
	wikitext(): undefined {
		return undefined
	}
}

export class DialogueEventListenerTask extends BaseNonTextDialogueTask {
	declare $type: 'RPG.GameCore.WaitDialogueEvent'
	// entries: DialogueEventListener[]
	declare branches: DialogueEventListener[]
	
	constructor(data: WaitDialogueEvent) {
		super(data)
		this.branches = data.DialogueEventList.map(map => new DialogueEventListener(map))
	}
	
	equals(otherTask: BaseDialogueTask | BaseDialogueTaskEntry | TranscriptionNote): boolean {
		return otherTask instanceof DialogueEventListenerTask 
			&& this.branches.length == otherTask.branches.length
			&& !this.branches.find((ev, i) => ev.custom_string != otherTask.branches[i].custom_string || ev.trigger != otherTask.branches[i].trigger)
	}
}

export class DialogueEventListener extends CustomStringListen {
	trigger?: string
	
	constructor(data: DialogEventMap) {
		const defaultCS = `triggerEvent_${data.DialogueEventID}`
		
		super({
			CustomString: { Value: data.SuccessCustomString != defaultCS ? defaultCS : '' },
			$type: "RPG.GameCore.WaitCustomString"
		})
		
		this.trigger = data.SuccessCustomString != defaultCS ? data.SuccessCustomString : ''
	}
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

const SIMPLE_EFFECTS: { [effectType: string]: (is_du: boolean, ...args: number[]) => (string) } = {
	GetItem: (is_du, itemId, count) => `Obtain ${Item.fromId(itemId)?.asItemTemplate(20, { x: count }) || `[Unknown Item] &times;${count}`}`,
	GetRogueBuff: (is_du, blessingGroup) => `Obtain a random ${BlessingGroup.nameForId(blessingGroup, is_du, false)}`,
	GetChessRogueCheatDice: (is_du, count) => `Obtain ${count} cheat chance(s)`,
	GetRogueMiracle: (is_du, curioGroup, count) => `Obtain ${count || 1} random ${CurioGroup.nameForId(curioGroup, count > 1)}`,
	FinishChessRogue: (is_du) => 'Immediately ends the current run.',
	RecoverLineup: (is_du, hp, energy, tp) => `Immediately recovers ${hp}% Max HP, ${energy}% Energy, and ${tp} Technique Points`,
	ChangeLineupData: (is_du, hp, energy, tp) => `Immediately recovers ${hp}% Max HP, ${energy}% Energy, and ${tp} Technique Points`,
	TriggerRogueBuffSelect: (is_du, blessingGroup, optionCount, _unknown) => `Obtain a ${BlessingGroup.nameForId(blessingGroup, is_du, false)}`,
	TriggerRogueMiracleSelect: (is_du, curioGroup, optionCount) => `Obtain a ${CurioGroup.nameForId(curioGroup, false)}`,
	UpRogueBuffLevel: (is_du, blessingGroup, count) => `Enhance ${count} random ${BlessingGroup.nameForId(blessingGroup, is_du, count != 1)}`,
	TriggerRogueBuffEnhance: (is_du, blessingGroup, _unknown, count) => `Enhance ${count} random ${BlessingGroup.nameForId(blessingGroup, is_du, count != 1)}`,
	EnhanceRogueBuff: (is_du, blessingGroup, count) => `Enhance ${count} random ${BlessingGroup.nameForId(blessingGroup, is_du, count != 1)}`,
	TriggerRogueBuffReforge: (is_du, discardGroup, discardOptionCount, _unknown2, replacementGroup, replacementOptionCount, _unknown) =>
		`Discard a ${BlessingGroup.nameForId(discardGroup, false)} in exchange for a ${BlessingGroup.nameForId(replacementGroup, is_du, false)}`,
	GetAllRogueBuffInGroup: (is_du, blessingGroup) => `Obtain all ${BlessingGroup.nameForId(blessingGroup, is_du, true)}`,
	GetAllRogueBuffInGroupAndGetItem: (is_du, blessingGroup, itemId, amount, _unknown) =>
		`Obtain all ${BlessingGroup.nameForId(blessingGroup, is_du, true)} and ${Item.fromId(itemId)?.asItemTemplate(20, { x: amount }) || `[Unknown Item] &times;${amount}`}`,
	ReplaceRogueBuff: (is_du, discardGroup, discardCount, replacementGroup, replacementCount) =>
		`Discard ${discardCount || 1} random ${BlessingGroup.nameForId(discardGroup, is_du, discardCount != 1)} in exchange for ${replacementCount || 1} ${BlessingGroup.nameForId(replacementGroup, is_du, replacementCount != 1)}`,
	ChangeRogueMiracleToRogueCoin: (is_du, discardGroup, fragments, _unknown) => `Exchange all ${CurioGroup.nameForId(discardGroup)} for ${fragments} Cosmic Fragments each`,
	RemoveRogueMiracle: (is_du, curioGroup, count) => `Discard ${count ? `${count} random` : 'all'} ${CurioGroup.nameForId(curioGroup, count != 1)}`,
	GetItemByPercent: (is_du, itemId, percent) => `Obtain ${percent}% of currently possessed ${Item.fromId(itemId)?.asItemTemplate(20) || `[Unknown Item]`}`,
	RemoveRogueBuff: (is_du, blessingGroup, count) => `Discard ${count || 'all'} ${BlessingGroup.nameForId(blessingGroup, is_du, count != 1)}`,
	RepairRogueMiracleByGroup: (is_du, curioGroup, count) => `Repair ${count || 'all'} ${CurioGroup.nameForId(curioGroup, count != 1)}`,
	RepairRogueMiracle: (is_du, curioGroup, count) => `Repair ${count || 'all'} ${CurioGroup.nameForId(curioGroup, count != 1)}`,
	TriggerRogueMiracleRepair: (is_du, curioGroup, _unknown, count) => `Select ${count || '?'} ${CurioGroup.nameForId(curioGroup, count != 1)} to repair`,
	TriggerRogueBuffDrop: (is_du, blessingGroup, optionCount) => `Discard a ${BlessingGroup.nameForId(blessingGroup, is_du, false)}`,
	ChangeRogueMiracleToRogueMiracle: (is_du, discardGroup, replaceGroup, count) =>
		`Discard ${count || 'all'} ${CurioGroup.nameForId(discardGroup, count != 1)} in exchange for the same number of random ${CurioGroup.nameForId(replaceGroup, true)}`,
	ChangeRogueMiracleToRogueBuff: (is_du, discardGroup, replaceGroup, count) =>
		`Discard ${count || 'all'} ${CurioGroup.nameForId(discardGroup, count != 1)} in exchange for the same number of random ${BlessingGroup.nameForId(replaceGroup, is_du, true)}`,
	DestroyRogueMiracle: (is_du, destroyGroup, count) => `Destroy ${count || 'all'} ${CurioGroup.nameForId(destroyGroup)}`,
	GetChessRogueRerollDice: (is_du, count) => `Obtain ${count} reroll chance(s)`,
	ChangeNousValue: (is_du, amount) => `${amount > 0 ? 'Increase' : 'Decrease'} Cognition Value by ${Math.abs(amount)}`,
	ReviveAvatar: (is_du, charCount, hpAmount, energyAmount) =>
		`Immediately revive ${charCount > 20 || charCount < 1 ? 'all' : charCount} characters and restore them to ${hpAmount}% Max HP`,
	GetRogueBuffByMiracleCount: (is_du, blessingGroup) => `Obtain a random ${BlessingGroup.nameForId(blessingGroup, is_du, false)} for every Curio currently in possession`,
	ChangeRogueNpcWeight: (is_du, npc_id, weight, _unknown) => `${describeWeight(weight)}<!--weight=${weight}--> the chance of encountering [[${textMap.getText(RogueTalkNameConfig[npc_id]?.Name)}]]`,
	GetCoinByLoseCoin: (is_du, loseAmnt, _unknown, gainAmnt, _unknown2) => `Lose ${loseAmnt}% of Cosmic Fragments, but immediately regain ${gainAmnt}% of the amount lost{{Verify}}`,
	TriggerDestroyedRogueMiracleSelect: (is_du, curioGroup, _unknown, count) => `Select ${count} destroyed ${CurioGroup.nameForId(curioGroup, count != 1)}`,
	GetDestroyedRogueMiracle: (is_du, curioGroup, count) => `Obtain ${count} random destroyed ${CurioGroup.nameForId(curioGroup, count != 1)}`,
	ReplaceRogueBuffKeepLevel: (is_du, discardGroup, replaceGroup) => `Replace all ${BlessingGroup.nameForId(discardGroup, is_du)} with ${BlessingGroup.nameForId(replaceGroup, is_du)}, retaining the original Enhancement status`,
	DestroyRogueMiracleThenGetRogueMiracle: (is_du, destroyGroup, replaceGroup) => `Destroy all ${CurioGroup.nameForId(destroyGroup)} and obtain 2 ${CurioGroup.nameForId(replaceGroup)} for every Curio destroyed`,
	ChangeChessRogueActionPoint: (is_du, points) => `Obtain ${points} point${points == 1 ? '' : 's'} in the countdown`,
	ChangeDestroyedRogueMiracleToRogueMiracle: (_unknown, replaceGroup, _unknown2, _unknown3) => `Replace all destroyed Curios with ${CurioGroup.nameForId(replaceGroup)}`,
	TriggerRogueMiracleTrade: (is_du, curioGroup) => `Discard a ${CurioGroup.nameForId(curioGroup, false)}`,
	TriggerBattle: () => `Enter battle`
}

const SIMPLE_COSTS: { [costType: string]: (...args: number[]) => (string) } = {
	CostItemValue: (itemId, count) => `Lose ${Item.fromId(itemId)?.asItemTemplate(20, { x: count }) || `[Unknown Item] &times;${count}`}`,
	CostHpCurrentPercent: (percent) => `All allies lose ${percent}% of their current HP`,
	CostHpMaxPercent: (percent) => `All allies lose ${percent}% of their Max HP`,
	CostItemPercent: (itemId, percent) => `Lose ${percent}% of currently possessed ${Item.fromId(itemId)?.asItemTemplate(20) || `[Unknown Item]`}`,
	CostHpSpToPercent: (hp, energy) => `Set allies' HP to ${hp}% of Max HP and Energy to ${energy}% of Max Energy`
}

export class DialogueEventTask extends BaseDialogueTask {
	declare $type: `Custom.DialogueEvent.${InternalEventSection['RogueEffectType']}`
	id: number

	effect_type?: InternalEventSection['RogueEffectType']
	effect_params: number[]

	cost_type?: InternalEventSection['CostType']
	cost_params: number[]

	dynamic_content?: DynamicContent

	condition_ids: number[]

	declare entries?: (DialogueEventTask | DialogueTaskEntry)[];
	declare branches?: RogueRandomEvent[];

	constructor(data: InternalEventSection) {
		super({ $type: 'Custom.DialogueEvent.' + data.RogueEffectType })
		this.id = data.EventID

		this.effect_type = data.RogueEffectType
		this.effect_params = data.RogueEffectParamList

		this.cost_type = data.CostType
		this.cost_params = data.CostParamList

		this.condition_ids = data.ConditionIDList ?? []

		if (data.DynamicContentID) {
			this.dynamic_content = new DynamicContent(data.DynamicContentID)
		}

		switch (this.effect_type) {
			case 'TriggerRandomEventList':
				this.processTriggerRandomEventList()
				break
			case 'RepeatableGamble':
				this.processRepeatableGamble()
				break
			case 'TriggerRogueMiracleTrade':
				this.processTriggerRogueMiracleTrade()
				break
			case 'TriggerDialogueEventList':
				this.processTriggerDialogueEventList()
				break
		}
	}

	static fromId(id: string | number) {
		return DialogueEvent[id] ? new this(DialogueEvent[id]) : undefined
	}

	processTriggerRandomEventList() {
		this.branches = []
		const totalChance = this.effect_params.reduce((total, val, i) => i % 2 == 1 ? total + val : total, 0)
		for (let i = 0; i < this.effect_params.length; i += 2) {
			const chancePercent = Math.round((this.effect_params[i + 1] / totalChance) * 100)
			this.branches.push(new RogueRandomEvent(chancePercent + '%', this.effect_params[i], (i / 2) + 1))
		}
	}

	processRepeatableGamble() {
		const [mainEventId, startingPercent, incrementPercent, ...alternateEvents] = this.effect_params

		let mainPercentages: string[] = []
		let altPercentages: number[] = []

		if (incrementPercent > 0) {
			for (let percent = startingPercent; percent < 100;) {
				percent = Math.min(percent + incrementPercent, 100)
				mainPercentages.push(Math.round(percent) + '%')
				altPercentages.push(100 - percent)
			}
		} else {
			mainPercentages = [Math.round(startingPercent) + '%']
			altPercentages = [100 - startingPercent]
		}

		this.branches = [new RogueRandomEvent(mainPercentages.join('/'), mainEventId, 1)]

		const totalChance = alternateEvents.reduce((total, val, i) => i % 2 == 1 ? total + val : total, 0)
		for (let i = 0; i < alternateEvents.length; i += 2) {
			const chanceFactor = alternateEvents[i + 1] / totalChance
			const chances = altPercentages.map(percent => Math.round(percent * chanceFactor) + '%')

			this.branches.push(new RogueRandomEvent(chances.join('/'), alternateEvents[i], (i / 2) + 2))
		}
	}

	processTriggerRogueMiracleTrade() {
		this.trigger = `triggerEvent_${this.effect_params[3]}`
	}

	processTriggerDialogueEventList() {
		if (this.effect_params.length == 0) return

		let repeatedLast = 0
		let lastId = 0
		this.entries = []
		for (const eventId of this.effect_params) {
			if (lastId != 0 && lastId != eventId) {
				this.entries.push(new RogueRepeatedEvent(repeatedLast, lastId))
				repeatedLast = 0
			}
			repeatedLast += 1
			lastId = eventId
		}
		this.entries.push(new RogueRepeatedEvent(repeatedLast, lastId))
	}

	wikitext(level: number, tree: OccurrenceDialogueTree): string | undefined {
		const out: string[] = []

		if (process.argv.includes('--add-triggers')) {
			out.push(`:<!--Dialogue Event: ${this.id}-->`)
		}

		if (this.cost_type && SIMPLE_COSTS[this.cost_type]) {
			out.push(`;(${SIMPLE_COSTS[this.cost_type](...this.cost_params)})`)
		} else if (this.cost_type) console.warn(this.cost_type)

		if (this.effect_type && SIMPLE_EFFECTS[this.effect_type]) {
			out.push(`;(${SIMPLE_EFFECTS[this.effect_type](tree.su_mode == 'du', ...this.effect_params)})`)
		}

		if (this.effect_type == 'TriggerBattle') {
			const enemies = (this.dynamic_content || new Stage(this.effect_params[0])).asEnemyLists()
			// out.push(';(Enter battle)')
			out.push(...enemies.map(line => ':' + line))
		}

		return out.length > 0 ? out.map((line, i) => i > 0 ? ':'.repeat(level) + line : line).join('\n') : undefined
	}

	equals(otherTask: BaseDialogueTask | BaseDialogueTaskEntry | TranscriptionNote): boolean {
		return otherTask instanceof DialogueEventTask && (
			this.id == otherTask.id
			// || (
			// 	this.effect_type == otherTask.effect_type
			// 	&& this.effect_params.toString() == otherTask.effect_params.toString()
			// 	&& this.cost_type == otherTask.cost_type
			// 	&& this.cost_params.toString() == otherTask.cost_params.toString()
			// 	&& this.condition_ids.toString() == otherTask.condition_ids.toString()
			// 	&& this.dynamic_content?.id == otherTask.dynamic_content?.id
			// )
		)
	}
}

export class RogueRandomEvent extends BaseDialogueTaskEntry {
	constructor(public chance: string, public result_id: number, public number: number) {
		super()
		this.trigger = `triggerEvent_${result_id}`
	}

	equals(otherEntry: BaseDialogueTask | BaseDialogueTaskEntry | TranscriptionNote): boolean {
		return otherEntry instanceof RogueRandomEvent
			&& this.trigger == otherEntry.trigger
			&& this.chance == otherEntry.chance
			&& this.number == otherEntry.number
	}

	wikitext(): string {
		return `;(Outcome ${this.number}, ${this.chance} chance)`
	}
}

export class RogueRepeatedEvent extends BaseDialogueTaskEntry {
	constructor(public count: number, public result_id: number) {
		super()
		this.trigger = `triggerEvent_${result_id}`
	}

	equals(otherEntry: BaseDialogueTask | BaseDialogueTaskEntry | TranscriptionNote): boolean {
		return otherEntry instanceof RogueRepeatedEvent
			&& this.trigger == otherEntry.trigger
			&& this.count == otherEntry.count
	}

	wikitext(): string | undefined {
		if (this.count > 1) {
			return `;(Repeat ${this.count} times)`
		} else {
			return undefined
		}
	}
}