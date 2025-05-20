import xxhash from 'xxhashjs';
import config from '../config.json' with { type: "json" };
import { AeonPath, roundTo, type Dictionary, type Value, type Version } from './Shared.js';
import { getExcelFile, getFile } from './files/GameFile.js';
import { whitespace } from './util/General.js';

export interface HashReference {
	Hash: number | bigint
}

export interface Sentence {
	TalkSentenceID: number
	VoiceID?: number
	TextmapTalkSentenceName: HashReference
	TalkSentenceText: HashReference
}

export interface TextJoinConfig {
	TextJoinID: number
	DefaultItem: number
	TextJoinItemList: number[]
}

export interface TextJoinItem {
	TextJoinItemID: number
	TextJoinText: HashReference
}

export interface VoiceConfig {
	VoiceID: number
	VoicePath: string
	IsPlayerInvolved?: boolean
	VoiceType: 'Story' | 'Cutscene' | 'StoryNew' | 'NPC_Normal' | 'NPC_Far' | 'Archive'
}

export interface MultiVoice {
	TalkSentenceID: number
	VoiceIDList: number[]
}

export type SupportedLanguage = 'CN' | 'CHS' | 'CHT' | 'DE' | 'EN' | 'ES' | 'FR' | 'ID' 
	| 'JP' | 'KR' | 'PT' | 'RU' | 'TH' | 'VI'

export const TalkSentenceConfig = await getFile<Sentence[]>('ExcelOutput/TalkSentenceConfig.json')
export const TextJoinConfig = await getFile<TextJoinConfig[]>('ExcelOutput/TextJoinConfig.json')
export const TextJoinItem = await getFile<TextJoinItem[]>('ExcelOutput/TextJoinItem.json')
export const VoiceConfig = await getExcelFile<VoiceConfig>('ExcelOutput/VoiceConfig.json', 'VoiceID')
export const TalkSentenceMultiVoice = await getExcelFile<MultiVoice>('ExcelOutput/TalkSentenceMultiVoice.json', 'TalkSentenceID')

export const OTHER_LANGUAGES: Dictionary<SupportedLanguage> = {
	en: 'EN',
	zhs: 'CN',
	zht: 'CHT',
	ja: 'JP',
	ko: 'KR',
	es: 'ES',
	fr: 'FR',
	ru: 'RU',
	th: 'TH',
	vi: 'VI',
	de: 'DE',
	id: 'ID',
	pt: 'PT'
}

export const COLOR_MAP = {
	'f29e38': 'h',
	'dd7a00': 'h',
	'dbc291': 'keyword',
	'42a8b9': 'fthuser',
	'87e0ff': 'blue',
	'77ede5': 'heliobus',
	'eb4d3d': 'fire',
	'ec505f': 'fire',
	'ff3a3e': 'red',
	'f3da75': 'imaginary',
	'6f7cda': 'hblue',
	'ad5e68': 'hred',
	'ff4f53': 'humanoid',
	'00f6ff': 'mechanical',
	'ab88fe': 'aberrant'
}

export type TextParams = (string | number | undefined | Value<number> | [number, number])[]

export class TextMap {
	static readonly cache = new Map<`${SupportedLanguage}${Version}`, TextMap>()
	static readonly sentence_json: Sentence[] = TalkSentenceConfig
	trailblazer?: string
	
	private constructor(public version: Version, public lang: SupportedLanguage, public json: Dictionary<string>) {
		TextMap.cache.set(`${this.lang}${this.version}`, this)
	}
	
	static async load(version: Version = config.target_version as Version, lang: SupportedLanguage = 'EN'): Promise<TextMap> {
		if (lang == 'CN' && config.using_dim_data) {
			lang = 'CHS'
		} else if (lang == 'CHS' && !config.using_dim_data) {
			lang = 'CN'
		}
		
		if (this.cache.has(`${lang}${version}`)) {
			return this.cache.get(`${lang}${version}`)!
		}
		
		const data: Dictionary<string> = await getFile(`TextMap/TextMap${lang}.json`, version)
		return new this(version, lang, data)
	}

