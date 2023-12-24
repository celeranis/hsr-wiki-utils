import { readFileSync } from 'node:fs';
import config from '../config.json' with { type: "json" };

export interface HashReference {
	Hash: number
}

export interface Sentence {
	TalkSentenceID: number
	TextmapTalkSentenceName: HashReference
	TalkSentenceText: HashReference
}

export class TextMap {
	readonly json: {[mapKey: string]: string}
	readonly sentence_json: {[mapKey: string]: Sentence}
	
	constructor(public version: string) {
		this.json = JSON.parse(readFileSync(`./versions/${version}/TextMapEN.json`).toString())
		this.sentence_json = JSON.parse(readFileSync(`./versions/${version}/TalkSentenceConfig.json`).toString())
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
			text = text.replaceAll(`#${i + 1}`, param?.toString() || '??')
				.replaceAll(`#${i + 1}[i]`, param?.toString() || '??')
		}
		return text
	}
	
	wikiFormatting(text: string, params?: (string | number | undefined)[]): string {
		let replaced = text
			.replaceAll(/<\/?unbreak>/gi, '')
			.replaceAll(/\\n/gi, ' ')
			.replaceAll(/{NICKNAME}/gi, '(Trailblazer)')
			.replaceAll(/<color=#(\w+)>(.+?)<\/color>/gi, (substr, color, text) => {
				if (color == 'dbc291ff') {
					return `{{Color|Keyword|${text}}}`
				} else if (color == 'cdcdd8ff') {
					return text
				} else {
					return `<span style="color:#${color}">${text}</span>`
				}
			})
			.replaceAll(/{RUBY_B#(.+?)}(.+?){RUBY_E#}/gi, (_substr, topText, normalText) => `{{Rubi|${normalText}|${topText}}}`)
			.replaceAll(/–|—/g, '&mdash;')
		
		if (params) {
			replaced = this.replaceParams(replaced, params)
		}
		
		return replaced
	}
	
	getText(mapKey?: string | number | HashReference, params?: (string | number | undefined)[]): string {
		if (!mapKey) return ''
		return this.wikiFormatting(this.json[((mapKey instanceof Object) && mapKey.Hash?.toString()) || mapKey.toString()] ?? '', params)
	}
	
	getSentence(sentence: Sentence | number | string, textOnly?: boolean) {
		if (typeof sentence != 'object') sentence = this.sentence_json[sentence]
		if (!sentence) return undefined
		const name = this.getText(sentence.TextmapTalkSentenceName)
		const text = this.getText(sentence.TalkSentenceText)
		return this.wikiFormatting(!textOnly ? `'''${name}:''' ${text}` : text)
	}
	
	static default = new TextMap(config.target_version)
}