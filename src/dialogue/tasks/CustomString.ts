import { TriggerCustomString, WaitCustomString } from '../../files/Dialog.js';
import { DialogueNode, TranscriptionNote } from '../../util/AbstractDialogueTree.js';
import { ActDialogueTree } from '../Dialogue.js';
import { BaseDialogueTask, BaseDialogueTaskEntry, BaseNonTextDialogueTask } from '../DialogueBase.js';

export class CustomStringTrigger extends BaseNonTextDialogueTask {
	trigger: string
	
	constructor(data: TriggerCustomString) {
		super(data)
		
		this.trigger = typeof data.CustomString == 'string' ? data.CustomString : data.CustomString.Value
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

export class FinishLevelGraph extends BaseDialogueTask {
	declare $type: 'RPG.GameCore.FinishLevelGraph';
	
	wikitext(_level: number, tree: ActDialogueTree, node: DialogueNode<this>): string | undefined {
		if (tree.type != 'occurrence' || tree.inverseFind(node, (n) => n.item instanceof FinishLevelGraph && n != node)) return undefined
		return `;(Immediately ends the occurrence)`
	}
}