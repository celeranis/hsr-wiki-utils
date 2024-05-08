import { Template as MwnTemplate } from 'mwn';
import { ChangeHistory } from '../ChangeHistory.js';
import { Item } from '../Item.js';
import { Mission, MissionType } from '../Mission.js';
import { wikiTitle, wikiTitleLink } from '../Shared.js';
import { TextMap, textMap } from '../TextMap.js';
import { AWB } from '../util/AWB.js';
import { client } from '../util/Bot.js';
import { Template } from '../util/Template.js';

const SKIP = [
	'Echo of War (Adventure Mission)', 'Calyx (Crimson): Bud of Harmony (Adventure Mission)', 'Calyx (Golden): Bud of Memories (Adventure Mission)',
	'Cavern of Corrosion (Adventure Mission)', 'Critter Pick: Rest Area', 'Road to Revival', 'Simulated Universe: First Closed Beta'
]

const pageNames = (await client.getPagesInCategory('Templates Using Deprecated Parameters')).filter(name => !SKIP.includes(name))

function noneIfEmpty(template: MwnTemplate, key: string): string | undefined {
	const value = template.getValue(key)
	const isEmpty = !value?.replaceAll(/<!--.*-->/g, '')?.trim()
	return isEmpty ? undefined : value!
}

await Item.loadAll()

for (const pageName of pageNames) {
	await client.edit(pageName, async ({content, timestamp}) => {
		const original = content
		content = AWB.customGenfixes(content)
		const page = new client.Wikitext(content)
		
		const infobox = page.parseTemplates({ namePredicate: (name) => name.replace('_', ' ') == 'Mission Infobox' })[0]
		const OL = page.parseTemplates({ namePredicate: (name) => name.replace('_', ' ') == 'Other Languages' })?.[0]
		const CH = page.parseTemplates({ namePredicate: (name) => name.replace('_', ' ') == 'Change History' })?.[0]

		if (!infobox) {
			console.log(`Skipping ${pageName}, no mission infobox present`)
			return undefined as any;
		}
		
		console.log(pageName)
		
		// const id = infobox.getValue('id')
		// let mission: Mission
		// if (id) {
		// 	mission = Mission.fromId(id)
		// } else {
			let type = infobox.getValue('type')
			let mission = Mission.searchByName(infobox.getValue('title') || pageName, type == 'Trailblaze Continuance' ? 'Continuance' : (type as MissionType))!
			if (!mission) {
				const manualId = await AWB.prompt(`Could not find mission associated with page "${pageName}." Please enter mission ID:`)
				mission = Mission.fromId(manualId)
			}
		// }
		
		const newInfobox = new Template('Mission Infobox')
			.addParam('id', mission.id)
		
		if (mission.name != pageName) {
			newInfobox.addParam('title', mission.name != pageName ? mission.name : '')
		}
		
		newInfobox.addParam('image', infobox.wikitext.match(/\|image\s*=\s*?(.*?)\s*?\n\|/si)?.[1]?.trim() || `<!-- Mission ${mission.name}.png -->`)
			.addParam('type', mission.type == 'Continuance' ? 'Trailblaze Continuance' : mission.type)
			.addParam('chapter', mission.getChapterName() || '')
		
		if (noneIfEmpty(infobox, 'event_name')) {
			newInfobox.addParam('event_name', infobox.getValue('event_name')!)
		}
		
		const steps = await mission.getSteps()
		const firstWithLocation = steps.find(step => step.location)
		const worldName = textMap.getText(firstWithLocation?.location?.world?.WorldName)
		
		const requirements = mission.getRequirements()
		newInfobox.addParam('requirements', requirements.length > 1 ? `* ${requirements.join('\n* ')}` : requirements[0] || infobox.getValue('requirements') || '')
			.addParam('summary', mission.description?.replaceAll('\n', '<br />') || "<!--official mission summary from Fate's Atlas-->")
			.addParam('characters', noneIfEmpty(infobox, 'characters') || mission.characters.join('; '))
			.addParam('startLocation', noneIfEmpty(infobox, 'startLocation')
				|| (firstWithLocation ? `[[${worldName}]] - ${wikiTitleLink(firstWithLocation.location!.name)}` : ''))
			.addParam('world', noneIfEmpty(infobox, 'world') || worldName || '<!--starting world, i.e. Penacony-->')
			.addParam('area', noneIfEmpty(infobox, 'area') || wikiTitle(firstWithLocation?.location?.name || '', 'location') || "<!--starting area, i.e. A Child's Dream-->")
			.addParam('subarea', noneIfEmpty(infobox, 'subarea') || '')
			.addParam('prev', noneIfEmpty(infobox, 'prev') || mission.prev?.pagetitle || "")
			.addParam('next', noneIfEmpty(infobox, 'next') || mission.getNext()?.[0]?.pagetitle || '')
		
		let currentIndex = 2
		while (noneIfEmpty(infobox, `prev${currentIndex}`)) {
			newInfobox.addParam(`prev${currentIndex}`, infobox.getValue(`prev${currentIndex}`)!)
		}

		currentIndex = 2
		while (noneIfEmpty(infobox, `next${currentIndex}`)) {
			newInfobox.addParam(`next${currentIndex}`, infobox.getValue(`next${currentIndex}`)!)
		}
		
		let rewards = mission.getRewards().asCardListParams(false)
		if (!rewards) {
			rewards = Mission.searchByName(mission.name, mission.type, true)?.getRewards().asCardListParams(false)!
		}
		newInfobox.addParam('rewards', rewards || '')
		
		content = content.replace(infobox.wikitext, newInfobox.block(13))
		
		if (OL) {
			content = content.replace(OL.wikitext, await TextMap.generateOL(mission.name_hash))
		} else {
			content = content.replace(/(\n==Change History==|$)/, await TextMap.generateOL(mission.name_hash) + '\n$1')
		}
		
		if (!CH) {
			content = content.trim() + `\n\n==Change History==\n{{Change History|${ChangeHistory.missions.findAdded(mission.id.toString())[0] || '<!--unknown-->'}}}`
		}
		
		if (original != content) {
			const confirmed = await AWB.confirm(content)
			if (!confirmed) return undefined as any;
		}
		
		if (original == content) return undefined as any;
		
		return {
			bot: true,
			summary: 'new rewards format',
			text: content
		}
	})
}