import { Dictionary, sanitizeString, titleCase, wikiTitle, wikiTitleLink } from './Shared.js';
import { textMap } from './TextMap.js';
import { LazyData, getFile } from './files/GameFile.js';
import type { InternalItem, InternalItemComefrom, InternalItemPurpose, InternalPassPage, InternalPassSticker, InternalRecipeConfig, InternalRewardData, ItemConfig, ItemMainType, ItemRarity, ItemReference, ItemSortData, ItemSubType } from './files/Item.js';

type ItemSourceData = Dictionary<Dictionary<InternalItemComefrom>>

export type InventoryTab = 'Upgrade Materials' | 'Light Cone' | 'Missions' 
	| 'Consumables' | 'Valuables' | 'Relics' | 'Other Materials'

const HAS_EFFECT: ItemSubType[] = ['Food']

export const COMMON_ITEMS = {
	STELLAR_JADE: 1,
	CREDIT: 2,
	EXP: 21,
	TRAILBLAZE_EXP: 22,
	COSMIC_FRAGMENT: 31,
	STANDARD_PASS: 101,
	SPECIAL_PASS: 102,
	FUEL: 201
}

export const enum ItemPurpose {
	CHARACTER_EXP = 1,
	ASCENSION_MATERIAL = 2,
	PATH_MATERIAL = 3,
	WEEKLY_DROP = 4,
	LIGHT_CONE_EXP = 5,
	RELIC_EXP = 6,
	NORMAL_ENEMY_DROP = 7,
	WARP_ITEM = 8,
	LIMITED_WARP_ITEM = 9,
	CONSUMABLE = 10,
	COMMON_CURRENCY = 11,
	RARE_CURRENCY = 12,
	WORLD_CURRENCY = 13,
	VALUABLE_OBJECT = 14,
	RELIC_COFFRET = 15,
	MISSION_ITEM = 16,
	SYNTHESIS_MATERIAL = 17,
	// READABLE = 18,
	RECIPE = 19,
	DISK = 20,
	READABLE = 21
}

const sortData = await getFile<Dictionary<ItemSortData>>('ExcelOutput/ItemDisplaySort.json')

export class Item {
	static readonly itemData = {
		main: new LazyData<ItemConfig>('ExcelOutput/ItemConfig.json'),
		characters: new LazyData<ItemConfig>('ExcelOutput/ItemConfigAvatar.json'),
		character_default_pfps: new LazyData<ItemConfig>('ExcelOutput/ItemConfigAvatarPlayerIcon.json'),
		eidolons: new LazyData<ItemConfig>('ExcelOutput/ItemConfigAvatarRank.json'),
		skins: new LazyData<ItemConfig>('ExcelOutput/ItemConfigAvatarSkin.json'),
		readables: new LazyData<ItemConfig>('ExcelOutput/ItemConfigBook.json'),
		disks: new LazyData<ItemConfig>('ExcelOutput/ItemConfigDisk.json'),
		light_cones: new LazyData<ItemConfig>('ExcelOutput/ItemConfigEquipment.json'),
		relics: new LazyData<ItemConfig>('ExcelOutput/ItemConfigRelic.json'),
		profile_pics: new LazyData<ItemConfig>('ExcelOutput/ItemPlayerCard.json'),
	}
	static readonly itemSources = new LazyData<ItemSourceData>('ExcelOutput/ItemComefrom.json')
	static readonly passStickerData = new LazyData<Dictionary<InternalPassSticker>>('ExcelOutput/PasterConfig.json')
	static readonly itemPurpose = new LazyData<Dictionary<InternalItemPurpose>>('ExcelOutput/ItemPurpose.json')
	static readonly passPages = new LazyData<Dictionary<InternalPassPage>>('ExcelOutput/TravelBrochureConfig.json')
	static readonly recipeData: LazyData<InternalRecipeConfig> = new LazyData<InternalRecipeConfig>('ExcelOutput/ItemComposeConfig.json')
	static readonly sortData = sortData
	
	static readonly rarityMap: Record<ItemRarity, number> = {
		SuperRare: 	5,
		VeryRare: 	4,
		Rare: 		3,
		NotNormal: 	2,
		Normal: 	1,
	}
	
