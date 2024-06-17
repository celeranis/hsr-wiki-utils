import c from 'chalk';
import { client } from '../util/Bot.js';

const REDIRECTS = [
	{
		sourceCategory: 'Dreamscape Pass Sticker',
		readTemplate: 'Item Infobox',
		redirectName: (page: string, infobox) => `File:Item ${page}.png`,
		redirectTarget: (page: string, infobox) => `File:${infobox.image}`
	},
	{
		sourceCategory: 'Disk',
		readTemplate: 'Item Infobox',
		redirectName: (page: string, infobox) => `File:Item ${page}.png`,
		redirectTarget: (page: string, infobox) => 'File:Item Phonograph Record.png'
	},
	{
		sourceCategory: 'Light Cone',
		readTemplate: 'Light Cone Infobox',
		redirectName: (page: string, infobox) => `File:Item ${page}.png`,
		redirectTarget: (page: string, infobox) => `File:Light Cone ${page} Icon.png`
	},
	{
		sourceCategory: 'Readables',
		readTemplate: 'Readable Infobox',
		redirectName: (page: string, infobox) => `File:Item ${page}.png`,
		redirectTarget: (page: string, infobox) => `File:${infobox.image}`
	},
	// {
	// 	sourceCategory: 'Playable Characters',
	// 	readTemplate
	// }
]

const REDIRECT_FORMAT = (target: string) => `#REDIRECT [[${target}]]\n\n[[Category:Redirect Pages]]`

for (const data of REDIRECTS) {
	const category = (await client.getPagesInCategory(data.sourceCategory))
		.filter(name => !name.startsWith('File:') && !name.startsWith('Category:'))
	for (const pageTitle of category) {
		const page = await client.read(pageTitle)
		if (!page.revisions) continue
		const pageContent = new client.Wikitext(page.revisions[0].content!)
		const infobox = pageContent.parseTemplates({ namePredicate: (name) => name.replaceAll('_', ' ') == data.readTemplate })[0]
		
		if (!infobox) {
			console.warn(c.yellow(`${data.readTemplate} not found on page ${pageTitle}, skipping...`))
			continue
		}
		
		const infoboxParams = Object.fromEntries(infobox.parameters.map(param => [param.name, param.value]))
		
		const redirctTarget = data.redirectTarget(pageTitle, infoboxParams)
		const targetData = await client.read(redirctTarget)
		if (targetData.invalid || targetData.missing) {
			console.error(c.red(`Invalid redirect target ${redirctTarget} on ${pageTitle}, skipping...`))
			continue
		}
		
		const redirectName = data.redirectName(pageTitle, infoboxParams)
		
		const existingRedirect = await client.read(redirectName)
		if (!existingRedirect.missing) {
			console.log(c.grey(`Redirect for ${redirectName} already created, skipping...`))
			continue
		}
		// await AWB.viewDiff(existingRedirect.revisions?.[0]?.content ?? '', REDIRECT_FORMAT(targetData.title))
		
		await client.create(redirectName, REDIRECT_FORMAT(targetData.title))
		console.log(`Redirected page ${redirectName} to ${targetData.title}`)
	}
}