import { getFile } from '../files/GameFile.js';
import { Act, InternalDialogTask } from '../files/graph/Dialog.js';
import { Dictionary } from '../Shared.js';
import { AbstractDialogueTree, DialogueNode, TranscriptionNote } from '../util/AbstractDialogueTree.js';
import { BaseDialogueTask, BaseDialogueTaskEntry, TalkSentenceTaskEntry, UnknownTask } from './DialogueBase.js';
import { GraphEnvironment } from './Environment.js';
import { BattleTask } from './tasks/Battle.js';
import { CustomStringListen, CustomStringTrigger, FinishLevelGraph, GroupEventListen } from './tasks/CustomString.js';
import { MaterialSubmissionEventTask, ShowMenuScreenTask } from './tasks/Menu.js';
import { WaitTask } from './tasks/Misc.js';
import { DialogueEventListenerTask, RogueOptionTalkTask, RogueTalkTask } from './tasks/Occurrence.js';
import { EndPerformance, FinishPerformanceTask, TransitionTask, TriggerPerformance } from './tasks/Performance.js';
import { PredicateTask, SwitchTask } from './tasks/Predicate.js';
import { OptionTalkTask, SimpleTalkTask } from './tasks/SimpleDialogue.js';
import { TimelineTask } from './tasks/Timeline.js';
import { CustomTaskTrigger, PropTrigger } from './tasks/TriggerTask.js';
import { VideoTask } from './tasks/Video.js';

export abstract class ActDialogueTree extends AbstractDialogueTree<DialogueTask | DialogueTaskEntry> {
	custom_string_results: Dictionary<DialogueNode<DialogueTask | DialogueTaskEntry>> = {}
	custom_string_waiting: Dictionary<DialogueNode<DialogueTask | DialogueTaskEntry>[]> = {}
	custom_string_triggered: Dictionary<boolean> = {}
	other_triggered: [DialogueNode<DialogueTask | DialogueTaskEntry>, DialogueNode<DialogueTask | DialogueTaskEntry>][] = []
	loaded_acts: Dictionary<Act> = {}
	
	environment: GraphEnvironment = new GraphEnvironment()
	
	protected constructor(public readonly data: Act, debug_id: string) {
		super(debug_id)
	}
	
	async makeNodesFromList(items: (DialogueTask | DialogueTaskEntry | undefined)[], prev?: DialogueNode<DialogueTask | DialogueTaskEntry>, isParent?: boolean, returnFirst?: boolean): Promise<DialogueNode<DialogueTask | DialogueTaskEntry>> {
		let currentNode = prev
		let firstNode: DialogueNode<DialogueTask | DialogueTaskEntry> | undefined = undefined
		
		const hasTrigger: DialogueNode<CustomStringListen | GroupEventListen>[] = []

		for (const item of items) {
			if (!item) continue
			let prevNode = currentNode
			currentNode = {
				item,
				children: undefined,
				next: undefined,
				prev: (isParent && !firstNode) ? undefined : prevNode,
				parent: (isParent && !firstNode) ? prev : undefined,
			}
			if (prevNode && !(isParent && !firstNode)) prevNode.next = currentNode
			
			const looped = this.checkLoop(item, currentNode)
			if (looped) {
				const noteNode = {
					item: new TranscriptionNote('custom-string-loop', looped.children?.length ? 'Return to previous option selection' : (process.argv.includes('--add-triggers') ? '<!--Return to previous option selection (makeNodesFromList)-->' : undefined)),
					prev: (isParent && !firstNode) ? undefined : prevNode,
					parent: (isParent && !firstNode) ? prev : undefined,
				}
				if (prevNode && !(isParent && !firstNode)) prevNode.next = noteNode
				firstNode ??= noteNode
				break
			}

			firstNode ??= currentNode

			if (item instanceof CustomStringListen || item instanceof GroupEventListen) {
				hasTrigger.push(currentNode as DialogueNode<CustomStringListen | CustomStringListen>)
			}
			if (item instanceof BaseDialogueTask) {
				if (item.branches?.length) {
					if (item.branches.length > 1) {
						currentNode.children = []
						for (const branch of item.branches) {
							currentNode.children.push(await this.makeNodesFromList([branch], currentNode, true, true))
						}
						// this.optimize([currentNode])
					} else {
						currentNode.next = await this.makeNodesFromList(item.branches, currentNode, false, true)
						currentNode = this.getEndOf(currentNode.next)
					}
				}
				if (item.independent_trigger) {
					this.other_triggered.push([currentNode, await this.makeNodesFromList(item.independent_trigger, undefined, undefined, true)])
				}
				if (item.entries?.length) {
					currentNode.next = await this.makeNodesFromList(item.entries, currentNode, false, true)
					currentNode = this.getEndOf(currentNode.next)
				}
			}
			if (item.trigger_act) {
				const loadedAct = await this.loadAct(item.trigger_act)
					.catch(err => {
						return { item: new TranscriptionNote('act-load-failed', `{{tx|Unknown performance}}<!--${err}-->`) } as DialogueNode<TranscriptionNote>
					})
				if (loadedAct) {
					currentNode.next = loadedAct
					loadedAct.prev = currentNode
					currentNode = this.getEndOf(loadedAct)
				}
			}
			if (item.trigger) {
				await this.triggerCS(item.trigger, currentNode)
				currentNode = this.getEndOf(currentNode)
			}

			this.nodeAdded(currentNode)
		}
		
		// this.optimize([firstNode!])
		
		for (const trigger of hasTrigger) {
			if (!trigger.item.custom_string) continue
			await this.registerCS(trigger.item.custom_string, trigger)
		}

		return returnFirst ? firstNode! : currentNode!
	}
	
