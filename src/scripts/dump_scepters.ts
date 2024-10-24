import { writeFile } from 'fs/promises';
import { ScepterStyleType, ScepterUnitSlot } from '../files/Scepter.js';
import { Component, DisplayTypeMap, Scepter } from '../Scepter.js';
import { pageInfoHeader } from '../util/General.js';

// SCEPTERS //
const scepterPage: string[] = [
	pageInfoHeader('Simulated Universe: Unknowable Domain/Scepter'),
	'{{Simulated Universe: Unknowable Domain Tabs}}',
	'{{Stub|General gameplay details}}',
	''
]

function addScepters(type: ScepterStyleType) {
	const displayName = DisplayTypeMap[type]
	scepterPage.push(
		`==${displayName} Scepters==`,
		'{{Scepter Information/Header}}',
		...Scepter.loadAll(type).map(scepter => scepter.templateEntry()),
		'{{Scepter Information/Footer}}',
		''
	)
}

addScepters('Ultimate')
addScepters('Dot')
addScepters('Follow')
addScepters('Break')

scepterPage.push('==Change History==', '{{Change History|2.6}}')

await writeFile(`./output/und-scepters.wikitext`, scepterPage.join('\n'))


// COMPONENTS //
const componentsPage: string[] = [
	pageInfoHeader('Simulated Universe: Unknowable Domain/Component'),
	'{{Simulated Universe: Unknowable Domain Tabs}}',
	'{{Stub|General gameplay details}}',
	''
]

const components = Component.loadAll()

function addComponents(type: ScepterUnitSlot | 'Decision', display: string = type) {
	componentsPage.push(
		`==${display} Components==`,
		'{{Component Information/Header}}',
		...components
			.filter(comp => type == 'Decision' ? comp.is_decision : (comp.slot == type && !comp.is_decision))
			.map(component => component.templateEntry()),
		'{{Component Information/Footer}}',
		''
	)
}

addComponents('Decision')
addComponents('Attach', 'Supplementary')
addComponents('Passive')

componentsPage.push('==Change History==', '{{Change History|2.6}}')

await writeFile(`./output/und-components.wikitext`, componentsPage.join('\n'))