	static getStableHash(str: string, xxHash: true): bigint
	static getStableHash(str: string, xxHash: false): number
	static getStableHash(str: string, xxHash?: boolean): number | bigint
	static getStableHash(str: string, xxHash: boolean = config.target_version >= '3.1'): number | bigint {
		if (xxHash) {
			return BigInt(xxhash.h64(str, 0).toString(10))
		} else {
			// via https://github.com/Dimbreath/StarRailData/issues/6#issuecomment-1639425428
			let hash1 = 5381n;
			let hash2 = 5381n;

			for (let i = 0; i < str.length && typeof str[i] !== 'undefined'; i += 2) {
				hash1 = ((hash1 << 5n) + hash1) ^ BigInt(str.charCodeAt(i));
				if (i + 1 < str.length) {
					hash2 = ((hash2 << 5n) + hash2) ^ BigInt(str.charCodeAt(i + 1));
				}
			}

			return Number(BigInt.asIntN(32, (hash1 + (hash2 * 1566083941n)) | 0n));
		}
    }
	
	replaceParams(text: string, params: TextParams) {
		for (let [i, param] of [...params.entries()].toReversed()) {
			if (typeof param == 'object' && !Array.isArray(param)) param = param.Value
			if (!param) {
				text = text.replaceAll(new RegExp(`{C\\d+#[^{}]*?<unbreak>#${i + 1}\\[?\\w+?\\]?%?</unbreak>[^{}]*?}`, 'gi'), '')
			} else {
				text = text.replaceAll(new RegExp(`{C\\d+#([^{}]*?<unbreak>#${i + 1}\\[?\\w+?\\]?%?<\\/unbreak>[^{}]*?)}`, 'gi'), '$1')
			}
			text = text.replaceAll(new RegExp(`<unbreak>#${i + 1}(?:\\[(\\w+)\\])?(%)?<\\/unbreak>`, 'g'), (_substr, mode: string, percent?: string) => {
				let factor = mode?.startsWith('f') ? Number(mode.substring(1)) : 2
				
				let additionalMult = 1
				if (percent) {
					additionalMult = 100
				} else {
					percent = ''
				}
				
				if (Array.isArray(param)) {
					if (param[0] != param[1]) {
						return ((param[0] ? roundTo(param[0] * additionalMult, factor).toLocaleString() : '??') + percent)
							+ '\\{–}'
							+ (param[1] ? roundTo(param[1] * additionalMult, factor).toLocaleString() : '??') + percent
						}
					else {
						param = param[0]
					}
				}
				
				return (param ? roundTo(Number(param) * additionalMult, factor).toLocaleString() : '??') + percent
			})
				.replaceAll(`#${i + 1}`, (param ?? '??').toLocaleString())
			
			// text = text
			// 	.replaceAll(`#${i + 1}[i]`, param?.toLocaleString() || '??')
			// 	.replaceAll(`#${i + 1}`, param?.toLocaleString() || '??')
		}
		return text
	}
	