	checkLoop(item: DialogueTask | DialogueTaskEntry, node: DialogueNode<DialogueTask | DialogueTaskEntry>) {
		return this.inverseFind(node, n => item.equals(n.item) && n != node && this.verifySamePath(node, n))
	}
	
	async triggerCS(customString: string, onNode: DialogueNode<DialogueTask | DialogueTaskEntry>): Promise<void> {
		this.custom_string_triggered[customString] = true
		
		if (this.inverseFind(onNode, n => (n.item instanceof CustomStringListen || n.item instanceof GroupEventListen) && n.item.custom_string == customString)) {
			const noteNode = {
				item: new TranscriptionNote('custom-string-loop', 'Return to previous option selection'),
				prev: onNode
			}
			onNode.next = noteNode
			return
		}
		
		if (this.custom_string_results[customString]) {
			const node = this.cloneCheckString(this.custom_string_results[customString], onNode)
			const oldNext = onNode.next
			
			onNode.next = node
			node.prev = onNode
			
			if (oldNext && oldNext != this.custom_string_results[customString]) {
				const cloneEnd = this.getEndOf(node)
				cloneEnd.next = oldNext
				oldNext.prev = cloneEnd
			}
		} else {
			this.custom_string_waiting[customString] ??= []
			this.custom_string_waiting[customString].push(onNode)
		}
	}
	
	async registerCS(customString: string, node: DialogueNode<DialogueTask | DialogueTaskEntry>): Promise<void> {
		if (this.custom_string_results[customString]) {
			if (this.custom_string_results[customString] != node) {
				console.warn(`Listener for Custom String ${customString} registered twice!`)
			}
			return
		}
		
		this.custom_string_results[customString] = node
		
		if (this.custom_string_waiting[customString]) {
			const waiting = this.custom_string_waiting[customString]
			delete this.custom_string_waiting[customString]
			waiting.forEach(wnode => {
				const oldNext = wnode.next
				
				let cloned = this.cloneCheckString(node, wnode)
				
				// if (looped) {
				// 	const noteNode = {
				// 		item: new TranscriptionNote('custom-string-loop', looped.children ? 'Return to previous option selection' : (process.argv.includes('--add-triggers') ? '<!--Return to previous option selection (registerCS)-->' : undefined)),
				// 		prev: looped == cloned ? wnode : looped.prev,
				// 		parent: looped.parent,
				// 	}
				// 	if (looped.prev) looped.prev.next = noteNode
				// 	if (looped == cloned) {
				// 		cloned = noteNode
				// 	}
				// 	// return
				// }
				
				wnode.next = cloned
				cloned.prev = wnode
				
				if (oldNext && oldNext != node) {
					const cloneEnd = this.getEndOf(cloned)
					cloneEnd.next = oldNext
					oldNext.prev = cloneEnd
				}
			})
		}
	}
	
