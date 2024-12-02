import { TalkSentenceConfig, textMap } from '../TextMap.js'
import { DialogueNode, TranscriptionNote } from '../util/AbstractDialogueTree.js'
import { ActDialogueTree } from './Dialogue.js'
import { GraphEnvironment } from './Environment.js'

export abstract class BaseDialogueTask {
	$type: string
	independent_trigger?: BaseDialogueTaskEntry[]
	trigger?: string
	trigger_act?: string
	entries?: BaseDialogueTaskEntry[]
	branches?: BaseDialogueTaskEntry[]
	conditional?: boolean
	
	constructor(data: { $type: string }) {
		this.$type = data.$type
	}

	equals(otherTask: BaseDialogueTask | BaseDialogueTaskEntry | TranscriptionNote) {
		return this == otherTask || (
			otherTask instanceof BaseDialogueTask
			&& this.$type == otherTask.$type
			&& this.trigger == otherTask.trigger
			&& this.entries?.length == otherTask.entries?.length
			&& !this.entries?.find((entry, i) => !entry.equals(otherTask.entries?.[i]!))
		)
	}

	abstract wikitext(lines: number, tree: ActDialogueTree, node: DialogueNode<this>): string | undefined | Promise<string | undefined>
}

export abstract class BaseNonTextDialogueTask extends BaseDialogueTask {
	wikitext(): string | undefined {
		return undefined
	}
}

export abstract class BaseDialogueTaskEntry {
	trigger?: string
	trigger_act?: string
	
	abstract equals(otherEntry: BaseDialogueTask | BaseDialogueTaskEntry | TranscriptionNote): boolean

	abstract wikitext(lines: number, tree: ActDialogueTree, node: DialogueNode<this>): string | undefined | Promise<string | undefined>
}

export class TalkSentenceTaskEntry extends BaseDialogueTaskEntry {
	sentence_id: number
	character?: string
	
	private _sentence_content?: string
	
	get sentence_content(): string | undefined {
		return this._sentence_content ??= textMap.getSentence(this.sentence_id)
	}
	
	constructor(entry: { TalkSentenceID: number }, env: GraphEnvironment) {
		super()
		this.sentence_id = entry.TalkSentenceID
		this.character = textMap.getText(Object.values(TalkSentenceConfig).find(s => s.TalkSentenceID == entry.TalkSentenceID)?.TextmapTalkSentenceName) || undefined
		if (this.character && this.character != '???') {
			env.characters.add(this.character)
		}
	}
	
	equals(otherEntry: BaseDialogueTask | BaseDialogueTaskEntry | TranscriptionNote) {
		return otherEntry instanceof TalkSentenceTaskEntry && (otherEntry.sentence_id == this.sentence_id || this.sentence_content == otherEntry.sentence_content)
	}
	
	wikitext(): string {
		return this.sentence_content ? (':' + this.sentence_content) : `<!--Unknown TalkSentence: ${this.sentence_id}-->`
	}
}

export class UnknownTask extends BaseDialogueTask {
	constructor(public data: any) {
		super(data)
	}
	
	wikitext(_lines: number, _tree: ActDialogueTree): string {
		return `<pre>${JSON.stringify(this.data, (k, v) => (k != 'TaskEnabled' && k != 'IsClientOnly') ? v : undefined, '\t')}</pre>`
	}
}