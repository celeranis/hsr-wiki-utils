import type { CombatPath, Value } from '../../Shared.ts'
import { HashReference } from '../../TextMap.ts'
import { MissionCustomValue, TaskParam, ValueReference } from './Dialog.js'
import { BattleTaskTarget, PropTaskTarget } from './Target.js'

export type CompareType = 'Equal' | 'LessEqual' | 'GreaterEqual' | 'Greater' | 'Less' | 'NotEqual'
export type BattleTeam = 'TeamDark' | 'TeamLight'
export type AttackType = 'DOT'
export type MissionState = 'Started' | 'Finish'

export interface BasePredicate<T extends string> {
	$type: `RPG.GameCore.${T}`
	Inverse?: boolean
}

export interface BaseBattlePredicate<T extends string> extends BasePredicate<T> {
	TargetType: BattleTaskTarget
}

export interface BaseComparePredicate<T extends string, V> extends BasePredicate<T> {
	CompareType: CompareType
	CompareValue: TaskParam
}

export interface BaseBattleComparePredicate<T extends string, V> extends BaseBattlePredicate<T>, BaseComparePredicate<T, V> {}

export interface BasePropPredicate<T extends string> extends BasePredicate<T> {
	TargetType: PropTaskTarget
}

export interface ByCompareCustomString extends BasePredicate<'ByCompareCustomString'> {
	LeftValue: ValueReference<string>
	RightValue: ValueReference<string>
	CompareType: CompareType
}

export interface ByCompareDynamicValue<T = unknown> extends BaseComparePredicate<'ByCompareDynamicValue', T> {
	DynamicKey: string
	CompareValue: TaskParam
}

export interface ByCompareMainMissionState extends BasePredicate<'ByCompareMainMissionState'> {
	MainMissionID: number
	MainMissionState?: MissionState
}

export interface ByCompareSubMissionState extends BasePredicate<'ByCompareSubMissionState'> {
	SubMissionID: number
	SubMissionState: MissionState
}

export interface ByAnd extends BasePredicate<'ByAnd'> {
	PredicateList: GraphPredicate[]
}

export interface ByAny extends BasePredicate<'ByAny'> {
	PredicateList: GraphPredicate[]
}

export interface ByNot extends BasePredicate<'ByNot'> {
	Predicate: GraphPredicate
}

export interface ByContainBehaviorFlag extends BaseBattlePredicate<'ByContainBehaviorFlag'> {
	Flag: string
}

export interface ByRankActivated extends BasePredicate<'ByRankActivated'> {
	TriggerKey: HashReference
}

export interface BySkillPointActivated extends BasePredicate<'BySkillPointActivated'> {
	PointTriggerKey: HashReference
}

export interface ByIsContainModifier extends BaseBattlePredicate<'ByIsContainModifier'> {
	ModifierName: string
}

export interface ByHaveEnemyAlive extends BaseBattlePredicate<'ByHaveEnemyAlive'> {
	IncludeUnselectable?: boolean
}

export interface ByAvatarBaseType extends BaseBattlePredicate<'ByAvatarBaseType'> {
	BaseTypeList: CombatPath[]
}

export interface ByCheckModifierCallBackStatusType extends BasePredicate<'ByCheckModifierCallBackStatusType'> {
	TargetStatusType: 'Debuff' | 'Buff'
}

export interface ByTargetTeam extends BaseBattlePredicate<'ByTargetTeam'> {
	Team: BattleTeam
}

export interface ByContainsParamFlag extends BasePredicate<'ByContainsParamFlag'> {
	Flag: string
}

export interface ByCompareTarget extends BaseBattlePredicate<'ByCompareTarget'> {
	CompareType: BattleTaskTarget
}

export interface ByCheckModifierCallBackName extends BasePredicate<'ByCheckModifierCallBackName'> {
	ModifierName: string
}

export interface ByRandomChance extends BasePredicate<'ByRandomChance'> {
	Chance: TaskParam
}

export interface ByAttackType extends BaseBattlePredicate<'ByAttackType'> {
	AttackTypes: AttackType[]
}

export interface ByAnimatorParam_Base extends BasePredicate<'ByAnimatorParam'> {
	ParamName: string
	ParamCompareType: CompareType
}

export interface ByAnimatorParam_Int extends ByAnimatorParam_Base {
	ParamType: 'Int'
	IntegerValue: number
}

export interface ByAnimatorParam_Float extends ByAnimatorParam_Base {
	ParamType: undefined
	FloatValue: number
}

export interface ByAnimatorParam_Bool extends ByAnimatorParam_Base {
	ParamType: 'Bool'
	BooleanValue: boolean
}

export type ByAnimatorParam = ByAnimatorParam_Int | ByAnimatorParam_Float | ByAnimatorParam_Bool

