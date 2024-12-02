import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import config from '../../config.json' with { "type": "json" };
import { Dictionary, VERSION_COMMITS } from '../Shared.js';

export class HttpError extends Error {
	constructor(public path: string, public status: number, public statusText: string, public body: string) {
		super(`Error while fetching ${path}: ${status} ${statusText} – ${body}`)
	}
}

const ALT_PATTERNS = [
	'Config/Level/Rogue/RogueDialogue/',
	'Config/Level/Mission/',
	'Story/Mission/',
	'Story/Discussion/Mission/',
	'Config/Level/Rogue/RogueNPC/RogueNPC_260/',
	'Config/CutSceneCaption/',
	// 'ExcelOutput/Performance'
]

export function preprocessFile(obj: any) {
	for (const [key, value] of Object.entries(obj)) {
		if (value && typeof value == 'object') {
			preprocessFile(value)
		} else if (key == 'Value' && typeof value == 'number') {
			// round suspected floating point errors to integers
			const decimal = value % 1
			if (decimal != 0 && (decimal < 0.01 || decimal > 0.99)) {
				obj[key] = Math.round(value)
			}
		}
	}
	return obj
}

export const MISSING_FILES = new Set<string>()

export async function getFile<T extends object>(path: string, version: string = config.target_version): Promise<T> {
	path = path.trim()
	const useAlt = ALT_PATTERNS.find(pattern => path.toLowerCase().startsWith(pattern.toLowerCase())) != undefined
	
	if (useAlt ? config.local_roots_mission[version] : config.local_roots[version]) {
		
		// TEMPORARY
		if (useAlt && !existsSync(`${config.local_roots[version]}/${path}`)) {
			MISSING_FILES.add(path)
		}
		
		const altData = await readFile(`${useAlt ? config.local_roots_mission[version] : config.local_roots[version]}/${path}`)
			// .catch(err => {
			// 	console.warn(`Error while fetching local data for ${path}`)
			// 	throw err
			// })
		
		return preprocessFile(JSON.parse(altData.toString()))
	}
	
	const data = await fetch(`${config.repo_root}${VERSION_COMMITS[version] || version}/${path}`)
		.catch(err => {
			console.error(`Error while fetching ${path}`)
			throw err
		})
	
	if (!data.ok) {
		throw new HttpError(path, data.status, data.statusText, await data.text())
	}
	
	return data.json()
		.then(data => preprocessFile(data))
		.catch(err => {
			console.error(`Error while parsing JSON from ${path}`)
			throw err
		})
}

// for use with single-layer excel stuff only
// multi-layer excels (i.e. MazeBuff) will break
export async function getExcelFile<T extends object>(path: string, key: keyof T, version: string = config.target_version): Promise<Dictionary<T>> {
	path = path.trim()
	
	const file = await getFile<Dictionary<T> | T[]>(path.startsWith('ExcelOutput/') ? path : `ExcelOutput/${path}`, version)
	if (!Array.isArray(file)) {
		return file
	}
	
	return Object.fromEntries(Object.values(file).map(value => [key ? value[key] : Object.values(value)[0], value]))
}

// Same as getFile, but returns null if the file was not found
export function getFileSafe<T extends object>(...args: Parameters<typeof getFile>): Promise<T | null> {
	return getFile<T>(...args)
		.catch(err => {
			if (
				(err instanceof HttpError && err.status == 404) // file not found in remote repository
				|| (err instanceof Error && 'code' in err && err.code == 'ENOENT') // file not found on local system
			) {
				return null;
			}
			throw err;
		})
}

export class LazyData<T extends object> {
	data?: T
	public constructor(public path: string, public version?: string) {}

	async get(): Promise<T> {
		if (!this.isLoaded()) {
			this.data = await getFile<T>(this.path, this.version)
		}
		return this.data!
	}

	isLoaded(): this is { data: T } {
		return Boolean(this.data)
	}
}

export class LazyExcelData<T extends object> extends LazyData<Dictionary<T>> {
	constructor(path: string, public key: keyof T, version?: string) {
		super(path, version)
	}
	
	async get(): Promise<Dictionary<T>> {
		if (!this.isLoaded()) {
			this.data = await getExcelFile<T>(this.path, this.key, this.version)
		}
		return this.data!
	}
}

export function getAsset(path: string, from: 'Texture2D' | 'SpriteOutput' = 'Texture2D'): Promise<Buffer> {
	return readFile(`${config.asset_roots[from]}/${path}`)
}