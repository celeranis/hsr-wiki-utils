import { HashReference } from '../TextMap.ts'

export type MainShopType = 'Main' | 'Npc'
export type ShopLimitType = 'Level' | 'MainMission' | 'HasNoRefreshGoods' | 'PreGoods' | 'ItemNum' | 'EquipmentRankUpNum'
export type RefreshType = 'DAILY' | 'WEEK' | 'MONTH' | 'CYCLE'

export interface InternalShop {
	ShopID: number
	ShopMainType: MainShopType
	ShopType: number
	ShopName?: HashReference
	ShopDesc?: HashReference
	ShopIconPath: string
	ShopBar: string
	ShopSortID: number
	LimitType1?: ShopLimitType
	LimitValue1List: number[]
	LimitType2?: ShopLimitType
	LimitValue2List: number[]
	IsOpen: boolean
	ServerVerification?: boolean
	ScheduleDataID: number
	HideRemainTime: boolean
}

export interface InternalShopGoods {
	GoodsID: number
	ItemID: number
	ItemCount: number
	CurrencyList: number[]
	CurrencyCostList: number[]
	GoodsSortID: number
	
	LimitType1?: ShopLimitType
	LimitValue1List: number[]
	LimitType2?: ShopLimitType
	LimitValue2List: number[]
	OnShelfType1?: ShopLimitType
	OnShelfValue1List: number[]
	
	RefreshType?: RefreshType
	CycleDays?: number
	LimitTimes?: number
	ShopID: number
	ScheduleDataID: number
	
	IsOnSale?: boolean
	TagType?: number
	TagParam?: number
}

export interface InternalShopGroup {
	GropuID: number
	ItemID: number
	GroupType: 'Rotate'
	RotateOrder: number
}