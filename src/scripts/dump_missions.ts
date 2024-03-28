import { mkdirSync, writeFileSync } from 'fs'
import { ChangeHistory } from '../ChangeHistory.js'
import { Item } from '../Item.js'
import { Mission } from '../Mission.js'
import { wikiTitle } from '../Shared.js'
import { TextMap } from '../TextMap.js'

const PAGE_FORMAT =
`<%-- [PAGE_INFO]
PageTitle=#<<TITLE>>#
[END_PAGE_INFO] --%>
{{Stub|Dialogue, characters, and location(s)}}
{{Mission Infobox
|id            = <<ID>>
|title         = <<NAME_PARAM>>
|image         = Mission <<TITLE>>.png
|type          = <<TYPE>>
|event_name    = 
|chapter       = <<CHAPTERTITLE>>
|requirements  = <<REQUIREMENTS>>
|summary       = <<SUMMARY>>
|characters    = <!--characters that appear in this mission-->
|startLocation = <!--location as it intially appears on the mission screen-->
|world         = <!--i.e. Penacony-->
|area          = <!--i.e. A Child's Dream-->
|prev          = 
|next          = <<NEXT>>
|exp           = <<EXP>>
|credits       = <<CREDITS>>
|stellarJade   = <<JADES>>
|other         = <<REWARDS>>
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

await Item.loadFrom('main', 'characters', 'disks', 'light_cones', 'profile_pics', 'readables', 'relics')

for (const missionData of Object.values(Mission.missionData)) {
	const mission = new Mission(missionData)
	const title = wikiTitle(mission.name, 'mission')
	
	let output = PAGE_FORMAT
		.replaceAll('<<TITLE>>', title)
		.replaceAll('<<NAME>>', mission.name)
		.replaceAll('<<NAME_PARAM>>', mission.name != title ? mission.name : '')
		.replaceAll('<<ID>>', mission.id.toString())
		.replaceAll('<<TAN>>', mission.type == 'Adventure' ? 'an' : 'a')
		.replaceAll('<<TYPE>>', mission.type)
		.replaceAll('<<TYPEDISPLAY>>', mission.displayType)
		.replaceAll('<<CHAPTERTITLE>>', mission.getChapterName() || '')
		.replaceAll('<<SUMMARY>>', mission.description?.replaceAll('\n', '<br />') || "<!--official mission summary from Fate's Atlas-->")
		.replaceAll('<<NEXT>>', mission.getNext().map(mission => wikiTitle(mission.name, 'mission')).join(';'))
		.replaceAll('<<OL>>', await TextMap.generateOL(mission.name_hash))
		.replaceAll('<<VERSION>>', (await ChangeHistory.missions.findAdded(mission.id.toString()))[0] || '<!--unknown-->')
	
	const requirements = mission.getRequirements()
	if (requirements.length > 1) {
		output = output.replaceAll('<<REQUIREMENTS>>', `\n* ${requirements.join('\n* ')}`)
	} else {
		output = output.replaceAll('<<REQUIREMENTS>>', requirements[0] || '')
	}
	
	const steps = mission.getSteps()
	const dialogueSections: string[] = []
	const stepList: string[] = []
	let lastName: string | undefined = undefined
	
	for (const [i, step] of steps.entries()) {
		if (lastName == step.title || (!step.title && i > 0)) continue
		if (step.title) stepList.push(`# ${step.title}`)
		dialogueSections.push(
			(step.title ? `===${step.title}===\n` : '') +
			(step.description ? `{{Mission Description|type=${mission.type.toLowerCase()}|location=<!--to be added-->${i > 0 ? '|update' : ''}|${step.description.replaceAll('\n', '<br />')}}}\n` : '') +
			'{{Dialogue Start}}\n' +
			':{{tx}}\n' +
			'{{Dialogue End}}'
		)
		lastName = step.title
	}
	
	let details = ''
	if (mission.data.ChapterID) {
		details += ` in the chapter ${mission.getChapterLink()}`
	}

	output = output
		.replaceAll('<<STEPS>>', stepList.join('\n'))
		.replaceAll('<<DIALOGUE>>', dialogueSections.join('\n\n'))
		.replaceAll('<<DETAILS>>', details || '<!--in [world]-->')
	
	const rewards = mission.getRewards()
	
	output = output
		.replaceAll('<<EXP>>', (rewards.trailblaze_exp || '').toString())
		.replaceAll('<<CREDITS>>', (rewards.credits || '').toString())
		.replaceAll('<<JADES>>', (rewards.stellar_jade || '').toString())
		.replaceAll('<<REWARDS>>', rewards.data.length > 0 ? rewards.asCardList(true) : '')
	
	const path = `./output/missions/${mission.type}${mission.data.ChapterID ? `/${sanitize(mission.getChapterName()!)}` : ''}/`
	mkdirSync(path, { recursive: true })
	writeFileSync(`${path}/${sanitize(mission.name)}-${mission.id}.wikitext`, output)
}