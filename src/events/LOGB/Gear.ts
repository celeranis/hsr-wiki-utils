import { AttackType, Dictionary, Value } from '../../Shared.js'
import { HashReference, textMap, typeDisplayName } from '../../TextMap.js'
import { getFile } from '../../files/GameFile.js'

export interface InternalGBBGearCollection {
	ID: number
	Name: HashReference
	Type?: undefined | 'Plugin' | 'Forge'
	LvMax: number
	ItemIcon: string
	ElementList: AttackType[]
	TagList: number[]
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

export type GBBTag = 'Summon' | 'AoE' | 'Focus' | 'Launch'

const gearCollection = await getFile<Dictionary<InternalGBBGearCollection>>('ExcelOutput/EvolveBuildGearCollection.json')
const gearConfig = await getFile<Dictionary<Dictionary<InternalGBBGearConfig>>>('ExcelOutput/EvolveBuildGearConfig.json')
const mazeBuffs = await getFile<Dictionary<Dictionary<InternalGBBBuff>>>('ExcelOutput/EvolveBuildMazeBuff.json')
const recipeData = await getFile<Dictionary<InternalGBBForge>>('ExcelOutput/EvolveBuildForgeMaterial.json')

export const TAGS: Record<number, GBBTag> = {
	1: 'Summon',
	2: 'AoE',
	3: 'Focus',
	4: 'Launch',
}

export class GBBGear {
	id: number
	name: string
	max_level: number
	tags: GBBTag[]
	elements: string[]
	type: 'Accessory' | 'Weapon' | 'Legendary Weapon'
	overview_desc!: string
	level_descs: string[]
	
	constructor(id: number | string) {
		const collectionData = gearCollection[id]
		const configData = gearConfig[id]
		
		this.id = collectionData.ID
		this.name = textMap.getText(collectionData.Name)
		this.max_level = collectionData.LvMax
		this.tags = collectionData.TagList.map(tag => TAGS[tag])
		this.elements = collectionData.ElementList.map(type => typeDisplayName(type))
		this.type = collectionData.Type == 'Forge' ? 'Legendary Weapon' : collectionData.Type == 'Plugin' ? 'Accessory' : 'Weapon'
		
		this.level_descs = []
		let firstParams: number[] = []
		let finalParams: number[] = []
		let prevParams: number[] = []
		for (const config of Object.values(configData)) {
			const buff = mazeBuffs[config.MazeBuffID][config.Level]
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
				if (this.type != 'Legendary Weapon') {
					let mergedSummaryParams: ([number, number] | number)[] = firstParams.map((val, index) => index < 10 ? [val, finalParams[index]] : 0)
					this.overview_desc = textMap.getText(buff.BuffDesc, mergedSummaryParams)
				} else {
					this.overview_desc = textMap.getText(buff.BuffDesc, buff.ParamList)
				}
			}
		}
	}
	
	get icon_type() {
		return this.type == 'Accessory' ? this.type : 'Weapon'
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