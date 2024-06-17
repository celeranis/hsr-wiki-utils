import { Dictionary } from '../../Shared.js'
import { HashReference, textMap } from '../../TextMap.js'
import { getFile } from '../../files/GameFile.js'

export type TagSourceType = 'Ingredient' | 'Cup' | 'Layer' | 'Decoration' | 'Ice' | 'Mix'

export interface InternalVignetteTag {
	TagID: number
	TagName: HashReference
	Type: 'Taste'
	Priority: number
	SourceType: TagSourceType
	MixType?: 'Mix'
	MixParam?: number[]
	IsShow?: boolean
}

export interface InternalVignetteQuantifyTag {
	TagID: number
	Type: 'Sweetness' | 'Acidity' | 'Texture'
	Value?: number
}

const data = await getFile<Dictionary<InternalVignetteTag>>('ExcelOutput/DrinkMakerTagData.json')
const quantifyData = await getFile<Dictionary<InternalVignetteQuantifyTag>>('ExcelOutput/DrinkMakerQuantifyTag.json')

export class VignetteTag {
	id: number
	name: string
	type: TagSourceType
	
	stat?: 'Sweetness' | 'Intensity' | 'Thickness'
	stat_value?: number

	static cache: Record<string, VignetteTag> = {}

	constructor(data: InternalVignetteTag) {
		this.id = data.TagID
		this.name = textMap.getText(data.TagName)
		this.type = data.SourceType
		
		const qdata = quantifyData[this.id]
		if (qdata) {
			this.stat = qdata.Type == 'Acidity' ? 'Intensity' : qdata.Type == 'Texture' ? 'Thickness' : qdata.Type
			this.stat_value = qdata.Value ?? 0
		}

		VignetteTag.cache[this.id] = this
	}

	static fromId(id: string | number) {
		return this.cache[id] ?? new this(data[id])
	}

	toString() {
		if (this.stat) {
			return `${this.name} ({{Icon|${this.stat}|20}} ${this.stat} ${this.stat_value! >= 0 ? ('+' + this.stat_value) : this.stat_value})`
		}
		return this.name
	}
}