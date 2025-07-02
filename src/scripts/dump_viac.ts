import { writeFile } from 'fs/promises';
import { VignetteCup } from '../events/Vignettes/Cup.js';
import { VignetteDrink } from '../events/Vignettes/Drink.js';
import { VignetteDecoration, VignetteIce, VignetteIngredient } from '../events/Vignettes/Ingredient.js';
import { teardown } from '../util/JSONParser.js';
import { Table } from '../util/Table.js';

const page: string[] = [
	'{{Event Tabs',
	'|subpage1 = Revenue Statistics',
	'|subpage3 = Recipe Deduction',
	'|gallery  = false',
	'}}'
]

const premierDrinksTable = new Table('article-table tdc1 sortable', ['Drink', 'Properties', 'Steps', 'Description'])

page.push('\n==Premier Drinks==')
for (const drink of VignetteDrink.all().filter(drink => !drink.isRecipeDeduction)) {
	premierDrinksTable.addRowWithAttr(`id="${drink.name.replaceAll(' ', '_').replaceAll('"', '&quot;')}"`, [
		`data-sort-value="${drink.name.replaceAll('"', '&quot;')}" | [[File:Premier Drink ${drink.name}.png|128x128px|${drink.name}]]<br />${drink.name}`,
		'{{tx}}',
		'* ' + drink.getSteps().join('\n* '),
		drink.description
	])
}

page.push(premierDrinksTable.wikitable(false))

page.push('\n==Recipe Deduction==')
const recipeDeductionTable = new Table('article-table tdc1 sortable', ['Drink', 'Steps', 'Description'])

for (const drink of VignetteDrink.all().filter(drink => drink.isRecipeDeduction)) {
	recipeDeductionTable.addRowWithAttr(`id="${drink.name.replaceAll(' ', '_').replaceAll('"', '&quot;')}"`, [
		`data-sort-value="${drink.name.replaceAll('"', '&quot;')}" | [[File:Premier Drink ${drink.name}.png|128x128px|${drink.name}]]<br />${drink.name}`,
		// '{{tx}}',
		'* ' + drink.getSteps().join('\n* '),
		drink.description
	])
}

page.push(recipeDeductionTable.wikitable(false))

page.push('\n==Flavoring Ingredients==')
const ingredientTable = new Table('article-table tdc1 sortable', ['Ingredient', 'Properties', 'Description'])

for (const ingredient of VignetteIngredient.all().sort((a, b) => a.tags[0].stat != b.tags[0].stat ? a.tags[0].stat == 'Intensity' ? 1 : -1 : (b.tags[0].stat_value! + (b.tags[1].stat_value! * 0.1)) - (a.tags[0].stat_value! + (a.tags[1].stat_value! * 0.1)))) {
	ingredientTable.addRowWithAttr(`id="${ingredient.name.replaceAll(' ', '_').replaceAll('"', '&quot;')}"`, [
		`data-sort-value="${ingredient.name.replaceAll('"', '&quot;')}" | [[File:Ingredient ${ingredient.name}.png|64x64px|${ingredient.name}]]<br />${ingredient.name}`,
		'* ' + ingredient.tags.map(tag => tag.toString()).join('\n* '),
		ingredient.description ?? ''
	])
}

page.push(ingredientTable.wikitable(false))

page.push('\n==Glasses==')
const glassTable = new Table('article-table tdc1 sortable', ['Image', 'Name'])

for (const glass of VignetteCup.all()) {
	glassTable.addRowWithAttr(`id="${glass.name.replaceAll(' ', '_').replaceAll('"', '&quot;')}"`, [
		`data-sort-value="${glass.name.replaceAll('"', '&quot;')}" | [[File:Glass ${glass.name}.png|64x64px|${glass.name}]]`,
		glass.name
	])
}

page.push(glassTable.wikitable(false))

page.push('\n==Ice==')
const iceTable = new Table('article-table tdc1 sortable', ['Image', 'Name'])

for (const glass of VignetteIce.all()) {
	console.log(glass)
	iceTable.addRowWithAttr(`id="${glass.name.replaceAll(' ', '_').replaceAll('"', '&quot;')}"`, [
		`data-sort-value="${glass.name.replaceAll('"', '&quot;')}" | [[File:Ingredient ${glass.name}.png|64x64px|${glass.name}]]`,
		glass.name
	])
}

page.push(iceTable.wikitable(false))

page.push('\n==Garnishes==')
const decoTable = new Table('article-table tdc1 sortable', ['Image', 'Name'])

for (const glass of VignetteDecoration.all()) {
	decoTable.addRowWithAttr(`id="${glass.name.replaceAll(' ', '_').replaceAll('"', '&quot;')}"`, [
		`data-sort-value="${glass.name.replaceAll('"', '&quot;')}" | [[File:Garnish ${glass.name}.png|64x64px|${glass.name}]]`,
		glass.name
	])
}

page.push(decoTable.wikitable(false))

writeFile('./output/vignettesinacup.wikitext', page.join('\n'))

teardown()