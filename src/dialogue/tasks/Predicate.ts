import { InternalDialogTask, PredicateTaskList, SwitchCase, TaskParam } from '../../files/graph/Dialog.js';
import { CompareType, GraphPredicate } from '../../files/graph/Predicate.js';
import { sentenceJoin } from '../../Shared.js';
import type { DialogueNode, TranscriptionNote } from '../../util/AbstractDialogueTree.js';
import { ActDialogueTree } from '../Dialogue.js';
import { BaseDialogueTask, BaseDialogueTaskEntry, BaseNonTextDialogueTask } from '../DialogueBase.js';
import { GraphEnvironment } from '../Environment.js';

export class PredicateTask extends BaseNonTextDialogueTask {
	predicate: GraphPredicate
	
	constructor(data: PredicateTaskList, env: GraphEnvironment) {
		super(data)
		
		this.predicate = data.Predicate
		
		let successTasks, failedTasks
		if (data.SuccessTaskList) {
			successTasks = new PredicateOutcome(data.Predicate, data.SuccessTaskList, false, env)
		}
		if (data.FailedTaskList) {
			failedTasks = new PredicateOutcome(data.Predicate, data.FailedTaskList, true, env)
		}
		if (successTasks && failedTasks) {
			this.branches = [
				successTasks,
				failedTasks
			]
		} else {
			this.entries = successTasks ? [successTasks] : [failedTasks!]
		}
	}
	
	equals(otherTask: BaseDialogueTask | BaseDialogueTaskEntry | TranscriptionNote): boolean {
		return otherTask instanceof PredicateTask
			&& this.predicate.$type == otherTask.predicate.$type
			&& this.predicate.Inverse == otherTask.predicate.Inverse
	}
}

export class SwitchTask extends BaseNonTextDialogueTask {
	constructor(data: SwitchCase, env: GraphEnvironment) {
		super(data)
		
		this.branches = []
		
		for (const scase of data.TaskList) {
			const staticMode = PredicateOutcome.isStaticForEnv(scase.Predicate, false, env)
			if (staticMode == 'never') {
				env.has_definite_conditional = true
				continue
			}
			this.branches.push(new SwitchPredicateOutcome(scase.Predicate, scase.SuccessTaskList, this.branches.length == 0, env))
			if (staticMode == 'always') {
				this.conditional = true
				env.has_definite_conditional = true
				break
			}
		}
		
		if (!this.conditional && data.DefaultTask?.length) {
			this.branches.push(new SwitchDefaultOutcome(data.DefaultTask, env, this.branches.length == 0))
		}
		
		if (this.branches.length == 1) {
			this.entries = this.branches
			this.branches = undefined
		}
	}

	equals(otherTask: BaseDialogueTask | BaseDialogueTaskEntry | TranscriptionNote): boolean {
		return otherTask instanceof SwitchTask
			&& this.branches?.length == otherTask.branches?.length
			&& !this.branches?.find(b => !otherTask.branches?.find(ob => b.equals(ob)))
	}
}

export const DISPLAY_COMPARE_MAP: Record<CompareType, string> = {
	Equal: 'equal to',
	Greater: 'greater than',
	GreaterEqual: 'greater than or equal to',
	Less: 'less than',
	LessEqual: 'less than or equal to',
	NotEqual: 'not equal to'
}

export class PredicateOutcome extends BaseDialogueTask {
	constructor(public predicate: GraphPredicate, tasks: InternalDialogTask[], public inverse: boolean, env: GraphEnvironment) {
		super(predicate)
		
		this.entries = tasks
			.map(task => ActDialogueTree.objectFromInternal(task, env))
			.filter(task => task != undefined)
	}
	
