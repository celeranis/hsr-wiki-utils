import { existsSync } from 'fs';
import { mkdir, rm, writeFile } from 'fs/promises';
import { sanitizeString } from '../Shared.js';
import { Tutorial } from '../Tutorial.js';
import { pageInfoHeader, uploadPrompt } from '../util/General.js';
import { Template, TemplateMap } from '../util/Template.js';

if (existsSync('./output/tutorials/')) {
	await rm('./output/tutorials/', { recursive: true })
}

for (const tutorial of Tutorial.loadAll()) {
	const template = new Template<'Tutorial', TemplateMap['Tutorial']>('Tutorial', {
		sort: tutorial.page_ids[0], // idk why its like this on the wiki... theres a dedicated Order param in the excels?
		title: tutorial.name,
		subtitle: '', // unused by the game but still added to every tutorial page for some reason
		type: tutorial.can_review ? tutorial.type : '',
		about: '',
	})
	
	const fileTitle = sanitizeString(tutorial.pagetitle.replace('Tutorial/', '').replaceAll(':', ''))
	
	for (const [i, page] of tutorial.getPages().entries()) {
		const fileName = `Tutorial ${fileTitle} ${i + 1}.png`
		template.addParam(`image${i + 1}`, `${fileName}${uploadPrompt(page.image, fileName, 'Tutorial Files')}`)
		template.addParam(`text${i+1}`, page.text)
	}
	
	const output = pageInfoHeader(tutorial.pagetitle) + '\n' + template.block(9)
	
	await mkdir(`./output/tutorials/${tutorial.type || 'Unknown'}/`, { recursive: true })
	await writeFile(`./output/tutorials/${tutorial.type || 'Unknown'}/${fileTitle}-${tutorial.id}.wikitext`, output)
}