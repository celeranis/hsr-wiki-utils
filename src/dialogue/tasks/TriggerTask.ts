import { AdvSetupCustomTaskTrigger, PropSetupTrigger } from '../../files/graph/Dialog.js';
import { ActDialogueTree } from '../Dialogue.js';
import { BaseDialogueTask } from '../DialogueBase.js';
import { GraphEnvironment } from '../Environment.js';

export class PropTrigger extends BaseDialogueTask {
	declare $type: 'RPG.GameCore.PropSetupTrigger'
	// trigger_prop?: PropInstance
	// target?: NPCInstance
	
	constructor(data: PropSetupTrigger, env: GraphEnvironment) {
		super(data)
		this.independent_trigger = data.OnTriggerEnter
			?.map(task => ActDialogueTree.objectFromInternal(task, env))
			.filter(task => task != undefined)
	}
	
	wikitext(): string {
		return `;(Upon reaching the destination)`
	}
}

export class CustomTaskTrigger extends BaseDialogueTask {
	declare $type: 'RPG.GameCore.AdvSetupCustomTaskTrigger'
	
	target_data?: AdvSetupCustomTaskTrigger['TargetType']
	trigger_name?: AdvSetupCustomTaskTrigger['TriggerName']
	
	constructor(data: AdvSetupCustomTaskTrigger, env: GraphEnvironment) {
		super(data)
		this.independent_trigger = data.OnEnter
			?.map(task => ActDialogueTree.objectFromInternal(task, env))
			.filter(task => task != undefined)
		
		this.target_data = data.TargetType
		this.trigger_name = data.TriggerName
	}
	
	wikitext(): string {
		return `;(Upon reaching the destination)`
			+ (process.argv.includes('--add-triggers') ? `<!--${this.trigger_name} @ ${JSON.stringify(this.target_data)}-->` : '')
	}
}