	static async displayPredicate(predicate: GraphPredicate, inverse: boolean, environment: GraphEnvironment): Promise<string | undefined> {
		if (predicate.Inverse) {
			inverse = !inverse
		}

		if (PredicateOutcome.isStaticForEnv(predicate, predicate.Inverse ? !inverse : inverse, environment)) {
			return undefined
		}
		
		const not = inverse ? 'not ' : ''
		
		function genericCompare(left: string, compare: CompareType, right: TaskParam | number) {
			if (typeof right == 'object' && right.IsDynamic) {
				return `{{F|${left}}} is ${not}${DISPLAY_COMPARE_MAP[compare]} {{F|${environment.displayPostfix(right.PostfixExpr)}}}`
			} else {
				return `{{F|${left}}} is ${not}${DISPLAY_COMPARE_MAP[compare]} ${(typeof right == 'number' || typeof right == 'undefined') ? right : right.FixedValue?.Value ?? right.fixedValue?.Value}`
			}
		}
		
		function get(param: TaskParam) {
			if (param.IsDynamic) {
				return environment.evaluatePostfix(param.PostfixExpr) ?? environment.displayPostfix(param.PostfixExpr)
			} else {
				return param.FixedValue?.Value ?? param.fixedValue?.Value!
			}
		}
		
		switch (predicate.$type) {
			case 'RPG.GameCore.ByAnd':
			case 'RPG.GameCore.ByAny':
				const subchoices: string[] = []
				for (const pred of predicate.PredicateList) {
					const display = await PredicateOutcome.displayPredicate(pred, inverse, environment)
					if (display) {
						subchoices.push(display)
					}
				}
				if (subchoices.length == 0) return undefined
				return sentenceJoin(subchoices, predicate.$type == 'RPG.GameCore.ByAnd' ? 'and' : 'or')
				
			case 'RPG.GameCore.ByNot':
				return PredicateOutcome.displayPredicate(predicate.Predicate, !inverse, environment)
				
			case 'RPG.GameCore.ByCompareCustomString':
				return `{{F|${predicate.LeftValue.Value}}} is ${not}${DISPLAY_COMPARE_MAP[predicate.CompareType]} {{F|${predicate.RightValue.Value}}}`
				
			case 'RPG.GameCore.ByCompareDynamicValue':
				return genericCompare(predicate.DynamicKey, predicate.CompareType, predicate.CompareValue)
				
			case 'RPG.GameCore.ByCompareFloorCustomFloat':
				return genericCompare(predicate.Name.Value, predicate.CompareType, predicate.CompareValue)
				
			case 'RPG.GameCore.ByCompareFloorSavedValue':
				return genericCompare(predicate.Name, predicate.CompareType, predicate.CompareValue ?? 0)
				
			case 'RPG.GameCore.ByCompareGraphDynamicFloat':
				return genericCompare(predicate.Name, predicate.CompareType, predicate.Value)
				
			case 'RPG.GameCore.ByCompareGroupState':
				return genericCompare('group state', predicate.EquationType, predicate.Value)
				
			case 'RPG.GameCore.ByCompareItemNumber':
				const { Item } = await import('../../Item.js')
				await Item.loadAll()
				const item = Item.fromId(get(predicate.ItemID))
				return `the player ${inverse ? 'does not have' : 'has'} ${predicate.CompareType != 'Equal' ? DISPLAY_COMPARE_MAP[predicate.CompareType] + ' ' : ''}${item?.asItemTemplate(20, { x: get(predicate.Number) })}`
				
			case 'RPG.GameCore.ByCompareMainMissionState':
				const { Mission } = await import('../../Mission.js')
				const mission = Mission.fromId(predicate.MainMissionID)
				if (predicate.MainMissionState == 'Started') {
					return `${mission.link(true)} has ${not}been started`
				} else {
					return `${mission.link(true)} has ${not}been completed`
				}
				
			case 'RPG.GameCore.ByCompareMissionCustomValue':
				return genericCompare(`MissionCV-${predicate.MainMissionID}-${predicate.MissionCustomValue.Index}`, predicate.EquationType, predicate.TargetValue ?? 0)
				
			case 'RPG.GameCore.ByComparePerformance':
				return `{{cx}}<!--${not}during performance ${predicate.PerformanceID}-->`
				
			// case 'RPG.GameCore.ByComparePropState':
			// 	return '{{cx}}'
			
			case 'RPG.GameCore.ByCompareStoryLineID':
				return `[[Fate's Ensemble]] is active`
				
			case 'RPG.GameCore.ByCompareSubMissionState':
				return `{{cx}}<!--SubMission ${not}${predicate.SubMissionState}: ${predicate.SubMissionID}-->`
			
			default:
				return `{{cx}}{{subst:void|<!--${JSON.stringify(predicate)}-->}}`
		}
	}
	
