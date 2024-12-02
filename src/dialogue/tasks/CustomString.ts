import type { TriggerCustomString, TriggerGroupEvent, WaitCustomString, WaitGroupEvent } from '../../files/graph/Dialog.js';
import type { DialogueNode, TranscriptionNote } from '../../util/AbstractDialogueTree.js';
import { ActDialogueTree } from '../Dialogue.js';
import { BaseDialogueTask, BaseDialogueTaskEntry, BaseNonTextDialogueTask } from '../DialogueBase.js';
import { GraphEnvironment } from '../Environment.js';

export class CustomStringTrigger extends BaseNonTextDialogueTask {
	trigger: string
	
	constructor(data: TriggerCustomString | TriggerGroupEvent) {
		super(data)
		
		let name
		if (data.$type == 'RPG.GameCore.TriggerGroupEvent' || data.$type == 'RPG.GameCore.TriggerGroupEventOnDialogEnd') {
			name = data.EventName
		} else if (data.$type == 'RPG.GameCore.TriggerCustomString' || data.$type == 'RPG.GameCore.TriggerCustomStringOnDialogEnd') {
			name = data.CustomString
		} else {
			throw new TypeError(`Unknown task type ${data.$type}`)
		}
		
		this.trigger = typeof name == 'string' ? name : name.Value
	}
	
	equals(otherTask: BaseDialogueTask | BaseDialogueTaskEntry | TranscriptionNote): boolean {
		return otherTask instanceof CustomStringTrigger && otherTask.trigger == this.trigger
	}
	
	wikitext(): string | undefined {
		if (process.argv.includes('--add-triggers')) {
			return `:<!--Custom String Trigger: ${this.trigger}-->`
		}
	}
}

export class CustomStringListen extends BaseNonTextDialogueTask {
	custom_string?: string
	
	constructor(data: WaitCustomString) {
		super(data)

		this.custom_string = typeof data.CustomString == 'string' ? data.CustomString : data.CustomString?.Value
	}
	
	equals(otherTask: BaseDialogueTask | BaseDialogueTaskEntry | TranscriptionNote): boolean {
		return otherTask instanceof CustomStringListen && this.custom_string == otherTask.custom_string
	}
	
	wikitext(): string | undefined {
		if (process.argv.includes('--add-triggers')) {
			return `:<!--Custom String Listener: ${this.custom_string}-->`
		}
	}
}

export class GroupEventListen extends BaseDialogueTask {
	custom_string?: string

	constructor(data: WaitGroupEvent, env: GraphEnvironment) {
		super(data)

		this.custom_string = data.EventName.Value
		
		this.entries = data.OnEvent
			?.map(task => ActDialogueTree.objectFromInternal(task, env))
			.filter(task => task != undefined)
	}

	equals(otherTask: BaseDialogueTask | BaseDialogueTaskEntry | TranscriptionNote): boolean {
		return otherTask instanceof GroupEventListen && this.custom_string == otherTask.custom_string
	}

	wikitext(): string | undefined {
		if (process.argv.includes('--add-triggers')) {
			return `:<!--Group Event Listener: ${this.custom_string}-->`
		}
	}
}

export class FinishLevelGraph extends BaseDialogueTask {
	declare $type: 'RPG.GameCore.FinishLevelGraph';
	
	wikitext(_level: number, tree: ActDialogueTree, node: DialogueNode<this>): string | undefined {
		if (tree.type != 'occurrence' || tree.inverseFind(node, (n) => n.item instanceof FinishLevelGraph && n != node)) return undefined
		return `;(Immediately ends the occurrence)`
	}
}