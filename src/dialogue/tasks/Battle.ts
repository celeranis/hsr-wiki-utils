import { TriggerBattle } from '../../files/graph/Dialog.js';
import { Stage } from '../../Stage.js';
import { TranscriptionNote } from '../../util/AbstractDialogueTree.js';
import { BaseDialogueTask, BaseDialogueTaskEntry } from '../DialogueBase.js';

export class BattleTask extends BaseDialogueTask {
	declare $type: 'RPG.GameCore.TriggerBattle'
	
	event_id?: number
	
	constructor(data: TriggerBattle) {
		super(data)
		this.event_id = (!data.EventID.IsDynamic && (data.EventID.fixedValue?.Value || data.EventID.FixedValue?.Value)) || undefined
	}
	
	wikitext(level: number) {
		if (!this.event_id) {
			return `;(Enter battle)\n${':'.repeat(level + 2)}{{tx|Enemy list missing}}`
		}
		
		const stage = Stage.fromPlaneEvent(this.event_id)
		if (!stage) {
			return `;(Enter battle)\n${':'.repeat(level + 2)}{{tx|Enemy list missing}}`
		}
		
		const lists = stage.asEnemyLists()
		return `;(Enter battle)\n${lists.map(wave => ':'.repeat(lists.length == 1 ? level + 1 : level + 2) + wave).join('\n')}`
	}
	
	equals(otherTask: BaseDialogueTask | BaseDialogueTaskEntry | TranscriptionNote): boolean {
		return otherTask instanceof BattleTask && this.event_id == otherTask.event_id
	}
}