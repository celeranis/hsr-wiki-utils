import { existsSync, readFileSync, writeFileSync } from 'fs'
import type { InternalEventName, InternalEventSection, InternalEventSectionDisplay } from '../Event.js'
import { HashReference, TextMap } from '../TextMap.js'

const VERSION_COMMITS = {
	'1.0': '4a36e628f9f34e6221b167b6ae0235a2f3934330',
	'1.1': '1ab86f99405026f6c9b1be98661a584e1a38a0df',
	'1.2': '900fa36177ffd66e7d70d2c21276c5bc0662212d',
	'1.3': 'aa811519a5de772bf4055e8ea8b9254f90b7746c',
	'1.4': '6acdba35cbf80adc100dbde528b1c271f50dcb9d',
	'1.5': '59d64be43a1da285cf22ba9be5ed90ef2b23f857',
}
const FILENAMES = {
	'SpriteOutput/Rogue/RandomEvent/Horizon/RoguePicEventDLC_01.png': 'Trailblaze Secret 1.png',
	'SpriteOutput/Rogue/RandomEvent/Horizon/RoguePicEventDLC_02.png': 'Trailblaze Secret 2.png',
	'SpriteOutput/Rogue/RandomEvent/Horizon/RoguePicEventDLC_03.png': 'Trailblaze Secret 3.png',
	'SpriteOutput/Rogue/RandomEvent/Horizon/RoguePicEventDLC_04.png': 'Trailblaze Secret 4.png',
	'SpriteOutput/Rogue/RandomEvent/Horizon/RoguePicEventDLC_05.png': 'Trailblaze Secret 5.png',
	'SpriteOutput/Rogue/RandomEvent/Horizon/RoguePicEventDLC_06.png': 'Trailblaze Secret 6.png',
}
const version = '1.5'

const textMap = new TextMap(version)

interface SubStory {
	RogueDLCSubStoryID: number
	Layer: number
	LevelGraphPath: string
	SubStoryName: HashReference
	ImgPath: string
}

const eventNamesJson: { [id: string]: InternalEventName } = JSON.parse(readFileSync(`./versions/${version}/RogueTalkNameConfig.json`).toString())
const eventNpcsJson: { [id: string]: InternalEventName } = JSON.parse(readFileSync(`./versions/${version}/RogueNPCDialogue.json`).toString())
const eventInfoJson: { [id: string]: InternalEventSection } = JSON.parse(readFileSync(`./versions/${version}/DialogueEvent.json`).toString())
const eventDisplayJson: { [id: string]: InternalEventSectionDisplay } = existsSync(`./versions/${version}/DialogueEventDisplay.json`) ? JSON.parse(readFileSync(`./versions/${version}/DialogueEventDisplay.json`).toString()) : {}

function pathDisplayName(pathName: string) {
	return pathName == 'TheHunt' ? 'The Hunt' : pathName
}

function pathIcon(pathName: string) {
	return `{{Icon/Dark|Path ${pathDisplayName(pathName)} Small.png|20}}`
}

const finalOutput: string[] = []

for (const [id, event] of Object.entries(eventInfoJson)) {
	if (!event.AeonOption || !event.RogueEffectType) continue
	
	const storyOutput: string[] = []

	let eventName: string | HashReference = eventNamesJson[event.EventID]?.Name
	eventName = eventName ? textMap.getText(eventName) : `${event.EventID} - ${event.EventDisplayID}`
	storyOutput.push(
		`===${eventName}===`
	)

	const devent = eventDisplayJson[event.EventDisplayID!]

	storyOutput.push(`;(If embarking on the path of [[${pathDisplayName(event.AeonOption)}]] in a Simulated Universe DLC)`)
	storyOutput.push(`:${event.AeonOption ? pathIcon(event.AeonOption) : '{{DIcon|Star}}'} ${textMap.getText(devent.EventTitle)} &mdash; ${textMap.getText(devent.EventDesc)}`)
	
	finalOutput.push(storyOutput.join('\n'))
}

writeFileSync('./output/path_choices.txt', finalOutput.join('\n\n'))