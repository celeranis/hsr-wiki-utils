import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import config from '../config.json' with { type: "json" };
import { StringResolvable } from './Shared.js';
import type { SupportedLanguage } from './TextMap.js';

let useLang = config.output_lang as SupportedLanguage

if (!existsSync(`./i18n/${useLang}.json`)) {
	console.error(`Could not find i18n JSON for ${useLang}. Using EN instead.`)
	useLang = 'EN'
}

export const i18nData = JSON.parse((await readFile(`./i18n/${useLang}.json`)).toString())

export function i18n(key: keyof typeof i18n & string) {
	if (!(key in i18nData!)) {
		throw new Error(`Could not find key "${key}" in i18n/${useLang}.json`)
	}

	return i18nData![key]
}

export interface i18nArgs {
	"blessing.enhanced": {}
	"blessing.single_rarity": {
		rarity: number
		path: StringResolvable
	}
	"blessing.range_rarity": {
		rarity_min: number
		rarity_max: number
		path: StringResolvable
	}
}