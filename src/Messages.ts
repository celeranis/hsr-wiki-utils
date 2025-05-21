import { getExcelFile } from './files/GameFile.js'
import { InternalContactsCamp, InternalContactsCondition, InternalContactType, InternalEmoji, InternalMessageImage, InternalMessageItem, InternalMessageLink, InternalMessageRaidEntrance, InternalMessagesContact, InternalMessagesGroup, InternalMessagesSection, InternalMessageVideo, MessageItemType, MessageSenderType } from './files/Messages.js'
import { Mission } from './Mission.js'
import { Dictionary } from './Shared.js'
import { HashReference, textMap } from './TextMap.js'
import { AbstractDialogueTree, TranscriptionNote } from './util/AbstractDialogueTree.js'
import { wikiPageMap } from './util/wikipagemap.js'

export const MessageContactsCamp = await getExcelFile<InternalContactsCamp>('MessageContactsCamp.json', 'ContactsCamp')
export const MessageContactsCondition = await getExcelFile<InternalContactsCondition>('MessageContactsCondition.json', 'ID')
export const MessageContactsConfig = await getExcelFile<InternalMessagesContact>('MessageContactsConfig.json', 'ID')
export const MessageContactsType = await getExcelFile<InternalContactType>('MessageContactsType.json', 'ContactsType')
export const MessageGroupConfig = await getExcelFile<InternalMessagesGroup>('MessageGroupConfig.json', 'ID')
export const MessageItemConfig = await getExcelFile<InternalMessageItem>('MessageItemConfig.json', 'ID')
export const MessageItemLink = await getExcelFile<InternalMessageLink>('MessageItemLink.json', 'ID')
export const MessageItemRaidEntrance = await getExcelFile<InternalMessageRaidEntrance>('MessageItemRaidEntrance.json', 'ID')
export const MessageItemVideo = await getExcelFile<InternalMessageVideo>('MessageItemVideo.json', 'ID')
export const MessageItemImage = await getExcelFile<InternalMessageImage>('MessageItemImage.json', 'ID')
export const MessageSectionConfig = await getExcelFile<InternalMessagesSection>('MessageSectionConfig.json', 'ID')
export const RaidConfig = await getExcelFile<any>('RaidConfig.json', 'RaidID')
export const EmojiConfig = await getExcelFile<InternalEmoji>('EmojiConfig.json', 'EmojiID')

const PLAYER_CONTACT_ID = 8000

const MESSAGE_IMAGE_NAMES = {
	10004: 'Welt Stagnant Shadow',
	10005: 'Herta Panopticon System Wubbaboo 03',
	10006: 'Herta Panopticon System Wubbaboo 02',
	10007: 'Herta Panopticon System Wubbaboo 01',
	10009: 'Himeko Coffee',
	10010: 'Welt Animation',
	10011: 'Dan Heng Fight Club',
	10012: 'Silver Wolf Achievements',
	10013: 'Dan Heng Elixir Crucible',
	10014: 'Cong Padlock',
	10015: 'Cong Drifting Clouds',
	10016: 'Herta Surveillance Team Heritor Newsflash',
	10017: 'Herta Surveillance Team Duke Inferno',
	10019: 'Misha Snow Plains',
	10020: 'Package',
	10021: 'Sparkle Doll',
	10022: 'Firefly Selfie',
	10029: 'Ecology Researcher Toilet',
	10046: 'Firefly Lordly Trashcan',
	10047: 'Moze Boxes',
	10048: 'Moze Cycrane',
	10201: 'Qingque New Friends Bring New Joy',
	10202: 'Kafka Selfie',
	30103: 'Trailblazer Relics',
	30001: 'Critter Pick Rice Dumpling',
	30004: 'Guinaifen Crepescule',
	31002: 'Critter Pick Troublemaker',
	31003: 'Critter Pick Wisteria Cake',
	31004: 'Critter Pick Shader Cat',
	31005: 'Critter Pick Pure Sugar Child',
	31006: 'Critter Pick Lucky Snack',
	31007: 'Critter Pick Sesame Cake',
	31008: "Critter Pick Lambda's Friend",
	31009: 'Critter Pick Ice Cake',
	31010: 'Clo■■■',
	140500: 'Trailblazer Model Express',
}

const STICKER_OVERRIDES = {
	'sticker_7_2': 'File:Sticker PPG 07 Pom-Pom 03.png',
	'sticker_7_3': 'File:Sticker PPG 07 Pom-Pom 04.png',
	'sticker_7_4': 'File:Sticker PPG 07 Pom-Pom 05.png',
	'sticker_7_5': 'File:Sticker PPG 07 Pom-Pom 02.png',
}

export class MessagesContact {
	id: number
	
	name: string
	name_hash: HashReference
	faction: string
	icon_path: string
	
	type: string
	signature?: string

	fake_id?: number
	fake_name?: string
	fake_faction?: string
	fake_icon_path?: string
	fake_signature?: string
	reveal_mission_id?: number
	
	static readonly cache: Dictionary<MessagesContact> = {}
	