	async processAct(act: Act, returnLast?: boolean) {
		if (!act.OnStartSequece) return undefined
		
		const objSequences = act.OnStartSequece.map(sequence =>
			sequence.TaskList
				?.map((task, i) => ActDialogueTree.objectFromInternal(task, this.environment, sequence.TaskList[i - 1], sequence.TaskList[i + 1]))
		).filter(seq => seq && seq.find(Boolean))
		
		// load custom string results first
		for (const seq of objSequences) {
			if (!seq.find(task => task && 'custom_string' in task)) continue
			await this.makeNodesFromList(seq)
		}
		
		const sequences: DialogueNode<DialogueTask | DialogueTaskEntry>[] = []
		
		for (const sequence of objSequences) {
			if (sequence.find(task => task && 'custom_string' in task)) continue
			
			const returnedNode = await this.makeNodesFromList(sequence)
			
			sequences.push(this.getRootOf(returnedNode))
		}
		
		const returning = sequences.find(seq =>
			!this.find(seq, node => !node.prev && (node.item instanceof CustomStringListen || node.item instanceof DialogueEventListenerTask))
			&& this.find(seq, node => !(node.item instanceof UnknownTask) && !(node.item instanceof FinishLevelGraph))
		)
		return returning && returnLast ? this.getEndOf(returning) : returning
	}
	
	async loadAct(path: string, returnLast?: boolean) {
		if (this.loaded_acts[path]) {
			return this.processAct(this.loaded_acts[path], returnLast)
		}
		
		const actData = await getFile<Act>(path)
		this.loaded_acts[path] = actData
		return this.processAct(actData, returnLast)
	}
	
	async wikitext(): Promise<string> {
		const mainWikitext = await super.wikitext()
		
		const triggeredWikitext: string[] = []
		for (const [trigger, sequence] of this.other_triggered) {
			const content = await this.wikitextFrom(sequence, 0)
			if (content.trim() != '') {
				triggeredWikitext.push(
					(((await trigger.item.wikitext(0, this, trigger as any)) || '')
					+ '\n' + content).trim()
				)
			}
		}
		
		if (triggeredWikitext.length) {
			return mainWikitext + (mainWikitext.trim() ? '\n\n' : '') + triggeredWikitext.join('\n\n')
		} else {
			return mainWikitext
		}
	}
	
	async unusedWikitext(): Promise<string[]> {
		const out: string[] = []
		for (const [customString, node] of Object.entries(this.custom_string_results)) {
			if (this.custom_string_triggered[customString]) continue
			this.optimize([node])
			out.push(`;(Unused &mdash; ${customString})\n` + await this.wikitextFrom(node, 1))
		}
		return out
	}
	
	optimize(threadRoots?: DialogueNode<BaseDialogueTask | DialogueTaskEntry | TranscriptionNote>[]): this {
		if (threadRoots == undefined) {
			for (const [, thread] of this.other_triggered) {
				this.optimize([thread])
			}
		}
		return super.optimize(threadRoots)
	}
	
	onNodeOrphaned(node: DialogueNode<BaseDialogueTask | DialogueTaskEntry | TranscriptionNote>): void {
		for (const [str, waiting] of Object.entries(this.custom_string_waiting)) {
			if (waiting.includes(node)) {
				this.custom_string_waiting[str] = waiting.filter(n => n != node)
			}
		}
	}
	
	// unused no-op
	getNext(): [] {
		return []
	}
	
	toJSON(node = this.root) {
		return JSON.stringify(node, (key, value) => {
			if (key == 'parent' || key == 'prev' || key == 'clone') {
				return null
			}
			const item = typeof value == 'object' && 'item' in value && value.item
			if (item && 'wikitext' in item) {
				item.__wikitext = item.wikitext(0, this, value)
			}
			return value
		}, '\t')
	}