	id: number
	type: ItemMainType
	subtype: ItemSubType
	name: string
	name_hash: number
	effect: string
	desc: string
	bg_desc: string
	rarity: number
	visible: boolean
	icon_path: string
	icon_path_small: string
	purpose_id?: number
	inventory_tab?: InventoryTab
	inventory_tab_tag?: number
	group_id?: number
	
	constructor(public data: InternalItem) {
		this.name = textMap.getText(data.ItemName)
		this.name_hash = data.ItemName?.Hash
		this.id = data.ID
		this.effect = HAS_EFFECT.includes(data.ItemSubType) ? textMap.getText(data.ItemDesc) : ''
		this.type = data.ItemMainType
		this.subtype = data.ItemSubType
		this.group_id = data.ItemGroup
		
		const desc = textMap.getText(data.ItemDesc)
		if (!HAS_EFFECT.includes(data.ItemSubType) && data.ItemSubType != 'HeadIcon' && desc) {
			this.desc = desc.trim()
			this.bg_desc = textMap.getText(data.ItemBGDesc).trim()
		} else {
			const bgDesc = textMap.getText(data.ItemBGDesc)
			const descSplit = bgDesc.match(/(.+)\n\n(.+)/s)
			this.desc = descSplit ? descSplit[1] : (this.subtype == 'TravelBrochurePaster' ? '' : bgDesc)
			this.bg_desc = descSplit ? descSplit[2] : (this.subtype == 'TravelBrochurePaster' ? bgDesc : '')
		}
		
		this.rarity = Item.rarityMap[data.Rarity] ?? 0
		this.icon_path = data.ItemFigureIconPath
		this.icon_path_small = data.ItemIconPath
		this.purpose_id = data.PurposeType
		this.visible = data.isVisible ?? false
		this.inventory_tab_tag = data.InventoryDisplayTag
		this.inventory_tab = this.getInventoryTab()
	}

	get pagetitle(): string {
		return wikiTitle(this.name, 'item', this.id)
	}
	
	async getSources(): Promise<string[]> {
		let sources: string[] = []
		
		if (this.subtype == 'HeadIcon') {
			return [textMap.getText(this.data.ItemDesc)]
		}
		
		if (this.subtype == 'TravelBrochurePaster') {
			const stickerData = (await Item.passStickerData.get())[this.id]
			if (stickerData) {
				sources.push(textMap.getText(stickerData.PasterUnlockDesc).trim())
			}
		}
		
		const comeFrom = (await Item.itemSources.get())[this.id]
		if (comeFrom) {
			const cfList = Object.values(comeFrom).sort((entry0, entry1) => entry0.Sort - entry1.Sort)
			sources.push(...cfList.map(from => textMap.getText(from.Desc)))
		}

		sources = sources.filter((v, i, a) => !a.includes(v, i + 1))
		
		return sources
	}
	
	static typeCategoryMap: Partial<Record<ItemSubType, string>> = {
		AvatarCard: 'Character',
		AetherSkill: 'Expansion Chip',
		AetherSpirit: 'Aether Spirit',
		Book: 'Readable',
		ChatBubble: 'Chat Box',
		ChessRogueDiceSurface: 'Dice Face',
		Eidolon: 'Eidolon Activation Material',
		Food: 'Consumable',
		Formula: 'Formula',
		// Gift: '', // existing items of this type do not have a type on the wiki
		// ForceOpitonalGift: '',
		HeadIcon: 'Profile Picture',
		// Material: '', // very general category
		Mission: 'Mission Item',
		PhoneTheme: 'Phone Wallpaper',
		MusicAlbum: 'Disk',
		TravelBrochurePaster: 'Dreamscape Pass Sticker'
	}
	
	async getTypes(): Promise<string[]> {
		let types: string[] = []
		
		const displayST = Item.typeCategoryMap[this.subtype]
		if (displayST) {
			types.push(displayST)
		}
		
		const purpose = this.purpose_id && (await Item.itemPurpose.get())[this.purpose_id]
		if (purpose) {
			types.push(
				...textMap.getText(purpose.PurposeText)
					.split('\n')
					.map(str => titleCase(str).trim().replace(/s$/, ''))
			)
		}
		
		if (this.subtype == 'TravelBrochurePaster') {
			const stickerData = (await Item.passStickerData.get())[this.id]
			if (stickerData) {
				const brochure = (await Item.passPages.get())[stickerData.TravelBrochureID[0]]
				if (brochure) {
					types.push(`${textMap.getText(brochure.DirectoryName)} Stickers`)
				}
			}
		}
		
		types = types.filter((v, i, a) => !a.includes(v, i + 1))
		
		return types
	}
	
