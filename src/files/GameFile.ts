import { readFile } from 'fs/promises';
import config from '../../config.json' with { "type": "json" };
import { Dictionary, VERSION_COMMITS } from '../Shared.js';

export class HttpError extends Error {
	constructor(public path: string, public status: number, public statusText: string, public body: string) {
		super(`Error while fetching ${path}: ${status} ${statusText} – ${body}`)
	}
}

export async function getFile<T extends object>(path: string, version: string = config.target_version): Promise<T> {
	if (config.local_roots[version]) {
		return JSON.parse((await readFile(`${config.local_roots[version]}/${path}`)).toString())
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
		.catch(err => {
			console.error(`Error while parsing JSON from ${path}`)
			throw err
		})
}

// for use with single-layer excel stuff only
// multi-layer excels (i.e. MazeBuff) will break
export async function getExcelFile<T extends object>(path: string, version: string = config.target_version): Promise<Dictionary<T>> {
	const file = await getFile<Dictionary<T> | T[]>(path.startsWith('ExcelOutput/') ? path : `ExcelOutput/${path}`, version)
	if (!Array.isArray(file)) {
		return file
	}
	
	return Object.fromEntries(Object.values(file).map(value => [Object.values(value)[0], value]))
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
		return this.data as T
	}

	isLoaded(): this is { data: T } {
		return Boolean(this.data)
	}
}

export function getAsset(path: string, from: 'Texture2D' | 'SpriteOutput' = 'Texture2D'): Promise<Buffer> {
	return readFile(`${config.asset_roots[from]}/${path}`)
}