	clone<N extends DialogueTask | DialogueTaskEntry | TranscriptionNote>(node: DialogueNode<N>, prev?: DialogueNode<N | TranscriptionNote>, isParent?: boolean): DialogueNode<N> {
		const cloned = super.clone(node, prev, isParent)
		// const list = this.list(cloned, true)
		// for (const cloneNode of list) {
			for (const [_str, waiting] of Object.entries(this.custom_string_waiting)) {
				if (waiting.includes(cloned.clone!)) {
					waiting.push(cloned)
				}
			}
		// }
		
		return cloned
	}

	cloneCheckString<N extends DialogueTask | DialogueTaskEntry | TranscriptionNote>(node: DialogueNode<N>, checkAgainst: DialogueNode<DialogueTask | DialogueTaskEntry | TranscriptionNote>, prev?: DialogueNode<N | TranscriptionNote>, isParent?: boolean): DialogueNode<N | TranscriptionNote> {
		if ('trigger' in node.item && node.item.trigger && this.inverseFind(checkAgainst, wn => node.item.equals(wn.item))) {
			return {
				item: new TranscriptionNote('custom-string-loop', this.find(node, n => n.children?.length) ? 'Return to previous option selection' : (process.argv.includes('--add-triggers') ? '<!--Return to previous option selection (registerCS)-->' : undefined)),
				prev: isParent ? undefined : prev,
				parent: isParent ? prev : undefined,
			}
		}
		
		const newNode: DialogueNode<N> = {
			item: node.item,
			prev: isParent ? undefined : prev,
			parent: isParent ? prev : undefined,
			clone: node,
		}

		newNode.next = node.next ? this.cloneCheckString(node.next, checkAgainst, newNode, false) : undefined
		newNode.children = node.children?.map(child => this.cloneCheckString(child, checkAgainst, newNode, true))
		
		for (const [_str, waiting] of Object.entries(this.custom_string_waiting)) {
			if (waiting.includes(node)) {
				waiting.push(newNode)
			}
		}

		return newNode
	}
	
