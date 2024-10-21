import { Value } from '../Shared.ts'
import { HashReference } from '../TextMap.ts'

export type RelicSlot = 'HEAD' | 'HAND' | 'BODY' | 'FOOT' | 'NECK' | 'OBJECT'
export type RelicRarity = 'CombatPowerRelicRarity2' | 'CombatPowerRelicRarity3' | 'CombatPowerRelicRarity4' | 'CombatPowerRelicRarity5'

export interface InternalRelicSet {
	SetID: number
	SetSkillList: [2, 4][]
	SetIconPath: string
	SetIconFigurePath: string
	SetName: HashReference
	DisplayItemID: number
	Release: boolean
	IsPlanarSuit?: boolean
}

export interface InternalRelicSetBonus {
	SetID: number
	RequireNum: number
	SkillDesc: HashReference
	PropertyList: unknown[] // we dont need this atm, and it uses unmapped keys so its not worth the trouble
	AbilityName?: string
	AbilityParamList: Value<number>[]
}

export interface InternalRelicItem {
	ID: number
	SetID: number
	Type: RelicSlot
	Rarity: RelicRarity
	MainAffixGroup: number
	SubAffixGroup: number
	MaxLevel: number
	ExpType: number
	ExpProvide: number
	CoinCost: number
	Mode: 'BASIC' | 'CUSTOM'
}

export interface InternalRelicData {
	SetID: number
	Type: RelicSlot
	IconPath: string
	ItemFigureIconPath: string
	RelicName: HashReference
	ItemBGDesc: HashReference
	BGStoryTitle: HashReference
	BGStoryContent: HashReference
}