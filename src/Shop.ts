import cfg from '../config.json' with { "type": "json" }
import { getFile } from './files/GameFile.js'
import { InternalShop, InternalShopGoods, MainShopType, RefreshType, ShopLimitType } from './files/Shop.js'
import { Item } from './Item.js'
import { Version } from './Shared.js'
import { SupportedLanguage, TextMap } from './TextMap.js'

const ShopConfig = await getFile<InternalShop[]>('ExcelOutput/ShopConfig.json')
const ShopGoodsConfig = await getFile<InternalShopGoods[]>('ExcelOutput/ShopGoodsConfig.json')
const goodsByVersion: Partial<Record<Version, InternalShopGoods[]>> = {[cfg.target_version as Version]: ShopGoodsConfig}

export interface ShopGood {
	item_id: number
	item?: Item
	goods_id: number
	currency_id: number
	price: number
	discounted_price?: number
	per_purchase: number
	stock?: number
	refresh?: RefreshType
	cycle_days?: number
	condition_types?: (ShopLimitType | undefined)[]
	condition_args?: (number[] | undefined)[]
}

function convertOldRefreshType(refreshType?: RefreshType | number): RefreshType | undefined {
	switch (refreshType) {
		case 1:
			return 'DAILY'
		case 2:
			return 'WEEK'
		case 3:
			return 'MONTH'
		default:
			if (typeof(refreshType) == 'string' || refreshType == undefined) {
				return refreshType
			} else {
				throw new TypeError(`Unknown RefreshType "${refreshType}"`)
			}
	}
}

export class Shop {
	id: number
	main_type: MainShopType
	group: number
	name: string
	name_hash?: number | bigint
	secondary_name: string
	icon: string
	sort_id: number
	open: boolean
	
	private version: Version = cfg.target_version as Version
	
	constructor(config: InternalShop, thisTextMap: TextMap = TextMap.default) {
		this.id = config.ShopID
		this.main_type = config.ShopMainType
		this.group = config.ShopType
		
		this.name = thisTextMap.getText(config.ShopName)
		this.name_hash = config.ShopName?.Hash
		
		this.secondary_name = thisTextMap.getText(config.ShopDesc)
		this.icon = config.ShopIconPath
		this.sort_id = config.ShopSortID
		this.open = config.IsOpen ?? false
		
		this.version = thisTextMap.version
	}
	
	static fromId(id: string | number) {
		const config = Object.values(ShopConfig).find(shop => shop.ShopID == id)
		if (!config) {
			throw new TypeError(`Unknown ShopID ${id}`)
		}
		return new this(config)
	}
	
	static async loadFromVersion(version: Version) {
		await Item.loadAll()
		const textMap = await TextMap.load(version, cfg.output_lang as SupportedLanguage)
		if (!goodsByVersion[version]) {
			goodsByVersion[version] = await getFile<InternalShopGoods[]>('ExcelOutput/ShopGoodsConfig.json', version)
		}
		return Object.values(await getFile('ExcelOutput/ShopConfig.json', version)).map(config => new this(config, textMap))
	}
	
	static async loadAll() {
		await Item.loadAll()
		return Object.values(ShopConfig).map(config => new this(config))
	}
	
	getItems(): ShopGood[] {
		return Object.values(goodsByVersion[this.version]!)
			.filter(goods => goods.ShopID == this.id && goods.ItemID)
			.sort((g1, g2) => (g1.GoodsSortID ?? g1.GoodsID) - (g2.GoodsSortID ?? g2.GoodsID))
			.map(goods => {
				const has_conditions = goods.LimitType1 || goods.LimitType2 || goods.OnShelfType1
				return {
					item_id: goods.ItemID,
					item: Item.fromId(goods.ItemID),
					goods_id: goods.GoodsID,
					currency_id: goods.CurrencyList[0],
					price: goods.IsOnSale ? goods.TagParam! : goods.CurrencyCostList[0],
					discounted_price: goods.IsOnSale ? goods.CurrencyCostList[0] : undefined,
					per_purchase: goods.ItemCount,
					stock: goods.LimitTimes,
					refresh: convertOldRefreshType(goods.RefreshType),
					cycle_days: goods.CycleDays,
					condition_types: has_conditions ? [goods.LimitType1, goods.LimitType2, goods.OnShelfType1] : undefined,
					condition_args: has_conditions ? [goods.LimitValue1List, goods.LimitValue2List, goods.OnShelfValue1List] : undefined,
				}
			})
	}
}