	static fromId(id: number | string): Item | undefined {
		for (const data of Object.values(this.itemData)) {
			const itemDat = Object.values(data.data ?? {})?.find(item => item.ID == id)
			if (itemDat) {
				return new this(itemDat)
			}
		}
	}
	
	static findRaw(comparator: (item: InternalItem) => boolean): Item | undefined {
		for (const data of Object.values(this.itemData)) {
			if (data.data) {
				for (const item of Object.values(data.data)) {
					if (comparator(item)) {
						return new this(item)
					}
				}
			}
		}
	}

	static find(comparator: (item: Item) => boolean): Item | undefined {
		for (const data of Object.values(this.itemData)) {
			if (data.data) {
				for (const itemData of Object.values(data.data)) {
					const item = new this(itemData)
					if (comparator(item)) {
						return item
					}
				}
			}
		}
	}
	
	static async loadFrom(...keys: (keyof typeof this.itemData)[]): Promise<void> {
		for (const key of keys) {
			await this.itemData[key].get()
		}
	}
	
	static async loadAll(): Promise<void> {
		await this.loadFrom(...Object.keys(this.itemData) as (keyof typeof this.itemData)[])
	}
	
	static listAllLoaded(): Item[] {
		return Object.values(this.itemData)
			.filter(data => data.isLoaded())
			.map(data => 
				Object.values(data.data!).map(itemData => new Item(itemData)
			))
			.flat()
	}
	
	async getImage() {
		if (this.subtype == 'TravelBrochurePaster') {
			const stickerData = (await Item.passStickerData.get())[this.id]
			if (stickerData?.Type == 'Text') {
				return 'Dreamscape Pass Sticker Text.png'
			} else {
				return `Dreamscape Pass Sticker ${sanitizeString(this.name)}.png`
			}
		}
		
		return `Item ${sanitizeString(this.name)}.png`
	}
	
	getInventoryTab(): InventoryTab | undefined {
		if (!this.visible) return undefined
		switch (this.subtype) {
			case 'Material':
				switch (this.inventory_tab_tag) {
					case 1: return 'Upgrade Materials'
					case 2: return 'Other Materials'
					case 3: return 'Valuables'
					default: return
				}
			
			case 'Virtual':
				return 'Upgrade Materials'

			case 'Equipment':
				return 'Light Cone'

			case 'Mission':
				return 'Missions'

			case 'Food':
			case 'Formula':
				return 'Consumables'
			
			case 'Gift':
			case 'MusicAlbum':
				return 'Valuables'
			
			case 'Relic':
				return 'Relics'
		}
	}
	
	async getRecipe(): Promise<ItemList | null> {
		const recipeData = await Item.recipeData.get()
		
		for (const recipe of Object.values(recipeData)) {
			if (recipe.ItemID == this.id) {
				return new ItemList(recipe.MaterialCost)
			}
		}
		
		return null
	}
}

export interface ItemListEntry {
	item: Item
	count: number
}

const MISSION_COMMON = [COMMON_ITEMS.STELLAR_JADE, COMMON_ITEMS.CREDIT, COMMON_ITEMS.TRAILBLAZE_EXP]
const rewardData = await getFile<Dictionary<InternalRewardData>>('ExcelOutput/RewardData.json')
const FULL_DISPLAY_TYPES: (ItemSubType | ItemMainType)[] = [
	'HeadIcon', 'Book', 'ChatBubble', 'Equipment',
	'AetherSkill', 'AetherSpirit', 'ChessRogueDiceSurface',
	'Formula', 'PhoneTheme', 'MusicAlbum'
]

export class ItemList {
	static readonly rewardData = rewardData
	
	data: ItemListEntry[] = []
	trailblaze_exp: number = 0
	stellar_jade: number = 0
	credits: number = 0
	