	static isStaticForEnv(predicate: GraphPredicate, inverse: boolean, environment: GraphEnvironment): undefined | 'always' | 'never' {
		if (predicate.Inverse) {
			inverse = !inverse
		}
		
		switch (predicate.$type) {
			case 'RPG.GameCore.ByAnd':
				// for ByAnd to always or never be true:
				//	when not inversed:
				//		* all predicates are always true -> always
				//		* any predicate is never true -> never
				//	when inversed:
				//		* all predicates are always true -> never
				//		* any predicate is never true -> always
				
				var allCondition: ('never' | 'always' | undefined) = inverse ? 'never' : 'always'
				for (const subpred of predicate.PredicateList) {
					const val = this.isStaticForEnv(subpred, inverse, environment)
					if (val == 'never') return inverse ? 'always' : 'never'
					if (val != 'always') allCondition = undefined
				}
				return allCondition
				
			case 'RPG.GameCore.ByAny':
				// for ByAny to always or never be true:
				//	when not inversed:
				//		* any predicate is always true -> always
				//		* all predicates are never true -> never
				//	when inversed:
				//		* any predicate is always true -> never
				//		* all predicates are never true -> always
				
				var allCondition: ('never' | 'always' | undefined) = inverse ? 'always' : 'never'
				for (const subpred of predicate.PredicateList) {
					const val = this.isStaticForEnv(subpred, inverse, environment)
					if (val == 'always') return inverse ? 'never' : 'always'
					if (val != 'never') allCondition = undefined
				}
				return allCondition
				
			case 'RPG.GameCore.ByCompareMainMissionState':
				// for ByCompareMainMissionState to always or never be true:
				//	when not inversed:
				//		* Started -> ids are equal -> always
				//		* Finish -> ids are equal -> never
				//	when inversed:
				//		* Started -> ids are equal -> never
				//		* Finish -> ids are equal -> always
				
				if (!environment.main_mission_id) {
					return undefined
				}
				
				if (predicate.MainMissionState == 'Started') {
					return predicate.MainMissionID == environment.main_mission_id
						? (inverse ? 'never' : 'always')
						: undefined
						
				} else if (predicate.MainMissionState == 'Finish') {
					return predicate.MainMissionID == environment.main_mission_id
						? (inverse ? 'always' : 'never')
						: undefined
				}
				
				return undefined
				
			case 'RPG.GameCore.ByCompareSubMissionState':
				// for ByCompareSubMissionState to always or never be true:
				//	when not inversed:
				//		* Started -> ids are equal -> always
				//		* Started -> ids are not equal -> never
				//		* Finish -> ids are equal -> never
				//	when inversed:
				//		* Started -> ids are equal -> never
				//		* Started -> ids are not equal -> always
				//		* Finish -> ids are equal -> always

				if (!environment.sub_mission_id) {
					return undefined
				}

				if (predicate.SubMissionState == 'Started') {
					return predicate.SubMissionID == environment.sub_mission_id
						? (inverse ? 'never' : 'always')
						: (inverse ? 'always' : 'never')

				} else if (predicate.SubMissionState == 'Finish') {
					return predicate.SubMissionID == environment.sub_mission_id
						? (inverse ? 'always' : 'never')
						: undefined
				}
				return undefined
				
			case 'RPG.GameCore.ByComparePerformance':
				// for ByComparePerformance to always or never be true:
				//	when not inversed:
				//		* ids are equal -> always
				//	when inversed:
				//		* ids are equal -> never
				
				if (!environment.performance_id) {
					return undefined
				}
				
				return predicate.PerformanceID == environment.performance_id
					? (inverse ? 'never' : 'always')
					: undefined
		}
	}
	
	async wikitext(_level: number, tree: ActDialogueTree, node: DialogueNode<this>): Promise<string | undefined> {
		if (!node.next) return undefined
		
		const display = await PredicateOutcome.displayPredicate(this.predicate, this.inverse, tree.environment)
		if (display) {
			return `;(If ${display})`
		} else {
			if (process.argv.includes('--add-triggers')) {
				return `:<!--true predicate-->`
			}
		}
	}
	
	equals(otherTask: BaseDialogueTask | BaseDialogueTaskEntry | TranscriptionNote) {
		return otherTask instanceof PredicateOutcome
			&& this.predicate.$type == otherTask.predicate.$type
			&& this.inverse == otherTask.inverse
	}
}

export class SwitchPredicateOutcome extends PredicateOutcome {
	constructor(public predicate: GraphPredicate, tasks: InternalDialogTask[], public is_first: boolean, env: GraphEnvironment) {
		super(predicate, tasks, false, env)
	}

	async wikitext(_level: number, tree: ActDialogueTree, node: DialogueNode<this>): Promise<string | undefined> {
		if (!node.next) return undefined

		const display = await PredicateOutcome.displayPredicate(this.predicate, this.inverse, tree.environment)
		if (display) {
			return this.is_first ? `;(If ${display})` : `;(Otherwise, if ${display})`
		} else {
			if (this.is_first) {
				return process.argv.includes('--add-triggers') ? `<!--${JSON.stringify(this.predicate)}-->` : undefined
			} else {
				return ';(Otherwise)'
			}
		}
	}
}

export class SwitchDefaultOutcome extends BaseDialogueTask {
	constructor(tasks: InternalDialogTask[], env: GraphEnvironment, public is_first: boolean) {
		super({ $type: 'Custom.SwitchCaseDefault' })

		this.entries = tasks
			.map(task => ActDialogueTree.objectFromInternal(task, env))
			.filter(task => task != undefined)
	}
	
	wikitext(): string | undefined {
		return !this.is_first ? ';(Otherwise)' : undefined
	}
}