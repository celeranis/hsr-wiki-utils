import { AvatarSkillData } from '../../files/Ability.js';
import { getFile } from '../../files/GameFile.js';
import { roundTo } from '../../Shared.js';
import { textMap } from '../../TextMap.js';
import { AWB } from '../../util/AWB.js';
import { client, retryIfRatelimit } from '../../util/Bot.js';

const targetCategories = [
	'Skills',
	'Memosprite Skills',
]

const abilityPages = (await Promise.all(targetCategories.map(cat => client.getPagesInCategory(cat))))
	.flat(1)

const abilities = await getFile<AvatarSkillData[]>('ExcelOutput/AvatarServantSkillConfig.json')

// the maximum level obtainable in-game for each type
const abilityMaxLevels = {
	'Skill': 15,
	'Memosprite Skill': 9,
}

for (const page of abilityPages) {
	await retryIfRatelimit(() => client.edit(page, async (rev) => {
		let content = rev.content
		
		if (content.includes('{{Ability Attributes')) {
			console.log(`${page} is using ability attributes template, skipping`)
			return null as any
		}
		
		const templates = new client.Wikitext(rev.content).parseTemplates({ namePredicate: name => name == 'Ability Infobox' || name == 'Skill Scaling' })
		
		if (!templates || templates.length == 0) {
			console.warn(`Could not find matching template on page "${page}", skipping...`)
			return null as any
		}
		
		const skillScaling = templates.find(temp => temp.name == 'Skill Scaling')
		if (!skillScaling) {
			console.warn(`Could not find Skill Scaling on ${page}`)
			return null as any
		}
		
		const abilityInfobox = templates.find(temp => temp.name == 'Ability Infobox')
		if (!abilityInfobox) {
			console.warn(`Could not find Ability Infobox on ${page}`)
			return null as any
		}

		const abilityName = abilityInfobox.getValue('title') || page.replace(' (Ability)', '')
		const abilityType = abilityInfobox.getValue('type')!
		const abilityMaxLevel = abilityMaxLevels[abilityType]
		
		const abilityParams: number[][] = []
		
		const abilityLevels = abilities
			.filter(ability => textMap.getText(ability.SkillName) == abilityName && ability.Level <= abilityMaxLevel)
			.sort((a0, a1) => a0.Level - a1.Level)
		
		if (abilityLevels.length == 0) {
			console.warn(`Could not find data for ability "${abilityName}"`)
			return null as any
		}
		
		const firstLevel = abilityLevels[0]
		for (const abilityLevel of abilityLevels) {
			abilityLevel.ParamList.forEach(({Value}, i) => (abilityParams[i] ??= []).push(Value))
		}

		const firstDescRaw = textMap.getTextRaw(firstLevel.SkillDesc)

		let abilityParamsDisplay: string[][] = abilityParams
			.map((params, i) => {
				let [match, mode, percent] = firstDescRaw.match(new RegExp(`<unbreak>#${i + 1}(?:\\[(\\w+)\\])?(%)?<\\/unbreak>`)) ?? []
				if (!match) return undefined

				let factor = mode?.startsWith('f') ? Number(mode.substring(1)) : 2
				
				let additionalMult = 1
				if (percent) {
					additionalMult = 100
				} else {
					percent = ''
				}
				
				return params.map(param => roundTo(Number(param) * additionalMult, factor).toLocaleString() + percent)
			})
			.filter(param => param != undefined)
		
		abilityParamsDisplay = abilityParamsDisplay
			.filter(params => params[0] != params[abilityMaxLevel - 1])
			.filter((params, i) => !abilityParamsDisplay.find((oparams, oi) => params.toString() == oparams.toString() && i > oi))
		
		console.log(abilityParamsDisplay)
		
		const newWikitext: string[] = ['{{Skill Scaling']
		
		abilityParamsDisplay.forEach(params => newWikitext.push('|' + params.join(';')))
		
		newWikitext.push('}}')
		
		content = content.replace(skillScaling.wikitext, newWikitext.join('\n'))
		
		if (content == rev.content) {
			console.log(`Skipped editing "${abilityName}" (no changes?)`)
			return null as any
		}
		
		content = await AWB.viewDiff(rev.content, content)
		
		return { text: content, summary: 'adding 3.2 moc scaling' }
	}))
}