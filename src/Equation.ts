import { Blessing } from './Blessing.js'
import { Dictionary } from './Shared.js'
import { textMap } from './TextMap.js'
import { InternalEquationData, InternalEquationDisplay, InternalExtraEffect } from './files/Equation.js'
import { getFile } from './files/GameFile.js'
import { Template } from './util/Template.js'

const EquationData = await getFile<Dictionary<InternalEquationData>>('ExcelOutput/RogueTournFormula.json')
const EquationDisplayData = await getFile<Dictionary<InternalEquationDisplay>>('ExcelOutput/RogueTournFormulaDisplay.json')
const ExtraEffectData = await getFile<Dictionary<InternalExtraEffect>>('ExcelOutput/ExtraEffectConfig.json')

export const override: Dictionary<string> = {
	Spore: 'Spores',
	'Spore(s)': 'Spores'
}

export class Equation {
	mode: 'Tourn1'
	path1: string
	path1count: number
	path2?: string
	path2count?: number
	rarity: '1' | '2' | '3' | 'boundary'
	buff_id: number
	display_id: number
	in_handbook: boolean
	story_json: string
	unlock_display: number
	
	traits: number[]
	
	story: string
	
	name: string
	description: string
	simple_description: string
	
	sortkey: number
	
	constructor(public id: number) {
		const data = Object.values(EquationData).find(dat => dat.FormulaID == id)!
		this.mode = data.TournMode
		this.rarity = data.FormulaCategory == 'PathEcho' ? 'boundary' : data.FormulaCategory == 'Rare' ? '1' : data.FormulaCategory == 'Epic' ? '2' : '3'
		this.buff_id = data.MazeBuffID
		this.display_id = data.FormulaDisplayID
		this.in_handbook = data.IsInHandbook
		this.story_json = data.FormulaStoryJson
		this.unlock_display = data.UnlockDisplayID

		this.path1 = Blessing.getPath(data.MainBuffTypeID)
		this.path1count = data.MainBuffNum
		
		if (data.SubBuffTypeID) {
			this.path2 = Blessing.getPath(data.SubBuffTypeID)
			this.path2count = data.SubBuffNum
		}
		
		const displayData = Object.values(EquationDisplayData).find(dat => dat.FormulaDisplayID == data.FormulaDisplayID)!
		this.story = textMap.getText(displayData.FormulaStory)
		this.traits = displayData.ExtraEffect
		
		const buffData = Object.values(Blessing.buff_data).find(buff => buff.ID == this.buff_id)!
		this.name = textMap.getText(buffData.BuffName)
		this.description = textMap.getText(buffData.BuffDesc, buffData.ParamList)
			.replaceAll(/<u>(.+?)<\/u>/gi, (_, trait) => override[trait] ? `{{Trait|${override[trait]}|${trait}}}` : `{{Trait|${trait}}}`)
		this.simple_description = textMap.getText(buffData.BuffSimpleDesc, buffData.ParamList)
		
		this.sortkey = (data.MainBuffTypeID * 100) + (data.SubBuffTypeID ?? 0)
	}
	
	static getExtraEffect(id: number) {
		return Object.values(ExtraEffectData).find(eff => eff.ExtraEffectID == id)
	}
	
	static loadAll() {
		return Object.values(EquationData).map(id => new this(Number(id.FormulaID)))
			.sort((a, b) => (a.sortkey - b.sortkey))
	}
	
	entry() {
		const template = new Template('Equation')
			.addParam('name', this.name)
			.addParam('rarity', this.rarity)
			.addParam('path1', `${this.path1}*${this.path1count}`)
		
		if (this.path2) {
			template.addParam('path2', `${this.path2}*${this.path2count}`)
		}
		
		template
			.addParam('effect', this.description.replaceAll('\n', '<br />'))
			.addParam('story', this.story.replaceAll('\n', '<br />'))
		
		return template.block(7)
	}
}