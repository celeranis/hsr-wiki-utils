import { WaitSecond } from '../../files/Dialog.js';
import { roundTo } from '../../Shared.js';
import { TranscriptionNote } from '../../util/AbstractDialogueTree.js';
import { BaseDialogueTask, BaseDialogueTaskEntry } from '../DialogueBase.js';

export class WaitTask extends BaseDialogueTask {
	declare $type: 'RPG.GameCore.WaitSecond'
	wait_time?: number
	
	constructor(data: WaitSecond) {
		super(data)
		this.wait_time = !data.WaitTime.IsDynamic ? data.WaitTime.FixedValue?.Value ?? data.WaitTime.fixedValue?.Value : undefined
	}
	
	wikitext(): string | undefined {
		return this.wait_time ? `:<!--${roundTo(this.wait_time, 2)}-second delay-->` : undefined
	}
	
	equals(otherTask: BaseDialogueTask | BaseDialogueTaskEntry | TranscriptionNote): boolean {
		return otherTask instanceof WaitTask && this.wait_time == otherTask.wait_time
	}
}