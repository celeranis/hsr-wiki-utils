import { getExcelFile, getFile } from './files/GameFile.js'
import { InternalScepter, InternalScepterDisplay, InternalUnit, InternalUnitDisplay, ScepterEffectType, ScepterLimitRangeType, ScepterStyleType, ScepterUnitSlot } from './files/Scepter.js'
import { InternalFinishWay, InternalUnlockConfig } from './files/Unlock.js'
import { InternalMazeBuff } from './scripts/dump_boss_decay.js'
import { allEqual, percent } from './Shared.js'
import { textMap } from './TextMap.js'
import { uploadPrompt } from './util/General.js'
import { Template } from './util/Template.js'
import { WeirdKey } from './WeirdKey.js'

export const RogueMagicScepter = await getFile<InternalScepter[]>('ExcelOutput/RogueMagicScepter.json')
export const RogueMagicScepterDisplay = await getExcelFile<InternalScepterDisplay>('RogueMagicScepterDisplay.json', 'ScepterID')
export const RogueMagicUnit = await getFile<InternalUnit[]>('ExcelOutput/RogueMagicUnit.json')
export const RogueMagicUnitDisplay = await getExcelFile<InternalUnitDisplay>('RogueMagicUnitDisplay.json', 'MagicUnitID')
export const RogueMagicMazeBuff = await getFile<InternalMazeBuff[]>('ExcelOutput/RogueMagicMazeBuff.json')
export const RogueMagicUnlock = await getExcelFile<InternalUnlockConfig>('RogueMagicUnlock.json', 'RogueUnlockID')
export const RogueMagicFinishWay = await getExcelFile<InternalFinishWay>('RogueMagicFinishWay.json', 'ID')

export const DisplayTypeMap = {
	Break: textMap.getText(12275225068698442916n),
	Dot: textMap.getText(4015019035168065781n),
	Ultimate: textMap.getText(7322083406970019729n),
	Follow: textMap.getText(2102302353411690929n),
	Eject: textMap.getText(11043211720788534633n), // Bounce
	Spread: textMap.getText(12724348429103288765n), // Blast
	AOE: textMap.getText(2507560763235863104n),
	Concentrate: textMap.getText(17566594339531478568n), // Focus
	ActionDelay: textMap.getText(13084984851682207206n), // Speed
	SP: textMap.getText(7306310060620602505n), // Charge
	Common: textMap.getText(96853949381075047n) // General
}

function varTemplate(params: (string | number)[]) {
	return `{{SU Rarity Vars|${params.join('|')}}}`
}

export class Scepter {
	id: number
	active_component_id: number
	active_component: Component
	type: string
	alignment: string
	
	name: string
	description: string
	story: string
	image_path: string
	
	terms: number[]
	
	range_type: ScepterLimitRangeType
	effect_types: ScepterEffectType[]
	
	unlock_requirement?: string
	
	constructor(id: number | string) {
		const dataVersions = RogueMagicScepter
			.filter(data => data.ScepterID == id)
			.sort((d1, d2) => d1.ScepterLevel - d2.ScepterLevel)
		const [data1] = dataVersions
		
		this.id = data1.ScepterID

		const displayData = RogueMagicScepterDisplay[this.id]
		this.name = textMap.getText(displayData.ScepterName)
		this.description = textMap.getText(displayData.ScepterTriggerDesc, RogueMagicMazeBuff.find(buff => buff.ID == data1.StaffMazeBuffID)?.ParamList)
		this.story = textMap.getText(displayData.ScepterBGDesc)
		this.image_path = displayData.ScepterFigurePath
		
		this.active_component_id = data1.LockMagicUnit[0][WeirdKey.get('LockMagicUnitId')]
		this.active_component = new Component(this.active_component_id)
		this.terms = this.active_component.terms
		
		this.type = DisplayTypeMap[data1.FuncType]
		this.alignment = DisplayTypeMap[data1.StyleType]
		
		this.range_type = data1.LimitRangeType
		this.effect_types = data1.EffectTypeList
		
		if (data1.UnlockID) {
			const finishWay = RogueMagicFinishWay[RogueMagicUnlock[data1.UnlockID].UnlockFinishWay]
			this.unlock_requirement = textMap.getText(RogueMagicUnlock[data1.UnlockID].RogueUnlockDetail) || (finishWay.FinishType == 'RogueMagicTalentEnable' ? `Expand the [[Simulated Universe: Unknowable Domain/Cognitive Boundary|Cognitive Boundary]] to unlock` : '{{cx}}')
		}
	}

	static loadAll(alignment?: ScepterStyleType) {
		const ids = new Set<number>()

		RogueMagicScepter
			.filter(scepter => !alignment || scepter.StyleType == alignment)
			.forEach(data => ids.add(data.ScepterID))

		return [...ids.values()].map(id => new this(id))
	}
	
	templateEntry(): string {
		const information = new Template('Scepter Information', {
			name: this.name + uploadPrompt(this.image_path, `Scepter ${this.name}.png`, 'Scepter Icons'),
			type: this.type || '',
			unlock: this.unlock_requirement || '',
			effect: this.description.replaceAll('\n', '<br />') + '\n----\n' + this.active_component.descriptionWikitext(),
			story: this.story.replaceAll('\n', '<br />'),
			notes: '',
			mentions: '',
		})
		return information.block()
	}
}

