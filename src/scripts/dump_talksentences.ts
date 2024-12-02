import { writeFileSync } from 'fs';
import { readFile, readdir } from 'fs/promises';
import config from '../../config.json' with { "type": "json" };
import { DICON_MAP, Dictionary } from '../Shared.js';
import { textMap } from '../TextMap.js';
import { getFile } from '../files/GameFile.js';
import { InternalTalkSentence } from '../files/Occurrence.js';
import { Act, InternalDialogTask } from '../files/graph/Dialog.js';
import type { VoiceData } from './vo/dump_vo_names.js';

const TalkSentences = await getFile<InternalTalkSentence[]>('ExcelOutput/TalkSentenceConfig.json')
const VoiceData = await getFile<VoiceData[]>('ExcelOutput/VoiceConfig.json')

const output: string[] = []
const outputVoices: string[] = []
const diconMap: Dictionary<string> = {}

function process(task: InternalDialogTask) {
	if (task.$type == 'RPG.GameCore.PlayOptionTalk') {
		for (const option of task.OptionList) {
			if (!option.OptionIconType) continue
			console.log(`Mapped ${option.TalkSentenceID} to ${option.OptionIconType}`)
			diconMap[option.TalkSentenceID] = option.OptionIconType
		}
	} else if (task.$type == 'RPG.GameCore.PlayRogueOptionTalk') {
		for (const option of task.OptionList) {
			if (!option.TalkSentenceID) continue
			diconMap[option.TalkSentenceID] = option.OptionIconType
		}
	} else if (task.$type == 'RPG.GameCore.PerformanceTransition') {
		if (task.TalkSentenceID) {
			diconMap[task.TalkSentenceID] = 'BlackScreen'
		}
	} else if (task.$type == 'RPG.GameCore.PredicateTaskList') {
		task.SuccessTaskList?.forEach(task => process(task))
		task.FailedTaskList?.forEach(task => process(task))
	}
}

function searchAct(act: Act) {
	for (const sequence of act.OnStartSequece) {
		if (!Array.isArray(sequence.TaskList)) continue
		for (const task of sequence.TaskList) {
			process(task)
 		}
	}
}

const files = [
	...await readdir(config.local_roots[config.target_version], { recursive: true, withFileTypes: true }),
	...await readdir(config.local_roots_mission[config.target_version], { recursive: true, withFileTypes: true })
]

for (const file of files) {
	if (!file.isFile()) continue
	const normalPath = file.path.replaceAll('\\', '/')
	if (normalPath.includes('/Story/') || normalPath.includes('/Level')) {
		const fileContent = (await readFile(`${file.path}/${file.name}`)).toString()
		// console.log(`Read ${file.path}/${file.name}`)
		if (fileContent.includes('"OnStartSequece"')) {
			// console.log(`Parsing ${file.path}/${file.name}`)
			const json = JSON.parse(fileContent)
			if (json.OnStartSequece) {
				searchAct(json)
			}
		}
	}
}

for (const sentence of Object.values(TalkSentences)/*.sort((a, b) => (a.TalkSentenceID - b.TalkSentenceID))*/) {
	const content = textMap.getText(sentence.TalkSentenceText).replaceAll('\n', '<br />').replaceAll(/{{Color\|(.+?)\|/gi, '{{Color|$1|nobold=1|')
	if (!content) continue
	
	let voice = ''
	const voiceDat = sentence.VoiceID && Object.values(VoiceData).find(voice => voice.VoiceID == sentence.VoiceID)
	if (voiceDat) {
		let vp = voiceDat.VoicePath.replaceAll('_', ' ')
		if (!vp.startsWith('vo')) {
			vp = `VO ` + vp
		}
		vp = vp.replace(/^vo/, 'VO')
		if (voiceDat.IsPlayerInvolved) {
			voice = `{{A|${vp} m.ogg}} {{A|${vp} f.ogg}} `
		} else {
			voice = `{{A|${vp}.ogg}} `
		}
	}
	
	if (diconMap[sentence.TalkSentenceID]) {
		switch (diconMap[sentence.TalkSentenceID]) {
			case 'BlackScreen':
				output.push(`:{{Black Screen|${content}}}`)
				outputVoices.push(`:${voice}{{Black Screen|${content}}}`)
				break
			default:
				output.push(`:{{DIcon|${DICON_MAP[diconMap[sentence.TalkSentenceID]]}}} ${content}`)
				outputVoices.push(`:{{DIcon|${DICON_MAP[diconMap[sentence.TalkSentenceID]]}}} ${voice}${content}`)
				break
		}
	} else if (textMap.getText(sentence.TextmapTalkSentenceName)) {
		output.push(`:'''${textMap.getText(sentence.TextmapTalkSentenceName)}:''' ${content}`)
		outputVoices.push(`:${voice}'''${textMap.getText(sentence.TextmapTalkSentenceName)}:''' ${content}`)
	} else {
		output.push(`:${content}`)
		outputVoices.push(`:${voice}${content}`)
	}
}

writeFileSync('./output/talksentences.wikitext', output.join('\n'))
writeFileSync('./output/talksentences-voices.wikitext', outputVoices.join('\n'))