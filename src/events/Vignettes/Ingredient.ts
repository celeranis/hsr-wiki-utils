import { Dictionary } from '../../Shared.js'
import { HashReference, textMap } from '../../TextMap.js'
import { getFile } from '../../files/GameFile.js'
import { VignetteTag } from './Tag.js'

export interface InternalVignetteIngredient {
	ID: number
	IngredientName: HashReference
	IngredientDesc: HashReference
	IconPath: string
	SmallIconPath: string
	IncludeTagList: number[]
}

export interface InternalVignetteIce {
	ID: number
	IceName: HashReference
	IconPath: string
	IncludeTagList: number[]
}

export interface InternalVignetteDeco {
	DecorationID: number
	DecorationName: HashReference
	IconPath: string
	IncludeTagList: number[]
}

const ingredientData = await getFile<Dictionary<InternalVignetteIngredient>>('ExcelOutput/DrinkMakerIngredientData.json')
const iceData = await getFile<Dictionary<InternalVignetteIce>>('ExcelOutput/DrinkMakerIceData.json')
const decoData = await getFile<Dictionary<InternalVignetteDeco>>('ExcelOutput/DrinkMakerDecorationData.json')

export type IngredientType = 'Ingredient' | 'Garnish' | 'Ice'

export class VignetteIngredient {
	id: number
	name: string
	description?: string
	type: IngredientType
	icon: string
	tags: VignetteTag[]

	static cache: Record<IngredientType, Dictionary<VignetteIngredient>> = {Garnish: {}, Ice: {}, Ingredient: {}}

	constructor(id: number, name: HashReference, type: IngredientType, data: InternalVignetteIngredient | InternalVignetteIce | InternalVignetteDeco) {
		this.id = id
		this.name = textMap.getText(name)
		this.icon = data.IconPath
		this.description = 'IngredientDesc' in data ? textMap.getText(data.IngredientDesc) : undefined
		this.type = type
		this.tags = data.IncludeTagList.map(tag => VignetteTag.fromId(tag))

		VignetteIngredient.cache[type][this.id] = this
	}

	static fromId(id: string | number): VignetteIngredient | undefined {
		if (id == undefined) return undefined
		const data = ingredientData[id]
		return this.cache[id] ?? new this(data.ID, data.IngredientName, 'Ingredient', data)
	}

	toString() {
		return this.name
	}

	asItem(x?: number) {
		return `{{Item|${this.name}|type=${this.type == 'Ice' ? 'Ingredient' : this.type}${x ? `|x=${x}` : ''}}}`
	}

	static all() {
		return Object.values(ingredientData).map(data => this.fromId(data.ID)) as VignetteIngredient[]
	}
}

export class VignetteIce extends VignetteIngredient {
	static fromId(id: string | number): VignetteIce | undefined {
		if (id == undefined) return undefined
		const data = iceData[id]
		return this.cache[id] ?? new this(data.ID, data.IceName, 'Ice', data)
	}

	static all() {
		return Object.values(iceData).map(data => this.fromId(data.ID)) as VignetteIce[]
	}
}

export class VignetteDecoration extends VignetteIngredient {
	static fromId(id: string | number): VignetteDecoration | undefined {
		if (id == undefined) return undefined
		const data = decoData[id]
		return this.cache[id] ?? new this(data.DecorationID, data.DecorationName, 'Garnish', data)
	}

	static all() {
		return Object.values(decoData).map(data => this.fromId(data.DecorationID)) as VignetteDecoration[]
	}
}