import { Dictionary } from '../../Shared.js'
import { HashReference, textMap } from '../../TextMap.js'
import { getFile } from '../../files/GameFile.js'
import { VignetteCup } from './Cup.js'
import { VignetteDecoration, VignetteIce, VignetteIngredient } from './Ingredient.js'

export interface InternalVignetteDrink {
	FormulaID: number
	FormulaName: HashReference
	FormulaDesc: HashReference
	IconPath: string
	SmallIconPath: string
	CupID: number
	IceID: number
	DecoID: number
	IngredientList: number[]
	MixRate: number
	UnlockType: string
	UnlockParam: number
	IsChallengeMode: boolean
}

const data = await getFile<Dictionary<InternalVignetteDrink>>('ExcelOutput/DrinkMakerFormula.json')

export class VignetteDrink {
	id: number
	name: string
	description: string
	icon: string
	cup: VignetteCup
	ice?: VignetteIce
	decoration?: VignetteDecoration
	ingredients: VignetteIngredient[]
	isRecipeDeduction: boolean
	mix_at: number

	static cache: Record<string, VignetteDrink> = {}
	
	constructor(data: InternalVignetteDrink) {
		this.id = data.FormulaID
		this.name = textMap.getText(data.FormulaName)
		this.description = textMap.getText(data.FormulaDesc)
		this.icon = data.IconPath
		this.cup = VignetteCup.fromId(data.CupID) 
		this.ice = VignetteIce.fromId(data.IceID) ?? VignetteIce.fromId(0)
		this.decoration = VignetteDecoration.fromId(data.DecoID) ?? VignetteDecoration.fromId(0)
		this.ingredients = data.IngredientList.map(ingredient => VignetteIngredient.fromId(ingredient)).filter(v=>v) as VignetteIngredient[]
		this.isRecipeDeduction = data.IsChallengeMode
		this.mix_at = data.MixRate
	}
	
	static fromId(id: string | number) {
		return this.cache[id] ?? new this(data[id])
	}
	
	static all() {
		return Object.values(data).map(data => this.fromId(data.FormulaID))
	}
	
	getSteps(): string[] {
		const steps: string[] = []
		
		if (this.cup) {
			steps.push(`Select ${this.cup.asItem()}`)
		}
		
		if (this.ice) {
			steps.push(`Add ${this.ice.asItem()}`)
		}
		
		let lastIngredient: (VignetteIngredient | undefined) = undefined
		let lastCount = 0
		for (const [i, ingredient] of this.ingredients.entries()) {
			if (i == this.mix_at) {
				if (lastIngredient) {
					steps.push(lastIngredient.asItem(lastCount))
				}
				steps.push('Stir')
				lastIngredient = undefined
				lastCount = 0
			}
			if (lastIngredient && lastIngredient.id != ingredient.id) {
				steps.push(lastIngredient.asItem(lastCount))
				lastCount = 0
			}
			lastIngredient = ingredient
			lastCount += 1
		}
		
		if (lastIngredient) {
			steps.push(lastIngredient.asItem(lastCount))
		}
		
		if (this.decoration) {
			steps.push(`Select ${this.decoration.asItem()}`)
		}
		
		return steps
	}
}