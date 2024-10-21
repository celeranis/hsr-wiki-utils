import { PropSetupTrigger } from '../../files/Dialog.js';
import { ActDialogueTree } from '../Dialogue.js';
import { BaseDialogueTask } from '../DialogueBase.js';

export class PropTrigger extends BaseDialogueTask {
	declare $type: 'RPG.GameCore.PropSetupTrigger'
	// trigger_prop?: PropInstance
	// target?: NPCInstance
	
	constructor(data: PropSetupTrigger) {
		super(data)
		this.independent_trigger = data.OnTriggerEnter
			?.map(task => ActDialogueTree.objectFromInternal(task))
			.filter(task => task != undefined)
	}
	
	wikitext(): string {
		return `;(Upon reaching the destination)`
	}
}