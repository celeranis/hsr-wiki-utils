import { BaseDomain } from '../Domain.js';
import { textMap } from '../TextMap.js';
import { teardown } from '../util/JSONParser.js';
import { DomainType, Template } from '../util/Template.js';

for (const difficulties of await BaseDomain.getAll()) {
	const domain = difficulties[difficulties.length - 1]
	
	const output: string[] = []
	output.push(Template.pageData(await domain.getTitle()))
	
	const shortName = await domain.getShortName()
	const area = await domain.getArea()
	
	const infobox = new Template('Domain Infobox')
		.addParam('title', shortName != domain.name ? shortName : '')
		.addParam('image', await domain.getImage())
		.addParam('type', domain.type_display as DomainType)
		.addParam('mechanism', domain.special_mechanism ?? '')
	
	const bosses = domain.getBosses()
	if (bosses.length > 0) {
		infobox.addParam('boss', bosses.map(boss => boss.name).join('; '))
	}
	
	infobox
		.addParam('world', textMap.getText(area?.world.WorldName ?? ''))
		.addParam('region', '')
		.addParam('area', area?.name ?? '')
		.addParam('subarea', '')
		.addParam('requiredEL', '')
		
}

teardown()