	constructor(data?: (ItemReference | ItemListEntry)[]) {
		if (data) {
			for (const entry of data) {
				this.add(entry)
			}
		}
	}
	
	get length() {
		return this.data.length
	}
	
	add(entry: ItemReference | ItemListEntry) {
		const item = 'item' in entry ? entry.item : Item.fromId(entry.ItemID)
		if (!item) {
			console.warn('Got unknown item in list entry:', entry)
			return
		}
		if (item.subtype == 'MuseumStuff' || item.subtype == 'MuseumExhibit') return
		const count = 'count' in entry ? entry.count : entry.ItemNum ?? 1
		this.data.push({ item, count })

		switch (item.id) {
			case COMMON_ITEMS.TRAILBLAZE_EXP:
				this.trailblaze_exp += count
				break

			case COMMON_ITEMS.CREDIT:
				this.credits += count
				break

			case COMMON_ITEMS.STELLAR_JADE:
				this.stellar_jade += count
				break
		}
	}
	
	sortRarityId(): ItemListEntry[] {
		const addBefore = this.data.filter(({item}) => sortData[item.id] && sortData[item.id]?.SortID <= this.data.length)
			.sort(({item: item1}, {item: item2}) => sortData[item1.id].SortID - sortData[item2.id].SortID)
			
		const addAfter = this.data.filter(item => sortData[item.item.id] && sortData[item.item.id]?.SortID > this.data.length)
			.sort(({item: item1}, {item: item2}) => sortData[item1.id].SortID - sortData[item2.id].SortID)
		
		const defaultSorted = this.data
			.filter(({item}) => !sortData[item.id])
			.sort((data, data2) => (data.item.id + (data.item.rarity * -10000000)) - (data2.item.id + (data2.item.rarity * -10000000)))
		
		return [...addBefore, ...defaultSorted, ...addAfter]
	}
	
	asCardListParams(removeCommon?: boolean): string {
		let adding = this.sortRarityId()
		if (removeCommon) adding = adding.filter(entry => !MISSION_COMMON.includes(entry.item.id))

		const delim = '; '//adding.some(entry => entry.item.name.includes(',')) ? ';' : ','
		const addList = adding.map(entry => `${entry.item.pagetitle}*${entry.count.toLocaleString()}` + (
			entry.item.subtype.includes('Relic') ? ` { rarity = ${entry.item.rarity} }`
			: (FULL_DISPLAY_TYPES.includes(entry.item.type) || FULL_DISPLAY_TYPES.includes(entry.item.subtype)) ? ` { text = ${entry.item.name} }`
			: ''
		)
		).join(delim)
		
		return addList
	}
	
	asCardList(removeCommon?: boolean, mini?: boolean) {
		const addList = this.asCardListParams(removeCommon)
		
		return `{{Card List|${(addList.includes('=') ? '1=' : '') + addList}${mini ? '|mini=1' : ''}}}`
	}
	
	asItemList(removeCommon?: boolean, mode: 'bullet' | 'br' | 'sent' = 'sent') {
		let adding = this.sortRarityId()
		if (removeCommon) adding = adding.filter(entry => !MISSION_COMMON.includes(entry.item.id))
		
		const addList = adding.map(entry => `${entry.item.pagetitle}*${entry.count}`).join('; ')

		return `{{Item List|${(addList.includes('=') ? '1=' : '') + addList}|mode=${mode}}}`
	}
	
	asBasicList(delim: string = '; ', link?: boolean) {
		return this.sortRarityId().map(entry => (link ? wikiTitleLink : wikiTitle)(entry.item.name, 'item', entry.item.id)).join(delim)
	}
	
	static fromRewardId(id: string | number) {
		const list = new this()
		
		if (!rewardData[id]) {
			if (id) console.warn(`Could not find reward ID ${id}`)
			return list
		}
		
		const reward = rewardData[id]
		
		if (reward.Hcoin) {
			list.add({ ItemID: 1, ItemNum: reward.Hcoin })
		}
		
		for (let i = 1; reward[`ItemID_${i}`]; i++) {
			list.add({ ItemID: reward[`ItemID_${i}`], ItemNum: reward[`Count_${i}`] })
		}
		
		return list
	}
}