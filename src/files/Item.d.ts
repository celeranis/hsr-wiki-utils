import type { ItemReference } from '../Shared.ts'
import type { HashReference } from '../TextMap.ts'

export type ItemMainType = 'Virtual' | 'Material' | 'Usable' | 'Display' | 'Mission'
	| 'AvatarCard'

export type ItemSubType = 
	| 'Virtual' | 'Material' | 'Gift' | 'RelicSetShowOnly' | 'RelicRarityShowOnly'
	| 'Mission' | 'Book' | 'ChatBubble' | 'PhoneTheme' | 'MuseumExhibit' | 'MuseumStuff' 
	| 'AetherSkill' | 'AetherSpirit' | 'ChessRogueDiceSurface' | 'GameplayCounter' 
	| 'ForceOpitonalGift' | 'Food' | 'Formula' | 'AvatarCard' | 'HeadIcon' | 'Eidolon'
	| 'MusicAlbum'
	
export type ItemRarity = 
	| 'SuperRare'	// 5 stars
	| 'VeryRare'	// 4 stars
	| 'Rare'		// 3 stars
	| 'NotNormal'	// 2 stars
	| 'Normal'		// 1 star

export type ItemSellType = 
	| 'Destroy'	// used by most items
	| 'Sell'	// used by light cones and relics

export interface InternalItem {
	ID: number
	ItemMainType: ItemMainType
	ItemSubType: ItemSubType
	InventoryDisplayTag: number
	Rarity: ItemRarity
	PurposeType?: number
	isVisible?: boolean
	ItemName: HashReference
	ItemDesc: HashReference
	ItemBGDesc: HashReference
	ItemIconPath: string
	ItemFigureIconPath: string
	ItemCurrencyIconPath: string
	ItemAvatarIconPath: string
	PileLimit: number
	UseMethod?: number | 'AutoConversionItem'
	UseDataID?: number
	CustomDataList: number[]
	IsSellable?: boolean
	ReturnItemIDList: ItemReference[]
	ItemGroup?: number
	SellType?: ItemSellType
	IsShowRedDot?: boolean
}