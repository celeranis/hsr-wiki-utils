import type { HashReference } from './TextMap.js'

export interface Act {
	OnInitSequece: unknown[]
	OnStartSequece: DialogSequence[]
}

export interface DialogSequence {
	TaskList: DialogTask[]
	IsLoop?: boolean
}

export interface TaskShowBg {
	$type: "RPG.GameCore.ShowRogueTalkBg"
	TalkBgID: number
}

export interface PlayAndWaitSimpleTalk {
	$type: "RPG.GameCore.PlayAndWaitRogueSimpleTalk" | "RPG.GameCore.PlayRogueSimpleTalk"
	SimpleTalkList: SimpleTalk[]
}

export interface SimpleTalk {
	TalkSentenceID: number
	ProtectTime?: number
}

export interface TriggerSound {
	$type: "RPG.GameCore.TriggerSound"
	SoundName: string
	EmitterType: string
}

export interface PlayOptionTalk {
	$type: "RPG.GameCore.PlayRogueOptionTalk"
	OptionList: TalkOption[]
}

export interface TalkOption {
	TalkSentenceID?: undefined
	OptionTextmapID: HashReference
	OptionIconType: string
	TriggerCustomString?: string
	DialogueEventID: number
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
	DialogueEventID?: undefined
}

export interface WaitCustomString {
	$type: 'RPG.GameCore.WaitCustomString'
	CustomString: {
		Value: string
	}
}

export interface TriggerCustomString {
	$type: 'RPG.GameCore.TriggerCustomString'
	CustomString: {
		Value: string
	}
}

export interface DialogEventMap {
	DialogueEventID: number
	SuccessCustomString?: string
	FailureCustomString?: string
}

export interface WaitDialogueEvent {
	$type: 'RPG.GameCore.WaitDialogueEvent'
	DialogueEventList: DialogEventMap[]
}

export type DialogTask = TaskShowBg | PlayAndWaitSimpleTalk | TriggerSound | PlayOptionTalk | WaitCustomString | TriggerCustomString | WaitDialogueEvent | PlayOptionTalkSimple