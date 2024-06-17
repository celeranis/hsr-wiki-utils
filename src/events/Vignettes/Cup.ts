import { Dictionary } from '../../Shared.js'
import { HashReference, textMap } from '../../TextMap.js'
import { getFile } from '../../files/GameFile.js'
import { VignetteTag } from './Tag.js'

export type CupType = 'SmallCup' | 'MediumCup' | 'LargeCup'

export interface InternalVignetteCup {
	CupID: number
	CupName: HashReference
	Type: CupType
	Capacity: number
	IconPath: string
	AudioEvent: string
	IceCount: number[]
	PerLayerHeight: number[]
	IncludeTagList: number[]
}

const data = await getFile<Dictionary<InternalVignetteCup>>('ExcelOutput/DrinkMakerCupData.json')

export class VignetteCup {
	id: number
	name: string
	type: CupType
	capacity: number
	icon: string
	sound: string
	tags: VignetteTag[]
	
	static cache: Record<string, VignetteCup> = {}
	
	constructor(data: InternalVignetteCup) {
		this.id = data.CupID
		this.name = textMap.getText(data.CupName)
		this.type = data.Type
		this.capacity = data.Capacity
		this.icon = data.IconPath
		this.sound = data.AudioEvent
		this.tags = data.IncludeTagList.map(tag => VignetteTag.fromId(tag))
		
		VignetteCup.cache[this.id] = this
	}
	
	static fromId(id: string | number) {
		return this.cache[id] ?? new this(data[id])
	}
	
	toString() {
		return this.name
	}
	
	asItem() {
		return `{{Item|${this.name}|type=Glass}}`
	}

	static all() {
		return Object.values(data).map(data => this.fromId(data.CupID))
	}
}