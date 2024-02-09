import { Dictionary } from './Shared.js';
import { textMap } from './TextMap.js';
import { LazyData } from './files/GameFile.js';
import type { InternalItem, ItemMainType, ItemRarity, ItemSubType } from './files/Item.js';

type ItemData = Dictionary<InternalItem>

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
		relics: new LazyData<ItemData>('ExcelOutput/ItemConfigRelics.json'),
	}
	
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
	desc: string
	bg_desc: string
	rarity: number
	visible?: boolean
	icon_path: string
	
	constructor(public data: InternalItem) {
		this.name = textMap.getText(data.ItemName)
		this.id = data.ID
		this.desc = textMap.getText(data.ItemDesc)
		this.bg_desc = textMap.getText(data.ItemBGDesc)
		this.type = data.ItemMainType
		this.subtype = data.ItemSubType
		this.rarity = Item.rarityMap[data.Rarity] ?? 0
		this.icon_path = data.ItemFigureIconPath
	}
}