	wikiFormatting(text: string, params?: TextParams, allowNewline: boolean = true): string {
		let replaced = text
		
		replaced = replaced
			.replaceAll(/{NICKNAME}/gi, `(${this.trailblazer ??= this.getTextRaw(6354779731002018877n)})`)
			.replaceAll('\\n', '\n')
			.replaceAll(/{(F|M)#([^}]+?)}{(F|M)#([^}]+?)}/gi,
				(_str: string, gender1: string, text1: string, gender2: string, text2: string) =>
					`⟨⟨MC|${gender1.toLowerCase() == 'm' ? 'm' : 'f'}=${text1}|${gender2.toLowerCase() == 'm' ? 'm' : 'f'}=${text2}⟩⟩`
			)
			.replaceAll(/(\s|^)(\S*\{[FM]#.+?\}[^\p{P}\s]*?)(\p{P}*)(\s|$)/giu, (_str: string, ws1: string, word: string, punct: string, ws2: string) => {
				const feminineWord = word
					.replaceAll(/{F#(.+?)}/gi, '$1')
					.replaceAll(/{M#(.+?)}/gi, '')

				const masculineWord = word
					.replaceAll(/{M#(.+?)}/gi, '$1')
					.replaceAll(/{F#(.+?)}/gi, '')

				return `${ws1}⟨⟨MC|f=${feminineWord}|m=${masculineWord}⟩⟩${punct}${ws2}`
			})
			.replaceAll(/<color=#(\w{1,6})\w{2}?>(.*?)<\/color>/gis, (substr, color, text) => {
				color = color.toLowerCase()
				if (COLOR_MAP[color]) {
					return `⟨⟨Color|${COLOR_MAP[color]}|${text}⟩⟩`
				} else if (color == 'cdcdd8') {
					return text
				} else {
					return `⟨⟨Color|#${color}|${text}⟩⟩`
				}
			})
			.replaceAll(/<size=([\-\+]?\d+)>(.*?)<\/size>/gis, '⟨⟨Size|$1|$2⟩⟩')
			.replaceAll(/<align="?(\w+)"?>(.*?)<\/align>/gis, '<div align="$1">$2</div>')
			.replaceAll(/{RUBY_B#(.+?)}(.+?){RUBY_E#}/gis, (_substr, topText, normalText) => `⟨⟨Rubi|${normalText}|${topText}⟩⟩`)
			.replaceAll(/{TEXTJOIN#(\d+)}/gi, (_substr, id) => `(${Object.values(TextJoinConfig).find(tj => tj.TextJoinID == id)?.TextJoinItemList.map(item => textMap.getText(Object.values(TextJoinItem).find(tj => tj.TextJoinItemID == item)?.TextJoinText)).join('/')})`)
			.replaceAll(/\{LAYOUT_(\w+)#([^}]+?)\}(?:\{LAYOUT_(\w+)#([^}]+?)\})?(?:\{LAYOUT_(\w+)#([^}]+?)\})?/gi, (_substr, method1, text1, method2, text2, method3, text3) => {
				const output = [`{{tt|${text1}|on ${method1.toLowerCase()}}}`]
				if (method2) {
					output.push(`{{tt|${text2}|on ${method2.toLowerCase()}}}`)
				}
				if (method3) {
					output.push(`{{tt|${text3}|on ${method3.toLowerCase()}}}`)
				}
				return `(${output.join('/')})`
			})

		if (params) {
			replaced = this.replaceParams(replaced, params)
		}
		
		replaced = replaced
			// .replaceAll(/–/g, '&ndash;')
			.replaceAll(/—/g, '&mdash;')
			.replaceAll(/\\\{–\}/g, '—')
			.replaceAll(/\u00d7/g, '&times;')
			.replaceAll(/'(<\s*\/?\s*(?:i|b)\s*>)/gi, '&ast;$1')
			.replaceAll(/(<\s*\/?\s*(?:i|b)\s*>)'/gi, '&ast;$1')
			.replaceAll(/<\s*\/?\s*i\s*>/gi, "''")
			.replaceAll(/<\s*\/?\s*b\s*>/gi, "'''")
			.replaceAll(/\u00a0/g, this.lang == 'KR' ? ' ' : '&nbsp;')
			.replaceAll(/⟨⟨Color\|(\w+?)\|(\s*)(.+?)(\s*)⟩⟩/gis, '$2⟨⟨Color|$1|$3⟩⟩$4')
			.replaceAll(/⟨⟨Color\|\w+?\|⟩⟩/gis, '')
			.replaceAll(/<\/?unbreak>/gi, '')
			.replaceAll('{SPACE}', ' ')
		
		if (!allowNewline) {
			replaced = replaced.replaceAll('\n', ' ')
		}
		
		// revert temporary {} escapes as they are used in both mediawiki and textmap syntax,
		// creating awkward edge cases
		replaced = replaced
			.replaceAll('⟨', '{')
			.replaceAll('⟩', '}')
		
		return replaced
	}
	
	getTextRaw(key: number | bigint | HashReference) {
		return this.json[typeof key == 'object' ? key.Hash.toString() : key.toString()]
	}
	
	getText(mapKey?: string | number | bigint | HashReference, params?: TextParams, allowNewline: boolean = true): string {
		if (!mapKey) return ''
		if (typeof mapKey == 'string' && !Number(mapKey)) {
			mapKey = TextMap.getStableHash(mapKey.toString())
		}
		return this.wikiFormatting((this.json[(typeof mapKey == 'object' && mapKey.Hash?.toString()) || mapKey.toString()] ?? '').replaceAll('|', '&vert;'), params, allowNewline)
	}
	
	getSentence(sentence: Sentence | number | string, textOnly: boolean = false, allowNewline: boolean = true, allowVO: boolean = true) {
		if (typeof sentence != 'object') sentence = Object.values(TextMap.sentence_json).find(sent => sent.TalkSentenceID == sentence)!
		if (!sentence) return undefined
		const name = this.getText(sentence.TextmapTalkSentenceName, undefined, false)
		const text = this.getText(sentence.TalkSentenceText, undefined, allowNewline)
			.replaceAll('\n', '<br />')
			.replaceAll(/{{Color\|(\w+)\|/g, '{{Color|$1|nobold=1|')
		
		let voiceIds: number[] | undefined = undefined
		if (allowVO) {
			if (TalkSentenceMultiVoice[sentence.TalkSentenceID]) {
				voiceIds = TalkSentenceMultiVoice[sentence.TalkSentenceID].VoiceIDList
			} else if (sentence.VoiceID) {
				voiceIds = [sentence.VoiceID]
			}
		}
		
		const vo = (allowVO && voiceIds) ? voiceIds.filter(id => VoiceConfig[id]).map(id => {
			const voice = VoiceConfig[id]
			const voicePath = voice.VoicePath.replaceAll('_', ' ')
			if (voice.IsPlayerInvolved) {
				return `{{A|VO ${voicePath} m.ogg}} {{A|VO ${voicePath} f.ogg}} `
			} else {
				return `{{A|VO ${voicePath}.ogg}} `
			}
		}).join('') : ''
		
		return vo + this.wikiFormatting(!textOnly && name ? `'''${name}:''' ${text.includes('<br />') ? '<br />' : ''}${text}` : text)
	}
	
	getSentenceMeta(sentenceId: number | string) {
		const sentence = Object.values(TextMap.sentence_json).find(sent => sent.TalkSentenceID == sentenceId)
		if (!sentence) return undefined
		
		return {
			id: sentence.TalkSentenceID,
			speaker: textMap.getText(sentence.TextmapTalkSentenceName),
			content: textMap.getText(sentence.TalkSentenceText)
		}
	}
	
	/**
	 * Utility function for printing the occurrences 
	 * of a specific tag along with its usage.
	 * 
	 * Intended for command-line and sandbox usage.
	 */
	getTagUsage(tagName: string): void {
		const usage: Record<string, string[]> = {}
		const pattern = new RegExp(`<\\s*${tagName}.*?>`, 'gi')
		
		for (const [_hash, entry] of Object.entries(this.json)) {
			for (const match of entry.matchAll(pattern)) {
				usage[match[0]] ??= []
				usage[match[0]].push(entry)
			}
		}
		
		console.group(`Usage of ${tagName}:`)
		for (const [tag, occurrences] of Object.entries(usage)) {
			console.group(`${occurrences.length} uses of ${tag}. First five:`)
			let printedCount = 0
			for (const text of occurrences) {
				if (text.length < 250) {
					console.log(text)
					printedCount++
				}
				if (printedCount >= 5) break
			}	
			console.groupEnd()
		}
		console.groupEnd()
	}
	
	static async generateOL(keys?: (string | number | bigint | HashReference) | (string | number | bigint | HashReference | undefined)[], params?: TextParams): Promise<string> {
		const output = ['{{Other Languages']
		if (!Array.isArray(keys)) keys = [keys]
		const targetWsp = keys.length > 1 ? 9 : 5
		for (const [i, key] of keys.entries()) {
			if (i != 0) output.push('')
			for (let [tkey, lang] of Object.entries(OTHER_LANGUAGES)) {
				if (keys.length > 1) tkey = `${i+1}_${tkey}`
				output.push(`|${whitespace(tkey, targetWsp)}= ${(await this.load(undefined, lang)).getText(key, params)}`)
			}
		}
		output.push('}}')
		return output.join('\n')
	}
	
	static default: TextMap
}

export const textMap = await TextMap.load(config.target_version as Version, config.output_lang as SupportedLanguage)
TextMap.default = textMap

export const LOCALIZED_NAMES = {
	// paths
	Destruction: 10116566940563878966n,
	TheHunt: 4367365179576232430n,
	Erudition: 6325610700042370526n,
	Harmony: 232967775503330328n,
	Nihility: 10009174905191400515n,
	Preservation: 4258030345548324088n,
	Abundance: 21284642533200943n,
	Remembrance: 119435972213994950n,
	Elation: 14156660547976442090n,
	Propagation: 8204925788599882675n,
	Trailblaze: 8687582118987184760n,
	RuanMei: 12487974543366005194n,

	// types
	Physical: 16955357985363994060n,
	Fire: 1719817313615897075n,
	Ice: 17771509087530210676n,
	Lightning: 2257691052810076110n,
	Wind: 11465789813865379720n,
	Quantum: 14107960176367381646n,
	Imaginary: 17452231582631645515n,
}

export function pathDisplayName(pathName: string): string {
	switch (pathName) {
		case 'Destruction':
		case 'Warrior':
			return textMap.getText(LOCALIZED_NAMES.Destruction)
		case 'The Hunt':
		case 'TheHunt':
		case 'Rogue':
			return textMap.getText(LOCALIZED_NAMES.TheHunt)
		case 'Erudition':
		case 'Mage':
			return textMap.getText(LOCALIZED_NAMES.Erudition)
		case 'Harmony':
		case 'Shaman':
			return textMap.getText(LOCALIZED_NAMES.Harmony)
		case 'Nihility':
		case 'Warlock':
			return textMap.getText(LOCALIZED_NAMES.Nihility)
		case 'Preservation':
		case 'Knight':
			return textMap.getText(LOCALIZED_NAMES.Preservation)
		case 'Abundance':
		case 'Priest':
			return textMap.getText(LOCALIZED_NAMES.Abundance)
		case 'Remembrance':
		case 'Memory':
			return textMap.getText(LOCALIZED_NAMES.Remembrance)
		default:
			return LOCALIZED_NAMES[pathName] ? textMap.getText(LOCALIZED_NAMES[pathName]) : pathName
	}
}

export function typeDisplayName(type: string): string {
	switch (type) {
		case 'Thunder':
		case 'Lightning':
			return textMap.getText(LOCALIZED_NAMES.Lightning)
		default:
			return LOCALIZED_NAMES[type] ? textMap.getText(LOCALIZED_NAMES[type]) : type
	}
}

export function pathListDisplay(pathNames: AeonPath[]) {
	if (pathNames.length == 1) return pathDisplayName(pathNames[0])
	if (pathNames.length == 2) return `${pathDisplayName(pathNames[0])} or ${pathDisplayName(pathNames[1])}`
	return [...pathNames.slice(0, -1).map(name => pathDisplayName(name)), 'or ' + pathDisplayName(pathNames[pathNames.length])].join(', ')
}