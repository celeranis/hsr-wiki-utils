import { Value } from '../../Shared.ts'
import type { HashReference } from '../../TextMap.ts'
import { GraphPredicate } from './Predicate.js'
import { PropTaskTarget, TargetFetchAdvancedProp } from './Target.js'

export interface Act {
	OnInitSequece: unknown[]
	OnStartSequece: DialogSequence[]
	Type?: 'Mission'
}

export interface DialogSequence {
	TaskList: InternalDialogTask[]
	IsLoop?: boolean
}

export interface TaskShowBg {
	$type: "RPG.GameCore.ShowRogueTalkBg"
	TalkBgID: number
}

export interface RoguePlayAndWaitSimpleTalk {
	$type: "RPG.GameCore.PlayAndWaitRogueSimpleTalk" | "RPG.GameCore.PlayRogueSimpleTalk"
	SimpleTalkList: RogueSimpleTalk[]
}

export interface RogueSimpleTalk {
	TalkSentenceID: number
	ProtectTime?: number
}

export interface TriggerSound {
	$type: "RPG.GameCore.TriggerSound"
	SoundName: string
	EmitterType: string
}

export interface RoguePlayOptionTalk {
	$type: "RPG.GameCore.PlayRogueOptionTalk"
	OptionList: TalkOption[]
}

export interface TalkOption {
	TalkSentenceID?: undefined
	OptionTextmapID: HashReference
	OptionIconType: string
	TriggerCustomString?: string
	RogueOptionID: number
}

export interface PlayOptionTalkSimple {
	$type: "RPG.GameCore.PlayRogueOptionTalk"
	OptionList: TalkOptionSimple[]
}

export interface TalkOptionSimple {
	OptionTextmapID?: undefined
	TalkSentenceID: number
	OptionIconType: string
	TriggerCustomString: string
	RogueOptionID?: undefined
}

export interface WaitCustomString {
	$type: 'RPG.GameCore.WaitCustomString'
	CustomString: ValueReference<string>
}

export interface TriggerCustomString {
	$type: 'RPG.GameCore.TriggerCustomString' | 'RPG.GameCore.TriggerCustomStringOnDialogEnd'
	CustomString: ValueReference<string>
}

export interface PlayAndWaitSimpleTalk {
	$type: 'RPG.GameCore.PlayAndWaitSimpleTalk' | 'RPG.GameCore.PlaySimpleTalk' | 'RPG.GameCore.PlayMissionTalk'
	BlackMask?: boolean
	SimpleTalkList: SimpleTalk[]
}

export interface SimpleTalk {
	TextSpeed: number
	TalkSentenceID: number
	ProtectTime: number
}

// we only really care about the text for this
export interface PerformanceTransition {
	$type: 'RPG.GameCore.PerformanceTransition'
	TextEnabled: boolean
	TalkSentenceID?: number
	CreateNpcList: number[]
	CaptureNpcList: number[]
	DestroyNpcList: number[]
	CreateProp?: unknown
	DestroyProp?: unknown
	AdvCreateGroupEntity?: unknown
	AdvDestroyGroupEntity?: unknown
	ActiveVirtualCamera?: unknown
	ActiveTemplateVirtualCamera?: unknown
	SwitchCharacterAnchor?: unknown
	AdvNpcFaceToPlayer?: unknown
}

export interface PlayOptionTalk {
	$type: 'RPG.GameCore.PlayOptionTalk'
	OptionList: {
		TalkSentenceID: number
		OptionIconType: string
		TriggerCustomString: string
	}[]
}

export interface CustomStringReference {
	Custom: true
	Key: string
}

export type ValueReference<T> = Value<T>// | CustomStringReference

export interface DialogEventMap {
	DialogueEventID: number
	SuccessCustomString?: string
	FailureCustomString?: string
}

export interface WaitDialogueEvent {
	$type: 'RPG.GameCore.WaitDialogueEvent'
	DialogueEventList: DialogEventMap[]
}

