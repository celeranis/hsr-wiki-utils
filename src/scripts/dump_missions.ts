import { mkdirSync, rmSync, writeFileSync } from 'fs'
import { ChangeHistory } from '../ChangeHistory.js'
import { Item } from '../Item.js'
import { Mission } from '../Mission.js'
import { wikiTitle } from '../Shared.js'
import { TextMap, textMap } from '../TextMap.js'
import { uploadPrompt } from '../util/General.js'

const PAGE_FORMAT =
`<%-- [PAGE_INFO]
PageTitle=#<<TITLE>>#
[END_PAGE_INFO] --%>
{{Stub|Dialogue.}}
{{Mission Infobox
|id            = <<ID>>
|title         = <<NAME_PARAM>>
|image         = <<IMAGE>>
|type          = <<TYPE>>
|event_name    = 
|chapter       = <<CHAPTERTITLE>>
|requirements  = <<REQUIREMENTS>>
|summary       = <<SUMMARY>>
|characters    = <<CHARACTERS>>
|startLocation = [[<<START_WORLD>>]] - [[<<START_AREA>>]]
|world         = <<START_WORLD>>
|area          = <<START_AREA>>
|prev          = <<PREV>>
|next          = <<NEXT>>
|rewards       = <<REWARDS>>
}}
'''''<<NAME>>''''' is <<TAN>> [[<<TYPEDISPLAY>>]]<<DETAILS>>.

==Steps==
<<STEPS>>

<!--
==Gameplay Notes==

--><!--
==Trial Character==

-->
==Dialogue==
{{Stub Dialogue}}
<<DIALOGUE>>

==Other Languages==
<<OL>>

==Change History==
{{Change History|<<VERSION>>}}
`

function sanitize(str: string) {
	return str.replace(/[\/\<\>\:\"\\\|\?\*]/g, '')
}

rmSync('./output/missions/', { recursive: true })
await Item.loadAll()

for (const missionData of Object.values(Mission.missionData)) {
	const mission = new Mission(missionData)
	const title = wikiTitle(mission.name, 'mission', mission.id)
	
	let output = PAGE_FORMAT
		.replaceAll('<<TITLE>>', title)
		.replaceAll('<<NAME>>', mission.name)
		.replaceAll('<<NAME_PARAM>>', mission.name != title ? mission.name : '')
		.replaceAll('<<ID>>', mission.id.toString())
		.replaceAll('<<TAN>>', mission.type == 'Adventure' ? 'an' : 'a')
		.replaceAll('<<TYPE>>', mission.type == 'Continuance' ? 'Trailblaze Continuance' : mission.type)
		.replaceAll('<<TYPEDISPLAY>>', mission.displayType)
		.replaceAll('<<CHAPTERTITLE>>', mission.getChapterName() || '')
		.replaceAll('<<SUMMARY>>', mission.description?.replaceAll('\n', '<br />') || "<!--official mission summary from Fate's Atlas-->")
		.replaceAll('<<NEXT>>', mission.getNext().map(mission => wikiTitle(mission?.name || '???', 'mission')).join(';'))
		.replaceAll('<<OL>>', await TextMap.generateOL(mission.name_hash))
		.replaceAll('<<VERSION>>', (await ChangeHistory.missions.findAdded(mission.id.toString()))[0] || '<!--unknown-->')
	
	const image = await mission.getImage()
	const imageName = `Mission ${title.replaceAll(':', '')}.png`
	if (typeof(image) == 'string') {
		output = output.replaceAll('<<IMAGE>>', imageName + uploadPrompt(image, imageName, "Fate's Atlas Images"))
	} else if (!image) {
		output = output.replaceAll('<<IMAGE>>', `<!--${imageName}-->`)
	} else {
		const stelleName = `Mission ${title.replaceAll(':', '') } Stelle.png`
		const caelusName = `Mission ${title.replaceAll(':', '') } Caelus.png`
		output = output.replaceAll('<<IMAGE>>', 
			uploadPrompt(image.stelle, stelleName, "Fate's Atlas Images") 
			+ uploadPrompt(image.caelus, caelusName, "Fate's Atlas Images")
			+ `\n<gallery>\n${stelleName}|Stelle\n${caelusName}|Caelus\n</gallery>`
		)
	}
	
	const requirements = mission.getRequirements()
	if (requirements.length > 1) {
		output = output.replaceAll('<<REQUIREMENTS>>', `\n* ${requirements.join('\n* ')}`)
	} else {
		output = output.replaceAll('<<REQUIREMENTS>>', requirements[0] || '')
	}
	output = output.replaceAll('<<PREV>>', wikiTitle(mission.prev?.name || ''))
	
	const steps = await mission.getSteps()
	const dialogueSections: string[] = []
	const stepList: string[] = []
	let lastName: string | undefined = undefined
	let lastDesc: string | undefined = undefined
	
	for (const [i, step] of steps.entries()) {
		if (lastName == step.title || (!step.title && i > 0)) continue
		if (step.title) stepList.push(`# ${step.title}`)
		dialogueSections.push(
			(step.title ? `===${step.title}===\n` : '') +
			((step.description && step.description != lastDesc) ? `{{Mission Description|type=${mission.type.toLowerCase()}|location=${step.location?.name || '<!--to be added-->'}${i > 0 ? '|update' : ''}|${step.description.replaceAll('\n', '<br />')}}}\n` : '') +
			'{{Dialogue Start}}\n' +
			':{{tx}}\n' +
			'{{Dialogue End}}'
		)
		lastName = step.title
		lastDesc = step.description || lastDesc
	}
	
	let details = ''
	
	const firstWithLocation = steps.find(step => step.location)
	const worldName = textMap.getText(firstWithLocation?.location?.world?.WorldName)
	if (worldName && (mission.type == 'Adventure' || mission.type == 'Daily')) {
		details += ` on [[${worldName}]]`
	}

	if (mission.data.ChapterID) {
		details += ` in the chapter ${mission.getChapterLink()}`
	}
	
	output = output
		.replaceAll('<<CHARACTERS>>', mission.characters.sort().join('; '))
		.replaceAll('<<START_AREA>>', firstWithLocation?.location?.name || '<!--starting area-->')
		.replaceAll('<<START_WORLD>>', worldName || '<!--starting world-->')
		.replaceAll('<<STEPS>>', stepList.join('\n'))
		.replaceAll('<<DIALOGUE>>', dialogueSections.join('\n\n'))
		.replaceAll('<<DETAILS>>', details || '<!--in [world]-->')
	
	const rewards = mission.getRewards()
	
	output = output
		.replaceAll('<<REWARDS>>', rewards.asCardListParams())
	
	const path = `./output/missions/${mission.type}${mission.data.ChapterID ? `/${sanitize(mission.getChapterName()!.replace(/\.$/, '_'))}` : ''}/`
	mkdirSync(path, { recursive: true })
	writeFileSync(`${path}/${sanitize(mission.name)}-${mission.id}.wikitext`, output)
}