import { existsSync, readFileSync, writeFileSync } from 'fs'
import { Act } from '../Dialog.js'
import type { InternalEventName, InternalEventSection, InternalEventSectionDisplay, InternalTalkSentence } from '../Event.js'
import { TextMap } from '../TextMap.js'

const VERSION_COMMITS = {
	'1.0': '4a36e628f9f34e6221b167b6ae0235a2f3934330',
	'1.1': '1ab86f99405026f6c9b1be98661a584e1a38a0df',
	'1.2': '900fa36177ffd66e7d70d2c21276c5bc0662212d',
	'1.3': 'aa811519a5de772bf4055e8ea8b9254f90b7746c',
	'1.4': '6acdba35cbf80adc100dbde528b1c271f50dcb9d',
	'1.5': '59d64be43a1da285cf22ba9be5ed90ef2b23f857',
}
const versions = ['1.1', '1.2', '1.3', '1.4', '1.5']

async function getEventsForVersion(version: string): Promise<[Map<string, string>, Map<string, string[][]>, Map<string, Map<string, string>>]> {
	const textMap = new TextMap(version)
	
	const eventNamesJson: {[id:string]: InternalEventName} = JSON.parse(readFileSync(`./versions/${version}/RogueTalkNameConfig.json`).toString())
	const eventNpcsJson: { [id: string]: InternalEventName } = JSON.parse(readFileSync(`./versions/${version}/RogueNPCDialogue.json`).toString())
	const eventInfoJson: {[id:string]: InternalEventSection} = JSON.parse(readFileSync(`./versions/${version}/DialogueEvent.json`).toString())
	const eventDisplayJson: {[id:string]: InternalEventSectionDisplay} = existsSync(`./versions/${version}/DialogueEventDisplay.json`) ? JSON.parse(readFileSync(`./versions/${version}/DialogueEventDisplay.json`).toString()) : {}
	const talkSentences: {[id: string]: InternalTalkSentence} = JSON.parse(readFileSync(`./versions/${version}/TalkSentenceConfig.json`).toString())

	const eventNames = new Map<string, string>()
	const eventText = new Map<string, string[][]>()
	const eventOptions = new Map<string, Map<string, string>>()
	
	function getSentence(sentenceId: number) {
		const sentence = talkSentences[sentenceId]
		return `'''${textMap.getText(sentence.TextmapTalkSentenceName)}:''' ${textMap.getText(sentence.TalkSentenceText)}`
	}
	
	for (const [id, event] of Object.entries(eventNamesJson)) {
		eventNames.set(id, textMap.getText(event.Name))
		const eventNpcs = eventNpcsJson[id]
		if (eventNpcs) {
			const textList: string[][] = []
			const textOptions = new Map<string, string>()
			for (const npc of Object.values(eventNpcs)) {
				const dialogRes = await fetch(`https://raw.githubusercontent.com/Dimbreath/StarRailData/${VERSION_COMMITS[version]}/${npc.DialoguePath}`)
				if (!dialogRes.ok) continue
				const dialog: Act = await dialogRes.json()
				if (!dialog.OnStartSequece) continue
				for (const sequence of dialog.OnStartSequece) {
					for (const task of sequence.TaskList) {
						if (task.$type == 'RPG.GameCore.PlayAndWaitSimpleTalk') {
							textList.push(task.SimpleTalkList.map(talk => getSentence(talk.TalkSentenceID)))
						}
						if (task.$type == 'RPG.GameCore.PlayOptionTalk') {
							task.OptionList.forEach(talk => {
								const event = eventInfoJson[talk.DialogueEventID]
								if (!event) return
								const displayEvent = event.EventDisplayID ? eventDisplayJson[event.EventDisplayID] : event
								textOptions.set(talk.DialogueEventID?.toString(), `${textMap.getText(displayEvent.EventTitle)} &mdash; ${textMap.getText(displayEvent.EventDesc)}`)
							})
						}
					}
				}
			}
			eventText.set(id, textList)
			eventOptions.set(id, textOptions)
		}
	}
	
	return [eventNames, eventText, eventOptions]
}

function compare(eventSet, prevEventSet): string[] {
	const newNames: Map<string, string> = eventSet[0]
	const oldNames: Map<string, string> = prevEventSet[0]
	const newText: Map<string, string[][]> = eventSet[1]
	const oldText: Map<string, string[][]> = prevEventSet[1]
	const newOptions: Map<string, Map<string, string>> = eventSet[2]
	const oldOptions: Map<string, Map<string, string>> = prevEventSet[2]
	
	const addedEvents: string[] = []
	const changedEventText = new Map<string, [string, string][]>()
	
	for (const [id, name] of newNames.entries()) {
		let oldId = id
		if (!oldNames.has(oldId)) {
			for (const [oid, oldName] of oldNames.entries()) {
				if (oldName == name) oldId = oid
			}
		}
		if (!oldNames.has(oldId)) {
			addedEvents.push(name)
		} else {
			const newt = newText.get(id)
			const oldt = oldText.get(oldId)
			if (!newt || !oldt) {
				// console.log(id, newt, oldt)
				continue
			}
			for (let i = 0; i < newt.length; i++) {
				if (!oldt[i]) continue
				for (let i2 = 0; i < newt[i].length; i++) {
					if (newt[i][i2] != oldt[i][i2]) {
						if (!changedEventText.has(id)) changedEventText.set(id, [])
						const changedList = changedEventText.get(id)!
						changedList.push([newt[i][i2], oldt[i][i2]])
					}
				}
			}
			
			const newo = newOptions.get(id)
			const oldo = oldOptions.get(oldId)
			if (!newo || !oldo) {
				continue
			}
			for (const [oid, newOpt] of newo.entries()) {
				const oldOpt = oldo.get(oid)
				if (newOpt != oldOpt) {
					if (!changedEventText.has(id)) changedEventText.set(id, [])
					const changedList = changedEventText.get(id)!
					changedList.push([newOpt, oldOpt || '[none]'])
				}
			}
		}
	}
	
	let output: string[] = []
	
	if (addedEvents.length) {
		output.push('* Added the following Events:')
		output.push(...addedEvents.map(name => `** ${name}`))
	}

	changedEventText.forEach((diffs, event) => {
		output.push(`* The Event "${newNames.get(event)}" was updated:`)
		for (const [newText, oldText] of diffs) {
			output.push(`** {{Color|Old}}: ${oldText}`)
			output.push(`** {{Color|New}}: ${newText}`)
		}
	})
	
	return output
}

const startingEvents = await getEventsForVersion('1.0')
const finalOutput: string[] = []

const versionOutput: string[] = []
versionOutput.push('[[Version 1.0]]')
versionOutput.push('* Simulated Universe was released with the following Events:')
versionOutput.push(...startingEvents[0].values())
finalOutput.push(versionOutput.join('\n'))

let prevEvents = startingEvents
for (const version of versions) {
	const versionEvents = await getEventsForVersion(version)
	const versionOutput: string[] = []
	versionOutput.push(`[[Version ${version}]]`)
	versionOutput.push(...compare(versionEvents, prevEvents))
	prevEvents = versionEvents
	finalOutput.push(versionOutput.join('\n'))
}

writeFileSync('./output/event-changelog.txt', '{{Change History/Header}}\n' + finalOutput.reverse().join('\n----\n'))