export interface PropStateExecute {
	TargetType: PropTaskTarget
	State: string
	Execute: InternalDialogTask[]
}

export interface FixedTaskParam {
	IsDynamic: false
	FixedValue?: Value<number>
	fixedValue?: Value<number>
}

export interface DynamicTaskParam {
	IsDynamic: true
	PostfixExpr: PostfixExpr
}

export interface PostfixExpr {
	OpCodes: string
	FixedValues: Value<number>[]
	DynamicHashes: number[]
}

export interface ShowWaypointByProp {
	$type: 'RPG.GameCore.ShowWaypointByProp'
	GroupID: TaskParam
	InstanceID: TaskParam
	MaxRange: number
	IconPath: string
	OnNameBoard: boolean
}

export interface HideWaypointByProp {
	$type: 'RPG.GameCore.HideWaypointByProp'
	GroupID: TaskParam
	InstanceID: TaskParam
	OnNameBoard: boolean
}

export interface PropStateChangeListenerConfig {
	$type: 'RPG.GameCore.PropStateChangeListenerConfig'
	FromState: string
	ToState: string
	OnChange: InternalDialogTask[]
	TargetType: PropTaskTarget
}

export interface TriggerToastPage {
	$type: 'RPG.GameCore.ToastPage'
	MessageOne: HashReference
	MessageTwo: HashReference
}

export interface SharedFloat {
	$type: 'RPG.GameCore.SharedFloat'
	Value?: boolean
	Key: string
}

export interface SharedString {
	$type: 'RPG.GameCore.SharedString'
	Value?: string
	Key: string
}

export interface WaitPredicateSuccess {
	$type: 'RPG.GameCore.WaitPredicateSucc'
	TaskEnabled: boolean
}

export interface StartDialogueEntityInteract {
	$type: 'RPG.GameCore.StartDialogueEntityInteract'
	LevelGraphData: string
	UseOverrideData?: boolean
	ValueSource: { Values: ValueSource[] }
}

export interface EndDialogueEntityInteract {
	$type: 'RPG.GameCore.EndDialogueEntityInteract'
	LevelGraphData: string
}

export interface OpenTreasureChallenge {
	$type: 'RPG.GameCore.OpenTreasureChallenge'
	RaidID: number
	OnCancel: InternalDialogTask[]
}

export interface ShowTutorialUI {
	$type: 'RPG.GameCore.ShowTutorialUI'
	AssociatedUIName: string
	ForceShowDialog: boolean
}

export interface ShowGuideText {
	$type: 'RPG.GameCore.ShowGuideText'
	ID: number
	GuideResID: number
	Show?: boolean
	TextPath: string
	Text: string
	ActionName?: string
	CopyAnchorAndSale: boolean
	PCGuide?: {
		TextPath?: string
		Text?: string
	}
}

export interface WaitSecond {
	$type: 'RPG.GameCore.WaitSecond'
	WaitTime: TaskParam
}

export interface SetupPropUITrigger {
	$type: 'RPG.GameCore.PropSetupUITrigger'
	ButtonText: HashReference
	ButtonCallback: InternalDialogTask[]
	TargetType: PropTaskTarget
}

export interface PredicateTaskList {
	$type: 'RPG.GameCore.PredicateTaskList'
	Predicate: GraphPredicate
	SuccessTaskList: InternalDialogTask[]
	FailedTaskList?: InternalDialogTask[]
}

export interface NoContentTask<T extends string> {
	$type: T
}

export interface InternalTriggerPerformance {
	$type: 'RPG.GameCore.TriggerPerformance'
	PerformanceType: 'A' | 'C' | 'CG' | 'D' | 'DS' | 'E'
	PerformanceID: number
	MaskConfig?: {
		UseExcelData?: boolean
		StartBlack?: 'NoPre'
	}
}

export interface FinishPerformanceMission {
	$type: 'RPG.GameCore.FinishPerformanceMission'
	Key: string
}

export interface PlayTimeline {
	$type: 'RPG.GameCore.PlayTimeline'
	TimelineName: string
	Type: string
	Parameters?: unknown[]
}

