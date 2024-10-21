import { HashReference } from '../TextMap.ts'

export interface InternalContactsCamp {
	ContactsCamp: number
	Name: HashReference
	SortID: number
}

export interface InternalContactsCondition {
	ID: number
	TruthMissionCondition?: number
	FakeContactID: number
}

export interface InternalMessagesContact {
	ID: number
	Name: HashReference
	IconPath: string
	SignatureText: HashReference
	ContactsType: number
	ContactsCamp: number
}

export interface InternalContactType {
	ContactsType: number
	Name: HashReference
	SortID: number
}

export interface InternalMessagesGroup {
	ID: number
	MessageContactsID: number
	MessageSectionIDList: number[]
}

export type MessageItemType = 'Text' | 'Sticker' | 'Image' | 'Video' | 'Link' | 'Raid'
export type MessageSenderType = 'PlayerAuto' | 'Player' | 'NPC' | 'System'

export interface InternalMessageItem {
	ID: number
	ContactsID?: number
	Sender: MessageSenderType
	ItemType: MessageItemType
	MainText: HashReference
	ItemContentID?: number
	OptionText: HashReference
	NextItemIDList: number[]
	SectionID: number
}

export interface InternalMessageImage {
	ID: number
	ImagePath: string
	FemaleImagePath?: string
}

export interface InternalMessageLink {
	ID: number
	Title: HashReference
	ImagePath: string
	Type: 'Exit'
	OnceOnly?: boolean
}

export interface InternalMessageRaidEntrance {
	ID: number
	RaidID: number
	ImagePath: string
	InvalidMissionList: number[]
}

export interface InternalMessageVideo {
	ID: number
	ImagePath: string
	VideoID: number
}

export interface InternalMessagesSection {
	ID: number
	StartMessageItemIDList: number[]
	IsPerformMessage?: boolean
	MainMissionLink?: number
}

export interface InternalEmoji {
	EmojiID: number
	Gender: string
	EmojiGroupID: number
	KeyWords: HashReference
	EmojiPath: string
	SameGroupOrder: number
	GenderLink?: number
	IsTrainMembers?: boolean
}