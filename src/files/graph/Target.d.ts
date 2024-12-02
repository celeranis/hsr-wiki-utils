import { TaskParam } from './Dialog.js'

export interface TargetFetchAdvPropNone {
	$type: 'RPG.GameCore.TargetFetchAdvPropEx'
	FetchType: undefined
}

export interface SinglePropFetchID {
	GroupID: TaskParam
	ID: TaskParam
}

export interface TargetFetchAdvancedProp {
	$type: 'RPG.GameCore.TargetFetchAdvPropEx'
	FetchType: 'SinglePropByPropID'
	SinglePropID: SinglePropFetchID
}

export interface GroupFetchLocalTarget {
	$type: 'RPG.GameCore.GroupFetchLocalTarget'
	TargetType: 'Prop'
	Targets: number[]
}

export interface TargetAlias {
	Alias: 'Caster' | 'ParamEntity' | 'AllEnemy' | 'AbilityTargetEntity' | 'AllEnemyWithUnSelectable' | 'LevelEntity' | 'ParamEntity2'
}

export type PropTaskTarget = TargetFetchAdvancedProp | TargetFetchAdvPropNone
export type BattleTaskTarget = TargetAlias 
export type AnyTaskTarget = PropTaskTarget | BattleTaskTarget