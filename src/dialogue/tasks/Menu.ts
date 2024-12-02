import { LazyExcelData } from '../../files/GameFile.js';
import { ObserveMaterialSubmission, ShowHalfScreenPage } from '../../files/graph/Dialog.js';
import { textMap } from '../../TextMap.js';
import { TranscriptionNote } from '../../util/AbstractDialogueTree.js';
import { ActDialogueTree } from '../Dialogue.js';
import { BaseDialogueTask, BaseDialogueTaskEntry } from '../DialogueBase.js';
import { GraphEnvironment } from '../Environment.js';

export class ShowMenuScreenTask extends BaseDialogueTask {
	name: string
	param: string
	
	constructor(data: ShowHalfScreenPage, env: GraphEnvironment) {
		super(data)
		this.name = data.Name
		this.param = data.Param
		
		this.entries = data.OnUIShow
			?.map(task => ActDialogueTree.objectFromInternal(task, env))
			?.filter(task => task != undefined)
			
		if (data.OnUIExit?.length) {
			this.entries.push(
				new TranscriptionNote('on-ui-exit', 'After exiting the menu'),
				...data.OnUIExit
					?.map(task => ActDialogueTree.objectFromInternal(task, env))
					?.filter(task => task != undefined)
			)
		}
	}
	
	wikitext(): string | undefined {
		if (process.argv.includes('--add-triggers')) {
			return `<!--Open menu ${this.name}, ${this.param}-->`
		}
	}
	
	equals(otherTask: BaseDialogueTask | BaseDialogueTaskEntry | TranscriptionNote): boolean {
		return otherTask instanceof ShowMenuScreenTask
			&& this.name == otherTask.name
			&& this.param == otherTask.param
	}
}

const BelobogShopUIConfig = new LazyExcelData('ExcelOutput/BelobogShopUIConfig.json', 'ID')

export class MaterialSubmissionEventTask extends BaseDialogueTask {
	id: number
	
	constructor(data: ObserveMaterialSubmission, env: GraphEnvironment) {
		super(data)
		this.id = data.ID
		
		this.entries = []
		
		if (data.OnCancelled?.length) {
			this.entries.push(
				new TranscriptionNote('if-cancelled', 'If the menu is closed without submitting the items'),
				...ActDialogueTree.objectListFromInternals(data.OnCancelled, env)
			)
		}

		if (data.OnInterrupted?.length) {
			this.entries.push(
				new TranscriptionNote('if-cancelled', 'If item submission is interrupted'),
				...ActDialogueTree.objectListFromInternals(data.OnInterrupted, env)
			)
		}

		if (data.OnFinished?.length) {
			this.entries.push(
				new TranscriptionNote('if-cancelled', 'After submitting the items'),
				...ActDialogueTree.objectListFromInternals(data.OnFinished, env)
			)
		}
	}
	
	async wikitext(): Promise<string | undefined> {
		const sampoData = await BelobogShopUIConfig.get() as any
		const thisEntry = sampoData[this.id]
		if (thisEntry) {
			const name = textMap.getText(thisEntry.Name)
			return `;(Open item submission menu&colon; [[Mr. Cold Feet's Pop-Up Shop/Product Plan#${name}|${name}]])`
		} else {
			return `;(Open item submission menu)`
		}
	}
}