import { readFile } from 'fs/promises';
import config from '../../config.json' with { "type": "json" };
import { VERSION_COMMITS } from '../Shared.js';

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
