// import c from 'chalk';
import { setTimeout } from 'timers/promises';
import { client } from '../util/Bot.js';

const REDIRECTS = [
	// {
	// 	sourceCategory: 'Dreamscape Pass Sticker',
	// 	readTemplate: 'Item Infobox',
	// 	redirectName: (page: string, infobox) => `File:Item ${page}.png`,
	// 	redirectTarget: (page: string, infobox) => `File:${infobox.image}`
	// },
	{
		sourceCategory: 'Bonus Abilities',
		readTemplate: 'Ability Infobox',
		redirectName: (page: string, infobox) => infobox.sortkey ? undefined : `${infobox.character} A${infobox.reqAsc}`,
		redirectTarget: (page: string, infobox) => page
	},
	{
		sourceCategory: 'Eidolons',
		readTemplate: 'Eidolon Infobox',
		redirectName: (page: string, infobox) => [`${infobox.character} E${infobox.level}`, `${infobox.character} Eidolon ${infobox.level}`],
		redirectTarget: (page: string, infobox) => page
	},
	{
		sourceCategory: 'Character Abilities',
		readTemplate: 'Ability Infobox',
		redirectName: (page: string, infobox) => infobox.sortkey ? undefined : `${infobox.character} ${infobox.type}`,
		redirectTarget: (page: string, infobox) => page
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
	{
		sourceCategory: 'Playable Characters',
		readTemplate: 'Character Infobox',
		redirectName: (page: string, infobox) => `File:Character ${page} Icon.png`,
		redirectTarget: (page: string, infobox) => `File:${infobox.image}`
	}
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
			console.warn(`${data.readTemplate} not found on page ${pageTitle}, skipping...`)
			continue
		}
		
		const infoboxParams = Object.fromEntries(infobox.parameters.map(param => [param.name, param.value]))
		
		const redirctTarget = data.redirectTarget(pageTitle, infoboxParams)
		const targetData = await client.read(redirctTarget)
		if (targetData.invalid || targetData.missing) {
			console.error(`Invalid redirect target ${redirctTarget} on ${pageTitle}, skipping...`)
			continue
		}
		
		let redirectNames = data.redirectName(pageTitle, infoboxParams)
		
		if (!redirectNames) continue
		
		if (!Array.isArray(redirectNames)) {
			redirectNames = [redirectNames]
		}
		
		for (const redirectName of redirectNames) {
			const existingRedirect = await client.read(redirectName)
			if (!existingRedirect.missing) {
				console.debug(`Redirect for ${redirectName} already created, skipping...`)
				continue
			}
			// await AWB.viewDiff(existingRedirect.revisions?.[0]?.content ?? '', REDIRECT_FORMAT(targetData.title))

			let success = false
			while (!success) {
				try {
					await client.create(redirectName, REDIRECT_FORMAT(targetData.title))
					success = true
				} catch (err) {
					console.warn(`Failed to redirect ${redirectName} to ${targetData.title}. Retrying in 60 seconds...`)
					console.log(err)
					await setTimeout(60 * 1000)
				}
			}
			console.log(`Redirected page ${redirectName} to ${targetData.title}`)
		}
	}
}