	static objectFromInternal(itask: InternalDialogTask, env: GraphEnvironment, lastTask?: InternalDialogTask, nextTask?: InternalDialogTask) {
		switch (itask.$type) {
			case 'RPG.GameCore.PlayRogueOptionTalk':
				return new RogueOptionTalkTask(itask)
			case 'RPG.GameCore.PlayRogueSimpleTalk':
			case 'RPG.GameCore.PlayAndWaitRogueSimpleTalk':
				return new RogueTalkTask(itask, env)
			case 'RPG.GameCore.WaitCustomString':
				return new CustomStringListen(itask)
			case 'RPG.GameCore.WaitGroupEvent':
				return new GroupEventListen(itask, env)
			case 'RPG.GameCore.TriggerCustomString':
			case 'RPG.GameCore.TriggerGroupEvent':
			case 'RPG.GameCore.TriggerCustomStringOnDialogEnd':
			case 'RPG.GameCore.TriggerGroupEventOnDialogEnd':
				return new CustomStringTrigger(itask)
			case 'RPG.GameCore.WaitDialogueEvent':
				return new DialogueEventListenerTask(itask)
			case 'RPG.GameCore.FinishLevelGraph':
				return new FinishLevelGraph(itask)
			case 'RPG.GameCore.PlayAndWaitSimpleTalk':
			case 'RPG.GameCore.PlaySimpleTalk':
			case 'RPG.GameCore.PlayMissionTalk':
				return new SimpleTalkTask(itask, env)
			case 'RPG.GameCore.PlayOptionTalk':
				return new OptionTalkTask(itask, env)
			case 'RPG.GameCore.PerformanceTransition':
			case 'RPG.GameCore.PlayScreenTransfer':
				return new TransitionTask(itask)
			case 'RPG.GameCore.EndPerformance':
				return new EndPerformance(itask)
			case 'RPG.GameCore.TriggerPerformance':
				return new TriggerPerformance(itask)
			case 'RPG.GameCore.FinishPerformanceMission':
				return new FinishPerformanceTask(itask)
			case 'RPG.GameCore.PlayTimeline':
				return new TimelineTask(itask, env, lastTask, nextTask)
			case 'RPG.GameCore.PlayVideo':
				return new VideoTask(itask)
			case 'RPG.GameCore.WaitSecond':
				return new WaitTask(itask)
			case 'RPG.GameCore.PropSetupTrigger':
				return new PropTrigger(itask, env)
			case 'RPG.GameCore.AdvSetupCustomTaskTrigger':
				return new CustomTaskTrigger(itask, env)
			case 'RPG.GameCore.TriggerBattle':
				return new BattleTask(itask)
			case 'RPG.GameCore.PredicateTaskList':
				if (!itask.Predicate) return undefined
				return new PredicateTask(itask, env)
			case 'RPG.GameCore.SwitchCase':
				return new SwitchTask(itask, env)
			case 'RPG.GameCore.ShowHalfScreenPage':
				return new ShowMenuScreenTask(itask, env)
			case 'RPG.GameCore.ObserveMaterialSubmission':
				return new MaterialSubmissionEventTask(itask, env)
			case 'RPG.GameCore.WaitRogueSimpleTalkFinish' as any:
			case 'RPG.GameCore.ShowRogueTalkUI' as any:
			case 'RPG.GameCore.ShowRogueTalkBg' as any:
			case 'RPG.GameCore.AdvNpcFaceToPlayer' as any:
			case 'RPG.GameCore.LevelPerformanceInitialize' as any:
			case 'RPG.GameCore.CharacterTriggerFreeStyle' as any:
			case 'RPG.GameCore.WaitSimpleTalkFinish' as any:
			case 'RPG.GameCore.ActiveTemplateVirtualCamera' as any:
			case 'RPG.GameCore.PlayerForceWalk' as any:
			case 'RPG.GameCore.SwitchCharacterAnchor' as any:
			case 'RPG.GameCore.LockPlayerControl' as any:
			case 'RPG.GameCore.SetMunicipalEnable' as any:
			case 'RPG.GameCore.UnLockPlayerControl' as any:
			case 'RPG.GameCore.DestroyProp' as any:
			case 'RPG.GameCore.CreateNPC' as any:
			case 'RPG.GameCore.CaptureNPCToCharacter' as any:
			case 'RPG.GameCore.CharacterHeadStopLookAt' as any:
			case 'RPG.GameCore.SetNpcWaypath' as any:
			case 'RPG.GameCore.SetNpcStatus' as any:
			case 'RPG.GameCore.AdvEntityFaceTo' as any:
			case 'RPG.GameCore.CharacterHeadLookAt' as any:
			case 'RPG.GameCore.SetAsRogueDialogue' as any:
			case 'RPG.GameCore.ClientFinishMission' as any:
			case 'RPG.GameCore.CollectDataConditions' as any:
			case 'RPG.GameCore.PlayFullScreenTransfer':
			case 'RPG.GameCore.SetMissionAudioState' as any:
			case 'RPG.GameCore.StartDialogueEntityInteract' as any:
				return undefined
			default:
				return new UnknownTask(itask)
		}
	}
	
	static objectListFromInternals(itask: InternalDialogTask[], env: GraphEnvironment, prev?: InternalDialogTask) {
		const out: (NonNullable<ReturnType<typeof ActDialogueTree['objectFromInternal']>>)[] = []
		for (const [i, task] of itask.entries()) {
			const dat = this.objectFromInternal(task, env, itask[i - 1] ?? prev, itask[i + 1])
			if (dat) {
				out.push(dat)
			}
		}
		
		return out
	}
	
	static async crossResolveStrings(trees: ActDialogueTree[]) {
		for (const tree of trees) {
			for (const string of Object.keys(tree.custom_string_waiting)) {
				for (const otherTree of trees) {
					if (otherTree == tree) continue
					if (otherTree.custom_string_results[string]) {
						await tree.registerCS(string, otherTree.custom_string_results[string])
						otherTree.custom_string_triggered[string] = true
						break
					}
				}
			}
		}
	}
}

export type DialogueTask = BaseDialogueTask
export type DialogueTaskEntry = TalkSentenceTaskEntry | BaseDialogueTaskEntry // temporary