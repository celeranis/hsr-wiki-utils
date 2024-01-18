import config from '../config.json' with { type: "json" };
import { getFile } from './files/GameFile.js';
import type { Dictionary, Version } from './Shared.js';
import { whitespace } from './util/General.js';

export interface HashReference {
	Hash: number
}

export interface Sentence {
	TalkSentenceID: number
	TextmapTalkSentenceName: HashReference
	TalkSentenceText: HashReference
}

export type SupportedLanguage = 'CHS' | 'CHT' | 'DE' | 'EN' | 'ES' | 'FR' | 'ID' 
	| 'JP' | 'KR' | 'PT' | 'RU' | 'TH' | 'VI'

const sentenceJson: Dictionary<Sentence> = await getFile('ExcelOutput/TalkSentenceConfig.json')

export const OTHER_LANGUAGES: Dictionary<SupportedLanguage> = {
	en: 'EN',
	zhs: 'CHS',
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

export class TextMap {
	static readonly cache = new Map<`${SupportedLanguage}${Version}`, TextMap>()
	static readonly sentence_json: Dictionary<Sentence> = sentenceJson
	
	private constructor(public version: Version, public lang: SupportedLanguage, public json: Dictionary<string>) {
		TextMap.cache.set(`${this.lang}${this.version}`, this)
	}
	
	static async load(version: Version = config.target_version as Version, lang: SupportedLanguage = 'EN'): Promise<TextMap> {
		if (this.cache.has(`${lang}${version}`)) {
			return this.cache.get(`${lang}${version}`)!
		}
		
		const data: Dictionary<string> = await getFile(`TextMap/TextMap${lang}.json`, version)
		return new this(version, lang, data)
	}
	
	// via https://github.com/Dimbreath/StarRailData/issues/6#issuecomment-1639425428
	getStableHash(str: string) {
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
	
	replaceParams(text: string, params: (string | number | undefined)[]) {
		for (const [i, param] of params.entries()) {
			text = text.replaceAll(`#${i + 1}[i]%`, (param ? Math.round(Number(param) * 100).toString() : '??') + '%')
				.replaceAll(`#${i + 1}[i]`, param?.toString() || '??')
				.replaceAll(`#${i + 1}`, param?.toString() || '??')
		}
		return text
	}
	
	wikiFormatting(text: string, params?: (string | number | undefined)[], allowNewline: boolean = true): string {
		let replaced = text
			.replaceAll(/<\/?unbreak>/gi, '')
			.replaceAll(/{NICKNAME}/gi, '(Trailblazer)')
			.replaceAll(/<color=#(\w+)>(.+?)<\/color>/gi, (substr, color, text) => {
				if (color == 'dbc291ff') {
					return `{{Color|Keyword|${text}}}`
				} else if (color == 'f29e38ff') {
					return `{{Color|h|${text}}}`
				} else if (color == 'cdcdd8ff') {
					return text
				} else {
					return `<span style="color:#${color}">${text}</span>`
				}
			})
			.replaceAll(/{RUBY_B#(.+?)}(.+?){RUBY_E#}/gi, (_substr, topText, normalText) => `{{Rubi|${normalText}|${topText}}}`)
			.replaceAll(/–/g, '&ndash;')
			.replaceAll(/—/g, '&mdash;')
			.replaceAll(/×/g, '&times;')
		
		if (params) {
			replaced = this.replaceParams(replaced, params)
		}
		
		if (!allowNewline) {
			replaced = replaced.replaceAll('\n', ' ')
		}
		
		return replaced
	}
	
	getText(mapKey?: string | number | HashReference, params?: (string | number | undefined)[], allowNewline: boolean = true): string {
		if (!mapKey) return ''
		return this.wikiFormatting(this.json[((mapKey instanceof Object) && mapKey.Hash?.toString()) || mapKey.toString()] ?? '', params, allowNewline)
	}
	
	getSentence(sentence: Sentence | number | string, textOnly?: boolean, allowNewline: boolean = true) {
		if (typeof sentence != 'object') sentence = TextMap.sentence_json[sentence]
		if (!sentence) return undefined
		const name = this.getText(sentence.TextmapTalkSentenceName, undefined, false)
		const text = this.getText(sentence.TalkSentenceText, undefined, allowNewline)
		return this.wikiFormatting(!textOnly && name ? `'''${name}:''' ${text}` : text)
	}
	
	static async generateOL(key?: string | number | HashReference, params?: (string | number | undefined)[]): Promise<string> {
		const output = ['{{Other Languages']
		for (const [tkey, lang] of Object.entries(OTHER_LANGUAGES)) {
			output.push(`|${whitespace(tkey, 6)}= ${(await this.load(undefined, lang)).getText(key, params)}`)
		}
		output.push('}}')
		return output.join('\n')
	}
	
	static default: TextMap
}

export const textMap = await TextMap.load(config.target_version as Version, config.output_lang as SupportedLanguage)
TextMap.default = textMap