export interface ByComparePropState extends BasePropPredicate<'ByComparePropState'> {
	State?: string
}

export interface ByCompareGroupState extends BasePredicate<'ByCompareGroupState'> {
	EquationType: CompareType
	Value: number
}

export interface ByCompareFloorSavedValue extends BasePredicate<'ByCompareFloorSavedValue'> {
	Name: string
	CompareType: CompareType
	CompareValue?: number
}

export interface ByCompareGraphDynamicFloat extends BasePredicate<'ByCompareGraphDynamicFloat'> {
	Name: string
	Value: TaskParam
	CompareType: CompareType
}

export interface ByCompareFloorCustomFloat extends BasePredicate<'ByCompareFloorCustomFloat'> {
	Name: Value<string>
	CompareType: CompareType
	CompareValue: TaskParam
}

export interface ByComparePerformance extends BasePredicate<'ByComparePerformance'> {
	PerformanceID: number
}

export interface ByIfGroupIsOccupied extends BasePredicate<'ByIfGroupIsOccupied'> {
	GroupID: number
}

export interface ByCompareMissionCustomValue extends BasePredicate<'ByCompareMissionCustomValue'> {
	MainMissionID: number
	MissionCustomValue: MissionCustomValue
	EquationType: CompareType
	TargetValue: number
}

export interface ByCompareItemNumber extends BasePredicate<'ByCompareItemNumber'> {
	ItemID: TaskParam
	Number: TaskParam
	CompareType: CompareType
}

export interface ByCompareTeamLeaderBodySize extends BasePredicate<'ByCompareTeamLeaderBodySize'> {
	BodySize: 'Kid' | 'Girl' | 'Boy' | 'Lady' | 'Lad' | 'Maid' | 'Male' | 'Miss'
}

export interface ByCompareMusicRhythmSongID extends BasePredicate<'ByCompareMusicRhythmSongID'> {
	SongID: number
}

export interface ByCompareVersionFinalMainMission extends BasePredicate<'ByCompareVersionFinalMainMission'> {
	MainMissionID: number
}

export type ByIsBattleEventEntity = BaseBattlePredicate<'ByIsBattleEventEntity'>
export type ByIsTargetValid = BaseBattlePredicate<'ByIsTargetValid'>

export type ByCompareHP = BaseBattleComparePredicate<'ByCompareHP', number>
export type ByCompareSpecialSPRatio = BaseBattleComparePredicate<'ByCompareSpecialSPRatio', number>

export type ByIsAutoBattle = BasePredicate<'IsAutoBattle'>
export type ByIsInStoryMode = BasePredicate<'ByIsInStoryMode'>
export type BySkipNextTeleportEffect = BasePredicate<'BySkipNextTeleportEffect'>
export type ByIsTeamLeader = BasePredicate<'ByIsTeamLeader'>
export type ByIsLastBattleWin = BasePredicate<'ByIsLastBattleWin'>
export type ByCompareStoryLineID = BasePredicate<'ByCompareStoryLineID'>
export type ByLocalPlayerIsFakeAvatar = BasePredicate<'ByLocalPlayerIsFakeAvatar'>
export type ByCompareRogueTournLevel = BasePredicate<'ByCompareRogueTournLevel'>

export type ByCompareWaveCount = BaseComparePredicate<'ByCompareWaveCount', number>

export type GraphPredicate = 
	| ByCompareCustomString | ByCompareDynamicValue | ByCompareMainMissionState
	| ByCompareSubMissionState | ByAnd | ByAny | ByNot | ByContainBehaviorFlag | ByRankActivated
	| BySkillPointActivated | ByIsContainModifier | ByHaveEnemyAlive | ByAvatarBaseType 
	| ByCheckModifierCallBackStatusType | ByTargetTeam | ByContainsParamFlag | ByCompareTarget
	| ByCheckModifierCallBackName | ByRandomChance | ByAttackType | ByAnimatorParam
	| ByComparePropState | ByCompareGroupState | ByCompareFloorSavedValue
	| ByCompareGraphDynamicFloat | ByCompareFloorCustomFloat | ByComparePerformance
	| ByIfGroupIsOccupied | ByCompareMissionCustomValue | ByCompareItemNumber
	| ByCompareTeamLeaderBodySize | ByCompareMusicRhythmSongID | ByCompareVersionFinalMainMission
	| ByIsBattleEventEntity | ByIsTargetValid | ByCompareHP | ByCompareSpecialSPRatio
	| ByIsAutoBattle | ByIsInStoryMode | BySkipNextTeleportEffect | ByIsTeamLeader
	| ByIsLastBattleWin | ByCompareStoryLineID | ByLocalPlayerIsFakeAvatar
	| ByCompareRogueTournLevel | ByCompareWaveCount