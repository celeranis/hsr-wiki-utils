import { AttackType, Dictionary, Value } from '../../Shared.js'
import { HashReference, textMap, typeDisplayName } from '../../TextMap.js'
import { Unlock } from '../../Unlock.js'
import { getExcelFile, getFile } from '../../files/GameFile.js'

export type InternalGBBGearType = undefined | 'Plugin' | 'Forge' | 'DuelForge' | 'UltraForge'

export interface InternalGBBGearCollection {
	ID: number
	Name: HashReference
	Type?: InternalGBBGearType
	LvMax: number
	UnlockQuest?: number
	ItemIcon: string
	ElementList: AttackType[]
	TagList: number[]
	Season: string
	DamageTag: string
}

export interface InternalGBBGearConfig {
	GearID: number
	IndexList: number[]
	SimpIndexList: number[]
	DynamicIndexList: number[]
	Level: number
	MazeBuffID: number
}

export interface InternalGBBBuff {
	ID: number
	BuffSeries: number
	BuffRarity: number
	Lv: number
	LvMax: number
	ModifierName: string
	InBattleBindingKey: string
	ParamList: Value<number>[]
	BuffIcon: string
	BuffName: HashReference
	BuffDesc: HashReference
	BuffSimpleDesc: HashReference
	BuffDescBattle: HashReference
	BuffEffect: string
	MazeBuffType: string
	MazeBuffIconType: string
}

export interface InternalGBBForge {
	ForgeGearID: number
	MaterialGearList: Dictionary<string, number>
	CostGearList: number[]
}

export interface InternalGBBTag {
	ID: number
	Season: 'SecondChapter'
	Name: HashReference
	ExtraEffectID: number
	ShopSkillID: number
	IconPath: string
}

export interface InternalGBBGearTypeData {
	ID: InternalGBBGearType
	Season: string
	FontColor: string
	WeaponToastEffectBg: string
	MixDetailPropsInfoBg: string
	TypeImg: string
	TypeImgColor: string
	Name: string | HashReference
}

const gearCollection = await getExcelFile<InternalGBBGearCollection>('EvoBdSCGearCollection.json', 'ID')
const gearConfig = await getFile<InternalGBBGearConfig[]>('ExcelOutput/EvoBdSCGearConfig.json')
const mazeBuffs = await getFile<InternalGBBBuff[]>('ExcelOutput/EvoBdSCMazeBuff.json')
const recipeData = await getExcelFile<InternalGBBForge>('EvoBdSCForgeMaterial.json', 'ForgeGearID')
const tagData = await getExcelFile<InternalGBBTag>('EvoBdSCTagConfig.json', 'ID')
const gearTypeData = await getExcelFile<InternalGBBGearTypeData>('EvoBdSCGearTypeConfig.json', 'ID')

export const TAGS: Record<number, string> = Object.fromEntries(Object.entries(tagData).map(([id, data]) => [id, textMap.getText(data.Name)]))

export class GBBGear {
	id: number
	name: string
	max_level: number
	tags: string[]
	elements: string[]
	type: InternalGBBGearType
	type_display: string
	overview_desc!: string
	level_descs: string[]
	
	icon_path: string
	
	unlock_quest_id?: number
	unlock_desc?: string
	
	constructor(id: number | string) {
		const collectionData = gearCollection[id]
		const configData = gearConfig.filter(cfg => cfg.GearID == id)
		
		this.id = collectionData.ID
		this.name = textMap.getText(collectionData.Name)
		this.max_level = collectionData.LvMax
		this.tags = collectionData.TagList.map(tag => TAGS[tag])
		this.elements = collectionData.ElementList.map(type => typeDisplayName(type))
		this.icon_path = collectionData.ItemIcon
		
		this.unlock_quest_id = collectionData.UnlockQuest
		if (this.unlock_quest_id) {
			this.unlock_desc = Unlock.fromQuestId(this.unlock_quest_id)?.desc
		}
		
		this.type = collectionData.Type
		this.type_display = textMap.getText(gearTypeData[collectionData.Type ?? 'undefined'].Name)
		
		this.level_descs = []
		let firstParams: number[] = []
		let finalParams: number[] = []
		let prevParams: number[] = []
		for (const config of Object.values(configData)) {
			const buff = mazeBuffs.find(buff => buff.ID == config.MazeBuffID && buff.Lv == config.Level)!
			let params = buff.ParamList.map(param => param.Value)
			for (let index of config.IndexList) {
				params[index + 9] = prevParams[index - 1] ? (params[index - 1] - prevParams[index - 1]) : 0
			}
			this.level_descs.push(textMap.getText(buff.BuffSimpleDesc, params))
			prevParams = params
			
			if (config.Level == 1) {
				firstParams = params
			}
			if (config.Level == this.max_level) {
				finalParams = params
				if (this.type == undefined || this.type == 'Plugin') {
					let mergedSummaryParams: ([number, number] | number)[] = firstParams.map((val, index) => index < 10 ? [val, finalParams[index]] : 0)
					this.overview_desc = textMap.getText(buff.BuffDesc, mergedSummaryParams)
				} else {
					this.overview_desc = textMap.getText(buff.BuffDesc, buff.ParamList)
				}
			}
		}
	}
	
	get icon_type() {
		return this.type == 'Plugin' ? this.type_display : 'Weapon'
	}
	
	get icon() {
		return `GBB ${this.icon_type} ${this.name}.png`
	}
	
	asItem(level: number) {
		return `{{Item|${this.name}|25|note=Lv. ${level}+|type=GBB ${this.icon_type}|link=#${this.name}}}`
	}
	
	static getAll(): GBBGear[] {
		return Object.keys(gearCollection).map(id => new this(id))
	}
	
	getRecipe() {
		const data = recipeData[this.id]
		return Object.entries(data.MaterialGearList).map(pair => {return {
			gear: new GBBGear(pair[0]),
			level: parseInt(pair[1])
		}})
	}
}