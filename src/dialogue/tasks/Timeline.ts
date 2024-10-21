import { InternalDialogTask, PlayTimeline } from '../../files/Dialog.js';
import { TalkSentenceConfig } from '../../TextMap.js';
import { TranscriptionNote } from '../../util/AbstractDialogueTree.js';
import { BaseDialogueTask, BaseDialogueTaskEntry, BaseNonTextDialogueTask, TalkSentenceTaskEntry } from '../DialogueBase.js';

export class TimelineTask extends BaseNonTextDialogueTask {
	declare $type: 'RPG.GameCore.PlayTimeline'
	path: string
	str_before?: string
	str_after?: string
	
	constructor(data: PlayTimeline, prevData?: InternalDialogTask, nextData?: InternalDialogTask) {
		super(data)
		this.path = data.TimelineName
		if (prevData?.$type == 'RPG.GameCore.WaitCustomString') {
			this.str_before = prevData.CustomString.Value
		}
		if (nextData?.$type == 'RPG.GameCore.TriggerCustomString') {
			this.str_after = nextData.CustomString.Value
		} else if (nextData?.$type == 'RPG.GameCore.PlayOptionTalk') {
			this.str_after = 'TalkSentence_' + nextData.OptionList[0]?.TalkSentenceID
		}
		const firstSentence = Number(this.str_before?.match(/^TalkSentence_(\d+)/)?.[1]) || undefined
		const lastSentence = Number(this.str_after?.match(/^TalkSentence_(\d+)/)?.[1]) || undefined
		if (firstSentence && !lastSentence) {
			let firstIndex = TalkSentenceConfig.findIndex(sent => sent.TalkSentenceID == firstSentence)
			
			if (firstIndex != -1) {
				let lastIndex = firstIndex
				let lastId = TalkSentenceConfig[firstIndex]?.TalkSentenceID
				while (TalkSentenceConfig[lastIndex + 1]?.TalkSentenceID == lastId + 1) {
					lastIndex += 1
					lastId = TalkSentenceConfig[lastIndex]?.TalkSentenceID
				}

				if (lastIndex != firstIndex) {
					this.entries = TalkSentenceConfig
						.slice(firstIndex, lastIndex + 1)
						.map(sent => new TalkSentenceTaskEntry({ TalkSentenceID: sent.TalkSentenceID }))
				} else {
					this.entries = [
						new TalkSentenceTaskEntry({ TalkSentenceID: Number(firstSentence) }),
						new TranscriptionMissing()
					]
				}
			}
			
		} else if (!firstSentence && lastSentence) {
			let lastIndex = TalkSentenceConfig.findIndex(sent => sent.TalkSentenceID == lastSentence)
			if (lastIndex != -1) {
				let firstIndex = lastIndex - 1
				let lastId = TalkSentenceConfig[firstIndex]?.TalkSentenceID
				while (TalkSentenceConfig[firstIndex - 1]?.TalkSentenceID == lastId - 1) {
					firstIndex -= 1
					lastId = TalkSentenceConfig[firstIndex]?.TalkSentenceID
				}
				
				if (firstIndex != lastIndex - 1) {
					this.entries = TalkSentenceConfig
						.slice(firstIndex, lastIndex)
						.map(sent => new TalkSentenceTaskEntry({ TalkSentenceID: sent.TalkSentenceID }))
				} else {
					this.entries = [
						new TranscriptionMissing(),
						new TalkSentenceTaskEntry({ TalkSentenceID: TalkSentenceConfig[lastIndex - 1]?.TalkSentenceID }),
					]
				}
			}
		} else if (firstSentence && lastSentence) {
			let firstIndex = TalkSentenceConfig.findIndex(sent => sent.TalkSentenceID == firstSentence)
			const lastIndex = TalkSentenceConfig.findIndex((sent, i) => sent.TalkSentenceID == lastSentence || (i > firstIndex && sent?.TextmapTalkSentenceName?.Hash == 371857150))
			
			if (TalkSentenceConfig[firstIndex]?.TextmapTalkSentenceName?.Hash == 371857150) {
				firstIndex += 1
			}
				
			if (firstIndex != -1 && lastIndex != -1 && (lastIndex - firstIndex) < 99) {
				this.entries = TalkSentenceConfig
					.slice(firstIndex, lastIndex)
					.map(sent => new TalkSentenceTaskEntry({ TalkSentenceID: sent.TalkSentenceID }))
			}
		}
		
		this.entries ??= [ new TranscriptionMissing() ]
	}
	
	equals(otherTask: BaseDialogueTask | BaseDialogueTaskEntry | TranscriptionNote): boolean {
		return otherTask instanceof TimelineTask && this.path == otherTask.path
	}
}

export class TranscriptionMissing extends BaseDialogueTaskEntry {
	wikitext(): string {
		return ':{{tx}}'
	}
	
	equals(otherEntry: BaseDialogueTask | BaseDialogueTaskEntry | TranscriptionNote): boolean {
		return otherEntry instanceof TranscriptionMissing
	}
}