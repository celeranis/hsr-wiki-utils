import { writeFile } from 'fs/promises';
import { Dictionary } from '../../Shared.js';
import { HashReference } from '../../TextMap.js';
import { getFile } from '../../files/GameFile.js';
import { teardown } from '../../util/JSONParser.js';

export interface VoiceData {
	VoiceID: number
	IsPlayerInvolved?: boolean
	VoicePath: string
	VoiceType?: string
}

interface LangData {
	AudioLanguageKey: string
	ShowString: HashReference
	AudioTrackIndex?: number
	WwiseLanguageKey: string
}

const langs = await getFile<Dictionary<LangData>>('ExcelOutput/AllowedAudioLanguage.json')
const voice = await getFile<Dictionary<VoiceData>>('ExcelOutput/VoiceConfig.json')

const output: string[] = []

function add(line: VoiceData, lang: LangData, gender?: string) {
	output.push(`${lang.WwiseLanguageKey}/voice/${line.VoicePath}${gender ? `_${gender}` : ''}.wem`)
}

for (const line of Object.values(voice)) {
	for (const lang of Object.values(langs)) {
		if (line.IsPlayerInvolved) {
			add(line, lang, 'm')
			add(line, lang, 'f')
		} else {
			add(line, lang)
		}
	}
}

writeFile('./output/Voice.txt', output.join('\n'))

teardown()