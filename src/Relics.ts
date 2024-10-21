import { getExcelFile, getFile } from './files/GameFile.js'
import { InternalRelicData, InternalRelicItem, InternalRelicSet, InternalRelicSetBonus, RelicSlot } from './files/Relic.js'
import { Item } from './Item.js'
import { Dictionary } from './Shared.js'
import { HashReference, textMap } from './TextMap.js'

export const RelicSetConfig = await getExcelFile<InternalRelicSet>('ExcelOutput/RelicSetConfig.json', 'SetID')
export const RelicSetSkillConfig = await getFile<InternalRelicSetBonus[] | Dictionary<Dictionary<InternalRelicSetBonus>>>('ExcelOutput/RelicSetSkillConfig.json')
export const RelicConfig = await getExcelFile<InternalRelicItem>('ExcelOutput/RelicConfig.json', 'ID')
let RelicDataInfo = await getFile<InternalRelicData[]>('ExcelOutput/RelicDataInfo.json')

if (!Array.isArray(RelicDataInfo)) {
	RelicDataInfo = Object.values(RelicDataInfo as Dictionary<Dictionary<InternalRelicData>>).map(members => Object.values(members)).flat(2)
}

export const RELIC_SLOTS: Record<RelicSlot, string> = Object.fromEntries(
	Object.values((await getFile('ExcelOutput/RelicBaseType.json')))
		.map(slot => [slot.Type, textMap.getText(slot.BaseTypeText)])
)

export class RelicSet {
	id: number
	icon_path: string
	name: string
	name_hash: HashReference
	display_item_id: number
	released: boolean
	is_planar: boolean
	
	bonus2pc?: string
	bonus4pc?: string
	
	constructor(data: InternalRelicSet) {
		this.id = data.SetID
		this.icon_path = data.SetIconFigurePath
		this.name = textMap.getText(data.SetName)
		this.name_hash = data.SetName
		this.display_item_id = data.DisplayItemID
		this.released = data.Release ?? false
		this.is_planar = data.IsPlanarSuit ?? false
		
		let skillData2: InternalRelicSetBonus | undefined
		let skillData4: InternalRelicSetBonus | undefined
		if (Array.isArray(RelicSetSkillConfig)) {
			skillData2 = RelicSetSkillConfig.find(skill => skill.SetID == this.id && skill.RequireNum == 2)
			skillData4 = RelicSetSkillConfig.find(skill => skill.SetID == this.id && skill.RequireNum == 4)
		} else {
			skillData2 = RelicSetSkillConfig[this.id]['2']
			skillData4 = RelicSetSkillConfig[this.id]['4']
		}
		
		if (skillData2) {
			this.bonus2pc = textMap.getText(skillData2.SkillDesc, skillData2.AbilityParamList)
		}
		if (skillData4) {
			this.bonus4pc = textMap.getText(skillData4.SkillDesc, skillData4.AbilityParamList)
		}
	}
	
	static fromId(id: string | number): RelicSet | undefined {
		const data = RelicSetConfig[id]
		if (data) return new this(data)
	}

	static loadAll(): RelicSet[] {
		return Object.values(RelicSetConfig).map(data => new this(data))
	}
	
	get display_item() {
		return Item.fromId(this.display_item_id)
	}
	
	getSetMembers(): Relic[] {
		return RelicDataInfo
			.filter(data => data.SetID == this.id)
			.map(data => new Relic(data))
	}
	
	getSlot(slot: RelicSlot): Relic | undefined {
		const data = RelicDataInfo.find(data => data.SetID == this.id && data.Type == slot)
		if (data) {
			return new Relic(data)
		} else {
			return undefined
		}
	}
}

export class Relic {
	id: number
	set_id: number
	
	name: string
	name_hash: HashReference
	story_intro: string
	story: string
	
	slot: RelicSlot
	slot_display: string
	icon_path: string
	
	constructor(data: InternalRelicData, item: InternalRelicItem = Object.values(RelicConfig).find(relic => relic.Rarity == 'CombatPowerRelicRarity5' && relic.Type == data.Type && relic.SetID == data.SetID)!) {
		if (!item) {
			throw new TypeError(`Could not find matching RelicConfig entry for ${data.Type} of set ${data.SetID}`)
		}
		
		this.id = item.ID
		this.set_id = data.SetID
		
		this.name = textMap.getText(data.RelicName)
		this.name_hash = data.RelicName
		this.story_intro = textMap.getText(data.ItemBGDesc)
		this.story = textMap.getText(data.BGStoryContent)
		
		this.slot = data.Type
		this.slot_display = RELIC_SLOTS[data.Type]
		this.icon_path = data.ItemFigureIconPath
	}

	get display_item() {
		return Item.fromId(this.id)
	}
	
	static fromSetSlot(set_id: number | string, slot: RelicSlot): Relic | undefined {
		const data = RelicDataInfo.find(data => data.SetID == set_id && data.Type == slot)
		if (data) return new this(data)
	}

	static fromId(id: string | number) {
		const item = RelicConfig[id]
		if (!item) return undefined

		const data = RelicDataInfo.find(data => data.SetID == item.SetID && data.Type == item.Type)
		if (data) return new this(data, item)
	}
}