export class Component {
	id: number
	is_decision: boolean
	is_active: boolean
	slot: ScepterUnitSlot
	type?: string
	alignment?: string
	
	name?: string
	icon_path: string
	
	descriptions: string[]
	simple_descriptions: string[]
1
	range_types: ScepterLimitRangeType[]
	effect_types: ScepterEffectType[]
	unlock_requirement?: string
	
	terms: number[]
	
	unified_description?: string
	
	constructor(id: number) {
		const dataVersions = RogueMagicUnit
			.filter(data => data.MagicUnitID == id)
			.sort((d1, d2) => d1.MagicUnitLevel - d2.MagicUnitLevel)
		
		const [data1] = dataVersions
		
		this.id = data1.MagicUnitID

		const displayData = RogueMagicUnitDisplay[this.id]
		this.name = textMap.getText(displayData?.MagicUnitName) || undefined
		this.icon_path = displayData?.MagicUnitIcon
		
		this.is_decision = data1.MagicUnitCategory == 'Ultra'
		this.is_active = data1.MagicUnitType == 'Active'
		this.slot = data1.MagicUnitType
		this.type = data1.FuncType ? DisplayTypeMap[data1.FuncType] : undefined
		this.alignment = data1.StyleType ? DisplayTypeMap[data1.StyleType] : undefined
		
		const buffParams: number[][] = []
		
		this.descriptions = dataVersions.map(data => {
			const buff = RogueMagicMazeBuff.find(buff => buff.ID == data.MagicUnitMazeBuffID && buff.Lv == data.MagicUnitLevel)
			
			let desc = textMap.getText(data.MagicUnitDesc, buff?.ParamList)
			if (!this.is_decision) {
				desc = desc.replaceAll('{{Color|h|', `{{Color|rarity${data.MagicUnitLevel + 2}|`)
			}
			
			for (const [i, val] of buff?.ParamList?.entries() ?? []) {
				buffParams[i] ??= []
				buffParams[i][data.MagicUnitLevel - 1] = val.Value
			}
			
			return desc
		})
		
		this.simple_descriptions = dataVersions.map(data => textMap.getText(data.MagicUnitSimpleDesc))
		
		this.range_types = data1.AttachRangeTypeList
		this.effect_types = data1.EffectTypeList
		
		this.terms = data1.ExtraEffectID

		if (data1.UnlockID) {
			const finishWay = RogueMagicFinishWay[RogueMagicUnlock[data1.UnlockID].UnlockFinishWay]
			this.unlock_requirement = textMap.getText(RogueMagicUnlock[data1.UnlockID].RogueUnlockDetail) || (finishWay.FinishType == 'RogueMagicTalentEnable' ? `Expand the [[Simulated Universe: Unknowable Domain/Cognitive Boundary|Cognitive Boundary]] to unlock` : '{{cx}}')
		}
		
		if (dataVersions.length > 1) {
			let useUnified = true
			let lastText: string | undefined = undefined
			for (const data of dataVersions) {
				const desc = textMap.getText(data.MagicUnitDesc)
				if (lastText && lastText != desc) {
					useUnified = false
					break
				}
				lastText = desc
			}

			if (useUnified) {
				let desc = textMap.getText(data1.MagicUnitDesc)

				for (const [i, params] of buffParams.entries()) {
					const n = i + 1

					if (allEqual(params)) {
						const firstParam = params[0]
						desc = desc
							.replaceAll(`#${n}[i]%`, percent(firstParam, 5, false))
							.replaceAll(`#${n}[i]`, firstParam.toLocaleString())
							.replaceAll(`#${n}`, firstParam.toString())
					} else {
						const vars = varTemplate(params.map(param => param.toLocaleString()))
						const varsPercent = varTemplate(params.map(param => percent(param, 5, false)))
						desc = desc
							.replaceAll(new RegExp(`{{Color\\|h\\|(#${n}\\[?i?\\]?%?)}}`, 'g'), '$1')
							.replaceAll(`#${n}[i]%`, varsPercent)
							.replaceAll(`#${n}[i]`, vars)
							.replaceAll(`#${n}`, vars)
					}
				}
				
				this.unified_description = desc.replaceAll('\n', '<br />')
			}
		} else {
			this.unified_description = this.descriptions[0]
		}
	}
	
	descriptionWikitext() {
		if (this.unified_description) {
			return this.unified_description
		}
		const output: string[] = []
		for (const [i, desc] of this.descriptions.entries()) {
			output.push(
				`{{Color|rarity${i + 3}|${i + 1}-star:}}<br />`
				 + desc.replaceAll('\n', '<br />')
			)
		}
		return output.join('\n----\n')
	}

	templateEntry(): string {
		const information = new Template('Component Information', {
			name: this.name + uploadPrompt(this.icon_path, `Component ${this.name}.png`, 'Component Icons'),
			alignment: this.alignment || this.type || '',
			unlock: this.unlock_requirement?.replaceAll(/Clear "(.+?)" /gi, 'Clear "[[Simulated Universe: Unknowable Domain/Exploration#$1|$1]]" ') || '',
			effect: this.descriptionWikitext(),
			notes: '',
		})
		return information.block()
	}
	
	static loadAll() {
		const ids = new Set<number>()
		
		RogueMagicUnit
			.filter(data => data.MagicUnitType != 'Active')
			.forEach(data => ids.add(data.MagicUnitID))
		
		return [...ids.values()].map(id => new this(id))
	}
}