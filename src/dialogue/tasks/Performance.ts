import { FinishPerformanceMission, InternalTriggerPerformance, PerformanceTransition, PlayScreenTransfer } from '../../files/Dialog.js';
import { getExcelFile } from '../../files/GameFile.js';
import { Performance } from '../../files/Mission.js';
import { textMap } from '../../TextMap.js';
import { TranscriptionNote } from '../../util/AbstractDialogueTree.js';
import { BaseDialogueTask, BaseDialogueTaskEntry } from '../DialogueBase.js';

export const performance = {
	A: await getExcelFile<Performance>('PerformanceA.json', 'PerformanceID'),
	C: await getExcelFile<Performance>('PerformanceC.json', 'PerformanceID'),
	CG: await getExcelFile<Performance>('PerformanceCG.json', 'PerformanceID'),
	D: await getExcelFile<Performance>('PerformanceD.json', 'PerformanceID'),
	DS: await getExcelFile<Performance>('PerformanceDS.json', 'PerformanceID'),
	E: await getExcelFile<Performance>('PerformanceE.json', 'PerformanceID'),
	PlayVideo: await getExcelFile<Performance>('PerformanceVideo.json', 'PerformanceID')
}

export class TriggerPerformance extends BaseDialogueTask {
	declare $type: 'RPG.GameCore.TriggerPerformance'
	performance_type: InternalTriggerPerformance['PerformanceType']
	performance_id: number
	trigger_act: string
	plane_id?: number
	floor_id?: number
	
	constructor(data: InternalTriggerPerformance) {
		super(data)
		this.performance_type = data.PerformanceType
		this.performance_id = data.PerformanceID
		
		const performanceData = performance[this.performance_type][this.performance_id]
		
		this.trigger_act = performanceData?.PerformancePath
		
		this.plane_id = performanceData?.PlaneID
		this.floor_id = performanceData?.FloorID
	}

	wikitext(): string | undefined {
		if (process.argv.includes('--add-triggers')) {
			return `:<!--Trigger Performance${this.performance_type} ${this.performance_id}: ${this.trigger_act}-->`
		}
	}
	
	equals(otherTask: BaseDialogueTask | BaseDialogueTaskEntry | TranscriptionNote): boolean {
		return otherTask instanceof TriggerPerformance
			&& this.performance_type == otherTask.performance_type
			&& this.performance_id == otherTask.performance_id
	}
}

export class EndPerformance extends BaseDialogueTask {
	declare $type: 'RPG.GameCore.EndPerformance'
	
	wikitext(): string | undefined {
		if (process.argv.includes('--add-triggers')) {
			return `:<!--Ends the current performance-->`
		}
	}
}

export class TransitionTask extends BaseDialogueTask {
	declare $type: 'RPG.GameCore.PerformanceTransition' | 'RPG.GameCore.PlayScreenTransfer'
	
	sentence_id?: number
	type?: string
	
	constructor(data: PerformanceTransition | PlayScreenTransfer) {
		super(data)
		this.sentence_id = data.$type == 'RPG.GameCore.PerformanceTransition' ? data.TalkSentenceID : undefined
		this.type = data.$type == 'RPG.GameCore.PlayScreenTransfer' ? data.Type : 'Black'
	}
	
	wikitext(level: number): string | undefined {
		if (this.type != 'Black') return undefined
		if (this.sentence_id) {
			const text = textMap.getSentence(this.sentence_id, true)
			return ':' + `{{Black Screen|${text}}}`
		} else {
			return (level > 0 ? ':' : '') + '----'
		}
	}
	
	equals(otherTask: BaseDialogueTask | BaseDialogueTaskEntry | TranscriptionNote): boolean {
		return otherTask instanceof TransitionTask
			&& (
				(this.sentence_id == otherTask.sentence_id)
				|| (
					(this.sentence_id && textMap.getSentence(this.sentence_id, true))
					== (otherTask.sentence_id && textMap.getSentence(otherTask.sentence_id, true))
				)
			)
	}
}

export class FinishPerformanceTask extends BaseDialogueTask {
	declare $type: 'RPG.GameCore.FinishPerformanceMission'
	key: string
	
	constructor(data: FinishPerformanceMission) {
		super(data)
		this.key = data.Key
	}
	
	equals(otherTask: BaseDialogueTask | BaseDialogueTaskEntry | TranscriptionNote): boolean {
		return otherTask instanceof FinishPerformanceTask && this.key == otherTask.key
	}

	wikitext(): string | undefined {
		if (process.argv.includes('--add-triggers')) {
			return `:<!--FinishPerformanceMission: ${this.key}-->`
		}
	}
}