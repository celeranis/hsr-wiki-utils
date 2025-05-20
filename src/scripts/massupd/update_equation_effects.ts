import { Equation } from '../../Equation.js';
import { client } from '../../util/Bot.js';
import { updateAllPages } from '../../util/UpdateTemplateParam.js';

const equationPages = await client.getPagesInCategory('Equations')

const equations = Equation.loadAll()

await updateAllPages('Equation Infobox', 'effect', 'updating effect', equationPages, (pageName, currentParams) => {
	const equationName = currentParams.title || pageName.replace(' (Equation)', '')
	const equation = equations.find(equation => equation.name == equationName)
	return equation!.description
})