export interface PlayVideo {
	$type: 'RPG.GameCore.PlayVideo'
	VideoID: number
}

export type EntityType = 'NPC' | 'LocalPlayer' | 'NPCMonster'

export interface PropSetupTrigger {
	$type: 'RPG.GameCore.PropSetupTrigger'
	TargetType: TargetFetchAdvancedProp
	TargetEntityType: EntityType
	TargetID: TaskParam
	TargetTypes: EntityType[]
	DestroyAfterTriggered?: boolean
	OnTriggerEnter?: InternalDialogTask[]
}

export interface AdvSetupCustomTaskTrigger {
	$type: 'RPG.GameCore.AdvSetupCustomTaskTrigger'
	TargetType: TargetFetchAdvancedProp
	TriggerName: string
	OnEnter: InternalDialogTask[]
	DisableAfterTriggered?: boolean
}

export interface PlayScreenTransfer {
	$type: 'RPG.GameCore.PlayScreenTransfer' | 'RPG.GameCore.PlayFullScreenTransfer'
	Type?: 'Black'
	Mode?: 'SwitchOut'
	CustomTime?: number
}

export interface TriggerBattle {
	$type: 'RPG.GameCore.TriggerBattle'
	EventID: TaskParam
	GroupID: TaskParam
	BattleAreaID: TaskParam
}

export interface TriggerGroupEvent {
	$type: 'RPG.GameCore.TriggerGroupEvent' | 'RPG.GameCore.TriggerGroupEventOnDialogEnd'
	EventName: Value<string>
}

export interface WaitGroupEvent {
	$type: 'RPG.GameCore.WaitGroupEvent'
	EventName: Value<string>
	OnEvent: InternalDialogTask[]
}

export interface MissionCustomValue {
	Index: number
	isLocal: boolean
	ValidValueParamList: number[]
}

export interface SwitchCaseEntry {
	Predicate: GraphPredicate
	SuccessTaskList: InternalDialogTask[]
}

export interface SwitchCase {
	$type: 'RPG.GameCore.SwitchCase'
	TaskList: SwitchCaseEntry[]
	DefaultTask?: InternalDialogTask[]
}

export interface ShowHalfScreenPage {
	$type: 'RPG.GameCore.ShowHalfScreenPage'
	Name: string
	Param: string
	CustomShowUI?: unknown[]
	OnUIShow: InternalDialogTask[]
	OnUIExit: InternalDialogTask[]
}

export interface ObserveMaterialSubmission {
	$type: 'RPG.GameCore.ObserveMaterialSubmission'
	ID: number
	OnFinished: InternalDialogTask[]
	OnCancelled: InternalDialogTask[]
	OnInterrupted: InternalDialogTask[]
}

export type InternalFinishLevelGraph = NoContentTask<'RPG.GameCore.FinishLevelGraph'>
export type InternalEndPerformance = NoContentTask<'RPG.GameCore.EndPerformance'>

export type ValueSource = SharedFloat | SharedString

export type TaskParam = FixedTaskParam | DynamicTaskParam

export type InternalDialogTask = 
	| TaskShowBg | PlayAndWaitSimpleTalk | TriggerSound | PlayOptionTalk | WaitCustomString 
	| TriggerCustomString | WaitDialogueEvent | PlayOptionTalkSimple | RoguePlayAndWaitSimpleTalk
	| RoguePlayOptionTalk | WaitPredicateSuccess | TriggerToastPage | ShowWaypointByProp
	| PerformanceTransition | PredicateTaskList | InternalFinishLevelGraph | InternalTriggerPerformance
	| InternalEndPerformance | FinishPerformanceMission | PlayTimeline | PlayVideo | WaitSecond
	| PropSetupTrigger | PlayScreenTransfer | AdvSetupCustomTaskTrigger | TriggerBattle
	| TriggerGroupEvent | WaitGroupEvent | SwitchCase | ShowHalfScreenPage | ObserveMaterialSubmission