	constructor(data: InternalMessagesContact) {
		this.id = data.ID
		
		this.name_hash = data.Name
		this.name = textMap.getText(this.name_hash)
		
		switch (data.ContactsType) {
			case 1:
				this.type = 'Character'
				break
			case 3:
				this.type = 'Group'
				break
			case 2:
			default:
				this.type = 'NPC'
				break
		}
		this.icon_path = data.IconPath
		
		this.signature = textMap.getText(data.SignatureText) || undefined
		this.faction = textMap.getText(MessageContactsCamp[data.ContactsCamp]?.Name)
		
		let fakeContactRef = MessageContactsCondition[this.id]
		let fakeContact = fakeContactRef?.FakeContactID ? MessageContactsConfig[fakeContactRef?.FakeContactID] : undefined
		
		if (fakeContact) {
			this.fake_id = fakeContact.ID
			this.fake_name = textMap.getText(fakeContact.Name)
			this.fake_faction = textMap.getText(MessageContactsCamp[fakeContact.ContactsCamp]?.Name)
			this.fake_icon_path = fakeContact.IconPath
			this.fake_signature = textMap.getText(fakeContact.SignatureText)
			this.reveal_mission_id = fakeContactRef!.TruthMissionCondition
		}
		
		MessagesContact.cache[this.id] = this
	}
	
	static fromId(id: string | number) {
		return this.cache[id] ?? new this(MessageContactsConfig[id])
	}
	
	static loadAll(): MessagesContact[] {
		return Object.values(MessageContactsConfig).map(contact => new this(contact))
	}
	
	get display_name() {
		return (!this.reveal_mission_id && this.fake_name) || this.name
	}
	
	getGroups() {
		return Object.values(MessageGroupConfig)
			.filter(group => group.MessageContactsID == this.id)
			.map(group => new MessagesGroup(group))
	}
}

export class MessagesGroup {
	id: number
	contact_id: number
	section_ids: number[]
	
	contact: MessagesContact

	static readonly cache: Dictionary<MessagesGroup> = {}
	
	constructor(data: InternalMessagesGroup) {
		this.id = data.ID
		this.section_ids = data.MessageSectionIDList
		this.contact_id = data.MessageContactsID
		
		this.contact = MessagesContact.fromId(this.contact_id)

		MessagesGroup.cache[this.id] = this
	}

	static fromId(id: string | number) {
		return this.cache[id] ?? new this(MessageGroupConfig[id])
	}
	
	static fromSection(section: MessagesSection): MessagesGroup {
		for (const group of Object.values(MessageGroupConfig)) {
			if (group.MessageSectionIDList.includes(section.id)) {
				return this.fromId(group.ID)
			}
		}
		throw new TypeError(`No group found containing section ${section.id}`)
	}

	isDaily() { // daily messages use group IDs 2XXXX
		return this.id >= 2e4 && this.id < 3e4
	}
	
	getSections() {
		return this.section_ids
			.map(sectionId => new MessagesSection(MessageSectionConfig[sectionId]))
	}
}

export class MessagesSection {
	id: number
	starting_message_ids: number[]
	mission_link_id?: number
	is_perform: boolean
	
	group: MessagesGroup

	static readonly cache: Dictionary<MessagesSection> = {}
	
	constructor(data: InternalMessagesSection) {
		this.id = data.ID
		this.starting_message_ids = data.StartMessageItemIDList
		this.mission_link_id = data.MainMissionLink
		this.is_perform = data.IsPerformMessage ?? false
		
		this.group = MessagesGroup.fromSection(this)

		MessagesSection.cache[this.id] = this
	}

	static fromId(id: string | number) {
		return this.cache[id] ?? new this(MessageSectionConfig[id])
	}
	
	getMessages(): Promise<MessageTree> {
		return MessageTree.fromSection(this)
	}
}

export class MessageItem {
	id: number
	next_ids: number[]
	section_id: number
	
	type: MessageItemType
	sender_id?: number
	sender_type: MessageSenderType
	
	text?: string
	option_text?: string
	content_id?: number
	
	section: MessagesSection
	group: MessagesGroup
	sender?: MessagesContact
	
	constructor(data: InternalMessageItem) {
		this.id = data.ID
		this.next_ids = data.NextItemIDList
		this.section_id = data.SectionID
		
		this.type = data.ItemType
		this.sender_id = data.ContactsID
		this.sender_type = data.Sender
		
		this.text = textMap.getText(data.MainText) || undefined
		this.option_text = textMap.getText(data.OptionText) || undefined
		this.content_id = data.ItemContentID
		
		this.section = MessagesSection.fromId(this.section_id)
		this.group = this.section.group
		if (this.sender_type == 'Player' || this.sender_type == 'PlayerAuto') {
			this.sender = MessagesContact.fromId(PLAYER_CONTACT_ID)
		} else if (this.sender_type == 'NPC') {
			this.sender = this.sender_id ? MessagesContact.fromId(this.sender_id) : this.group.contact
		}
	}
	
