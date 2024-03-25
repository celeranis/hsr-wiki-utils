import { Dictionary, sanitizeString, titleCase } from './Shared.js';
import { textMap } from './TextMap.js';
import { LazyData } from './files/GameFile.js';
import { InternalItemComefrom, InternalItemPurpose, InternalPassPage, InternalPassSticker, type InternalItem, type ItemMainType, type ItemRarity, type ItemSubType } from './files/Item.js';

type ItemData = Dictionary<InternalItem>
type ItemSourceData = Dictionary<Dictionary<InternalItemComefrom>>

export type InventoryTab = 'Upgrade Materials' | 'Light Cone' | 'Missions' 
	| 'Consumables' | 'Valuables' | 'Relics' | 'Other Materials'

export class Item {
	static readonly itemData = {
		main: new LazyData<ItemData>('ExcelOutput/ItemConfig.json'),
		characters: new LazyData<ItemData>('ExcelOutput/ItemConfigAvatar.json'),
		character_default_pfps: new LazyData<ItemData>('ExcelOutput/ItemConfigAvatarPlayerIcon.json'),
		eidolons: new LazyData<ItemData>('ExcelOutput/ItemConfigAvatarRank.json'),
		skins: new LazyData<ItemData>('ExcelOutput/ItemConfigAvatarSkin.json'),
		readables: new LazyData<ItemData>('ExcelOutput/ItemConfigBook.json'),
		disks: new LazyData<ItemData>('ExcelOutput/ItemConfigDisk.json'),
		light_cones: new LazyData<ItemData>('ExcelOutput/ItemConfigEquipment.json'),
		relics: new LazyData<ItemData>('ExcelOutput/ItemConfigRelic.json'),
	}
	static readonly itemSources = new LazyData<ItemSourceData>('ExcelOutput/ItemComefrom.json')
	static readonly passStickerData = new LazyData<Dictionary<InternalPassSticker>>('ExcelOutput/PasterConfig.json')
	static readonly itemPurpose = new LazyData<Dictionary<InternalItemPurpose>>('ExcelOutput/ItemPurpose.json')
	static readonly passPages = new LazyData<Dictionary<InternalPassPage>>('ExcelOutput/TravelBrochureConfig.json')
	
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
	
	constructor(public data: InternalItem) {
		this.name = textMap.getText(data.ItemName)
		this.name_hash = data.ItemName.Hash
		this.id = data.ID
		this.effect = textMap.getText(data.ItemDesc)
		this.type = data.ItemMainType
		this.subtype = data.ItemSubType
		
		const bgDesc = textMap.getText(data.ItemBGDesc)
		const descSplit = bgDesc.match(/(.+)\n\n(.+)/s)
		this.desc = descSplit ? descSplit[1] : (this.subtype == 'TravelBrochurePaster' ? '' : bgDesc)
		this.bg_desc = descSplit ? descSplit[2] : (this.subtype == 'TravelBrochurePaster' ? bgDesc : '')
		
		this.rarity = Item.rarityMap[data.Rarity] ?? 0
		this.icon_path = data.ItemFigureIconPath
		this.icon_path_small = data.ItemIconPath
		this.purpose_id = data.PurposeType
		this.visible = data.isVisible ?? false
		this.inventory_tab_tag = data.InventoryDisplayTag
		this.inventory_tab = this.getInventoryTab()
	}
	
	async getSources(): Promise<string[]> {
		let sources: string[] = []
		
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
			if (data.data?.[id]) {
				return new this(data.data?.[id])
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
}