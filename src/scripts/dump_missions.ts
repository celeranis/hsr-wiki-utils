import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { ChangeHistory } from '../ChangeHistory.js'
import { Item } from '../Item.js'
import { Area } from '../maps/Area.js'
import { Mission } from '../Mission.js'
import { DICON_MAP, wikiTitle } from '../Shared.js'
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
|event_name    = <<EVENT>>
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

if (existsSync('./output/missions/')) {
	// rmSync('./output/missions/', { recursive: true })
}
await Item.loadAll()

const only = process.argv
	.find(arg => arg.startsWith('--only='))
	?.replace('--only=', '')
	?.split(',')

const startTime = Date.now()
const allMissionData = Object.values(Mission.missionData)

for (const [i, missionData] of allMissionData.entries()) {
	if (only && !only.includes(missionData.MainMissionID.toString())) continue
	let missionStartTime = Date.now()
	
	const mission = new Mission(missionData)
	const title = wikiTitle(mission.name, 'mission', mission.id)
	
	let output = PAGE_FORMAT
		.replaceAll('<<TITLE>>', title)
		.replaceAll('<<NAME>>', mission.name)
		.replaceAll('<<NAME_PARAM>>', mission.name != title ? mission.name : '')
		.replaceAll('<<ID>>', mission.id.toString())
		.replaceAll('<<TAN>>', ((mission.type == 'Adventure' || mission.event) ? 'an' : 'a') + (mission.event ? ' Event' : ''))
		.replaceAll('<<TYPE>>', mission.type == 'Continuance' ? 'Trailblaze Continuance' : mission.type)
		.replaceAll('<<TYPEDISPLAY>>', mission.displayType)
		.replaceAll('<<CHAPTERTITLE>>', mission.getChapterName() || '')
		.replaceAll('<<SUMMARY>>', mission.description?.replaceAll('\n', '<br />') || "<!--official mission summary from Fate's Atlas-->")
		.replaceAll('<<NEXT>>', mission.getNext().map(mission => wikiTitle(mission?.name || '???', 'mission')).join(';'))
		.replaceAll('<<OL>>', await TextMap.generateOL(mission.name_hash))
		.replaceAll('<<VERSION>>', (await ChangeHistory.missions.findAdded(mission.id.toString()))[0] || '<!--unknown-->')
		.replaceAll('<<EVENT>>', mission.event?.name ?? '')
	
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
	
	const steps = await mission.getSteps(true)
	const dialogueSections: string[] = []
	const stepList: string[] = []
	let lastName: string | undefined = undefined
	let lastDesc: string | undefined = undefined
	
	const addedMapDialogue = new Set<string | number>()
	
	for (const [i, step] of steps.entries()) {
		if (step.name && step.name != lastName) stepList.push(`# ${step.name}` + (process.argv.includes('--add-triggers') ? `{{subst:void|<!--${step.id} / ${step.order_reason}-->}}` : ''))
		const stepDialogue = await step.loadDialogue()
	
		const dialogueEntry: (string | undefined)[] = []
		
		if (step.name && step.name != lastName) {
			dialogueEntry.push(
				i > 0 ? '{{Dialogue End}}\n' : undefined,
				`===${step.name}{{subst:void|<!--${step.id}-->}}===`
			)
		} else if (process.argv.includes('--add-triggers')) {
			dialogueEntry.push(`{{subst:void|<!--${step.id} / ${step.order_reason}-->}}`)
		}
		
		if (step.description && step.description != lastDesc) {
			dialogueEntry.push(`{{Mission Description|type=${mission.type.toLowerCase()}|location=${(await step.getFloor() ?? await step.getArea())?.name || '<!--to be added-->'}${i > 0 ? '|update' : ''}|${step.description.replaceAll('\n', '<br />')}}}`)
		}
		
		if (step.name && step.name != lastName) {
			dialogueEntry.push('{{Dialogue Start}}')
			if (process.argv.includes('--no-dialogue')) {
				dialogueEntry.push(':{{tx}}')
			}
		}
		
		if (!process.argv.includes('--no-dialogue')) {
			dialogueEntry.push(await stepDialogue?.wikitext())
		}

		// const groups = (await step.getGroups()).filter(group => group.act_path)
		const npcDialogueList = await step.getMapDialogue()
		for (const npcDialogue of [/*...groups, */...npcDialogueList]) {
			if (addedMapDialogue.has(npcDialogue.id)) continue
			
			const npcTree = (await npcDialogue.loadDialogue(stepDialogue?.environment ?? { main_mission_id: mission.id, sub_mission_id: step.id }))?.optimize()
			if (!npcTree) continue
			
			if ('source' in npcDialogue && !process.argv.includes('--no-dialogue')) {
				if (npcDialogue.source.type == 'npc') {
					dialogueEntry.push(`\n;(Talk to ${npcDialogue.source.name || npcDialogue.prompt})`)
				} else {
					dialogueEntry.push(`\n:{{DIcon|${DICON_MAP[npcDialogue.dicon]}}} ${npcDialogue.prompt}`)
				}
			}
			
			npcTree.environment.characters.forEach(chr => mission.charset.add(chr == '(Trailblazer)' ? 'Trailblazer' : chr))

			if (!process.argv.includes('--no-dialogue')) {
				dialogueEntry.push(await npcTree.wikitext())
			}
			
			if (process.argv.includes('--add-json')) {
				dialogueEntry.push('<pre>' + npcTree.toJSON() + '</pre>')
			}
			
			const unusedNpc = await npcTree.unusedWikitext()
			if (unusedNpc?.length && !process.argv.includes('--no-dialogue')) {
				dialogueEntry.push(unusedNpc.join('\n\n'))
			}

			if (!npcTree.environment.has_definite_conditional) {
				addedMapDialogue.add(npcDialogue.id)
			}
		}
		
		const unused = await stepDialogue?.unusedWikitext()
		if (unused?.length && !process.argv.includes('--no-dialogue')) {
			dialogueEntry.push(unused.join('\n\n'))
		}
		
		const result = dialogueEntry.filter(v => v != unused).join('\n')
		if (result.trim() != '') {
			dialogueSections.push(result)
		}
		
		lastName = step.name || lastName
		lastDesc = step.description || lastDesc
	}
	
	let details = ''
	
	let firstLocation: string | undefined = undefined
	let firstWorld: string | undefined = undefined
	for (const step of steps) {
		const area = await step.getFloor() || await step.getArea()
		if (area && area.name) {
			firstLocation = area.name
			firstWorld = textMap.getText(area instanceof Area ? area.world.WorldName : (await area.getArea()).world.WorldName)
			break
		}
	}
	if (mission.event) {
		details += ` from the [[${wikiTitle(mission.event.name)}]] event`
	} else {
		if (firstWorld && (mission.type == 'Adventure' || mission.type == 'Daily')) {
			details += ` on [[${firstWorld}]]`
		}

		if (mission.data.ChapterID) {
			details += ` in the chapter ${mission.getChapterLink()}`
		}
	}
	
	output = output
		.replaceAll('<<CHARACTERS>>', mission.characters.sort().join('; '))
		.replaceAll('<<START_AREA>>', firstLocation || '<!--starting area-->')
		.replaceAll('<<START_WORLD>>', firstWorld || '<!--starting world-->')
		.replaceAll('<<STEPS>>', stepList.join('\n'))
		.replaceAll('<<DIALOGUE>>', dialogueSections.join('\n') + '\n{{Dialogue End}}')
		.replaceAll('<<DETAILS>>', details || '<!--in [world]-->')
	
	const rewards = mission.getRewards()
	
	output = output
		.replaceAll('<<REWARDS>>', rewards.asCardListParams())

	console.log(`[${i+1}/${allMissionData.length}] Generated output for Mission ${mission.id} "${mission.name}" (took ${Date.now() - missionStartTime}ms)`)
	
	const path = `./output/missions/${mission.type}${mission.data.ChapterID ? `/${sanitize(mission.getChapterName()!.replace(/\.$/, '_'))}` : ''}/`
	mkdirSync(path, { recursive: true })
	writeFileSync(`${path}/${sanitize(mission.name)}-${mission.id}.wikitext`, output)
}

console.log(`Finished! Generated ${Object.keys(Mission.missionData).length} Mission pages in ${Math.floor((Date.now() - startTime) / 1000)}s`)