import { HashReference } from '../../TextMap.ts'
import { ItemReference } from '../Item.js'

export interface BelobogShopUIData {
	ID: number
	Name: HashReference
	Desc: HashReference
	IconPath: string
	ImgPath: string
	ReplyIDList: number[]
}

export interface MaterialSubmitterData {
	ID: number
	ActivityModuleID: number
	ParamList: number[]
	MaterialList: ItemReference[]
	MissionID: number
	RewardID: number
}

export interface MaterialSubmitterGroupData {
	ActivityID: number
	SubmitterIDList: number[]
	Type: 'BelobogShop'
}

export interface MaterialSubmitterReplyData {
	ID: number
	Tag: number
	Content: HashReference
	PersonName: HashReference
	HeadIconPath: string
}