import { Dictionary } from '../Shared.ts'
import type { HashReference } from '../TextMap.ts'

export type ItemMainType = 'Virtual' | 'Material' | 'Usable' | 'Display' | 'Mission'
	| 'AvatarCard'

export type ItemSubType = 
	| 'Virtual' | 'Material' | 'Gift' | 'RelicSetShowOnly' | 'RelicRarityShowOnly'
	| 'Mission' | 'Book' | 'ChatBubble' | 'PhoneTheme' | 'MuseumExhibit' | 'MuseumStuff' 
	| 'AetherSkill' | 'AetherSpirit' | 'ChessRogueDiceSurface' | 'GameplayCounter' 
	| 'ForceOpitonalGift' | 'Food' | 'Formula' | 'AvatarCard' | 'HeadIcon' | 'Eidolon'
	| 'MusicAlbum' | 'TravelBrochurePaster' | 'Equipment' | 'Relic' | 'PamSkin'
	| 'TrainPartyDiyMaterial'
	
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

export interface InternalItemComefrom {
	ID: number
	Comefromid: number
	Sort: number
	Desc: HashReference
	GotoID: number
	GotoParam: number[]
	EnableMissionTrack?: boolean
	NPCMonsterTrackID?: number
}

export interface InternalPassSticker {
	ID: number
	TravelBrochureID: number[]
	IncreaseCompletion: number
	DefaultUnlock?: boolean
	Type: 'Image' | 'Text'
	PasterTextmap?: HashReference
	PasterUnlockDesc?: HashReference
}

export interface InternalItemPurpose {
	ID: number
	PurposeText: HashReference
}

export interface InternalPassPage {
	ID: number
	DiaryGroupID: number
	Conditions: unknown[]
	FinishQuestID: number
	Type: 'Intro' | 'Main'
	DirectoryName: HashReference
	Sort: number
	ShowInDirectory: boolean
	ShowUnlockToast?: boolean
}

export interface ItemReference {
	ItemID: number
	ItemNum?: number
}

export type ItemConfig = Record<string, InternalItem>

export interface InternalRecipe {
	ID: number
	FormulaType: 'Normal' | 'SelectedRelic' | 'Sepcial'
	RelicList?: unknown[]
	SpecialMaterialCost?: unknown[]
	ItemID: number
	MaterialCost: ItemReference[]
	CoinCost?: number
	Type: number
	Order: number
	FormulaRequire: number
	MaxCount: number
	IsShowHoldNumber: boolean
	ItemComposeTag: number[]
	LimitType: 'NotLimit' | 'Weekly'
	LimitValue?: number
	FuncType: 'Replace' | 'Compose'
}

export interface InternalRewardData {
	RewardID: number
	Hcoin?: number
	[k: `ItemID_${number}`]: number
	[k: `Count_${number}`]: number
}

export interface ItemSortData {
	ID: number
	SortID: number
}

export type InternalRecipeConfig = Dictionary<InternalRecipe>

export interface InternalCureInfo {
	ID: number
	CureInfoTitle: HashReference
	CureInfoDesc: HashReference
	ImgPath: string
}

export interface InternalInventoryTabData {
	ID: number
	TabName: HashReference
	IconImagePath: string
	DisplayInventoryType: 'Normal' | 'Rogue'
	DisplayItemSubType: (ItemMainType | ItemSubType | number)[]
	InventoryDisplayTag: number
	TabSortWeight: number
	ItemSortTypeList: string[]
	SellType: string
	UnlockCondition: unknown
}