	static fromId(id: string | number) {
		return new this(MessageItemConfig[id])
	}
	
	getNext() {
		return this.next_ids.map(id => MessageItem.fromId(id))
	}
	
	equals(otherItem: MessageItem) {
		return this.id == otherItem.id
			|| (
				this.sender_type == otherItem.sender_type
				&& this.sender_id == otherItem.sender_id
				&& this.section_id == otherItem.section_id
				&& this.next_ids.toString() == otherItem.next_ids.toString()
				&& this.text == otherItem.text
				&& this.option_text == otherItem.option_text
				&& this.content_id == otherItem.content_id
			)
	}
	
	contentWikitext(): string {
		switch (this.type) {
			case 'Text':
				return this.text?.replaceAll('\n', '<br />') || ''
			case 'Image':
				const imageData = MessageItemImage[this.content_id!]
				const fileName = MESSAGE_IMAGE_NAMES[this.content_id!] ? `Message ${MESSAGE_IMAGE_NAMES[this.content_id!]}` : `Message ${this.sender_type == 'NPC' ? this.sender!.name : this.group.contact.name} ${this.content_id! - 10000}`
				return !imageData.FemaleImagePath 
					? `[[File:${fileName}.png|256px]]`
					: `[[File:${fileName} (Caelus).png|256px]] [[File:${fileName} (Stelle).png|256px]]`
			case 'Link':
				const linkData = MessageItemLink[this.content_id!]
				return `{Link: caption = ${textMap.getText(linkData.Title)} ;; image = Message Link ${this.content_id! - 10000}.png ;; link = A Foxian Tale of the Haunted/Ghostly Grove}`
			case 'Raid':
				const raidData = MessageItemRaidEntrance[this.id]
				return `{Domain Invite: ${textMap.getText(RaidConfig[raidData.RaidID].RaidName)}}` // TODO: proper DoE support
			case 'Sticker':
				const stickerData = EmojiConfig[this.content_id!] ?? Object.values(EmojiConfig).find(emoji => emoji.EmojiPath.includes(`/${this.content_id}.png`))
				if (!stickerData) {
					return `{{tx|Unknown sticker}}<!--ID: ${this.content_id}-->`
				}
				return stickerData.GenderLink 
					? Object.values(EmojiConfig).filter(emoji => emoji.GenderLink == stickerData.GenderLink).map(sd => sticker(sd, this.text)).join(' ')
					: sticker(stickerData, this.text)
			case 'Video':
				return `{{tx|Video missing}}`
		}
	}
	
	wikitext(indent: number): string {
		switch (this.sender_type) {
			case 'NPC':
			case 'PlayerAuto':
				return `:'''${this.sender?.display_name}:''' ${this.contentWikitext()}`
			case 'Player':
				return `:{Choice} ${this.option_text || this.contentWikitext()}\n${':'.repeat(indent)}:'''${this.sender?.display_name}:''' ${this.contentWikitext()}`
			case 'System':
				return `:{{DIcon|Warning}} ${this.contentWikitext()}`
		}
	}
}

function sticker(stickerData: InternalEmoji, caption?: string) {
	caption = caption?.replaceAll('[', '&lbrack;')?.replaceAll(']', '&rbrack;')
	if (stickerData.EmojiGroupID == undefined) {
		stickerData = Object.values(EmojiConfig).find(emoji => emoji.EmojiPath == stickerData.EmojiPath && emoji.EmojiGroupID) ?? stickerData
	}
	const stickerKey = `sticker_${stickerData.EmojiGroupID - 100}_${stickerData.SameGroupOrder}`
	const stickerTitle = STICKER_OVERRIDES[stickerKey] ?? wikiPageMap[stickerKey]?.pagename
	if (stickerTitle) {
		return `[[${stickerTitle}|80px${caption ? `|${caption}` : ''}]]`
	} else {
		return `{{tx|Missing sticker${caption ? `: ${caption}` : ''}}}{{subst:void|<!--${stickerData.EmojiPath}-->}}`
	}
}

export class MessageTree extends AbstractDialogueTree<MessageItem> {
	type: 'messages' = 'messages'
	
	protected constructor(public section: MessagesSection) {
		super(`messages_section_${section.id}`)
	}
	
	static async fromSection(section: MessagesSection) {
		const tree = new this(section)
		await tree.setRoot(section.starting_message_ids.map(id => MessageItem.fromId(id)))
		return tree
	}
	
	getNext(msg: MessageItem): MessageItem[] {
		return msg.getNext()
	}
	
	getParticipants() {
		const participants = new Set<MessagesContact>()
		for (const msg of this.list()) {
			if (!(msg instanceof TranscriptionNote) && msg.sender) {
				participants.add(msg.sender)
			}
		}
		return [...participants]
	}
	
	async wikitext(): Promise<string> {
		return (await super.wikitext()) + (this.section.mission_link_id ? `\n;{Accepted Mission: ${Mission.fromId(this.section.mission_link_id).pagetitle}}` : '')
	}
}