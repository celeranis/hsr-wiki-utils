import { getFile } from '../files/GameFile.js'
import { InternalTalkSentence } from '../files/Occurrence.js'
import { VoiceData } from '../scripts/vo/dump_vo_names.js'
import { textMap, TextMap } from '../TextMap.js'

export function getOriginalText(wikitext: string) {
	return wikitext
		.replaceAll(/<!--.+?-->/g, '') // remove comments
		.replaceAll(/{{sic}}/gi, '') // remove {{sic}}
		.replaceAll(/{{sic\|(.+?)}}/gi, '$1') // {{sic|some text}} -> some text
		.replaceAll(/\[\[([^\|]+)\]\]/gi, '$1') // [[direct links]] -> direct links
		.replaceAll(/\[\[.+?\|(.+?)\]\]/gi, '$1') // [[links with|labels]] -> labels
}

export function replaceString(wikitext: string, newString: string) {
	if (wikitext == newString) return newString // if the two are completely identical, we have nothing to do
	
	const originalWikiText = getOriginalText(wikitext)
	
	if (originalWikiText == newString) return wikitext // if the text is the same minus wikitext stuff, leave it unchanged
	
	let finalString = newString
	 
	// labeled links
	for (const [ _match, before, link, label, after ] of wikitext.matchAll(/(\w+|^|.)\[\[(.+?)\|(.+?)\]\](\w+|.|$)/gi)) {
		finalString = finalString.replace(before + label + after, `${before}[[${link}|${label}]]${after}`)
	}

	// direct links
	for (const [ _match, before, link, after ] of wikitext.matchAll(/(\w+|^|.)\[\[([^\|]+?)\]\](\w+|.|$)/gi)) {
		finalString = finalString.replace(before + link + after, `${before}[[${link}]]${after}`)
	}
	
	// {{sic}} without parameter
	for (const [ _match, before, after ] of wikitext.matchAll(/(\w+|^|.){{sic}}(\w+|.|$)/gi)) {
		finalString = finalString.replaceAll(before + after, `${before}{{sic}}${after}`)
	}

	// {{sic}} with parameter
	for (const [ _match, before, content, after ] of wikitext.matchAll(/(\w+|^|.){{sic\|(.+?)}}(\w+|.|$)/gi)) {
		finalString = finalString.replaceAll(before + content + after, `${before}{{sic|${content}}}${after}`)
	}
	
	return finalString
}

const VoiceConfig = await getFile<VoiceData[]>('ExcelOutput/VoiceConfig.json')
const TalkSentences = TextMap.sentence_json

export function resolveSentence(string: string) {
	let [ , vo ] = string.match(/{{A\|(.+?)(?:_[mf])\.ogg}}/) ?? []
	if (vo) {
		for (const voice of Object.values(VoiceConfig)) {
			const normalizedVoicePath = voice.VoicePath.toLowerCase().replaceAll(' ', '_')
			const normalizedVo = vo.toLowerCase().replaceAll(' ', '_')
			if (normalizedVoicePath == normalizedVo || normalizedVoicePath == normalizedVo.replace(/^vo_/i, '')) {
				const sentence = Object.values(TalkSentences).find(sentence => sentence.VoiceID == voice.VoiceID)
				return sentence
			}
		}
	}
	
	const candidates: [index: number, sentence: InternalTalkSentence, confidence: number][] = []
	
	const [ , speaker, content ] = string.match(/^:+'''(.+?):''' (.+)$/) ?? []
	if (content) {
		const normalContent = getOriginalText(content)
		for (const [index, sentence] of Object.entries(TalkSentences)) {
			if (textMap.getText(sentence.TalkSentenceText)) {
				
			}
		}
	}
}