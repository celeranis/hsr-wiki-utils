import { Mwn } from 'mwn';
import { MwnError } from 'mwn/build/error.js';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
import config from '../../config.json' with { type: 'json' };

export const client = new Mwn(config.wikibot_options)

await client.login()

export const fileRedirectMap: Record<string, string> =
	existsSync('./src/version_update/FileRedirectMap.json')
		? JSON.parse((await readFile('./src/version_update/FileRedirectMap.json')).toString())
		: {}

export function retryIfRatelimit<T>(action: (() => Promise<T>), cooldown: number = 20, cooldownRamp: number = 1.5): Promise<T> {
	return action()
		.catch(async err => {
			if (err instanceof MwnError && err.code == 'ratelimited') {
				console.log(`Ratelimited, waiting ${cooldown} seconds...`)
				await setTimeout(cooldown * 1000)
				return retryIfRatelimit(action, cooldown * cooldownRamp, cooldownRamp)
			} else if (err instanceof Error && ('code' in err && err.code == 'ECONNABORTED') || ('response' in err && err.response && err.response.status == 503)) {
				console.log(`Request timed out or returned server error, waiting ${cooldown * 10} seconds...`)
				await setTimeout(cooldown * 1000 * 10)
				return retryIfRatelimit(action, cooldown * cooldownRamp, cooldownRamp)
			} else {
				throw err
			}
		})
}
		
export async function redirectRetry(from: string, to: string, summary: string) {
	const err = await retryIfRatelimit(() => client.create(from, `#REDIRECT [[${to}]]\n\n[[Category:Redirect Pages]]`, `${summary} — Redirecting page to [[${to}]]`))
		.catch(err => err)
		
	if (err && err instanceof Error) {
		if (err instanceof MwnError && err.code == 'articleexists') {
			console.log(`Redirect "${from}" → "${to}" already exists`)
		} else {
			console.error(err)
		}
	} else {
		console.log(`Redirected "${from}" to "${to}"`)
	}
}

export async function uploadRetry(file: string, fileName: string, categories: string, reason: string) {
	if (fileRedirectMap[file] == fileName) {
		return
	} else if (fileRedirectMap[file]) {
		await redirectRetry('File:' + fileName, 'File:' + fileRedirectMap[file], reason)
	}
	
	let pageContent = `==Summary==\n{{File\n|categories = ${categories}\n}}\n\n==Licensing==\n{{Fairuse}}`
	
	await client.upload(file, fileName, pageContent, {
		comment: reason,
		ignorewarnings: false
	}).then(async result => {
		if (result.result == 'Warning') {
			const dupe_of = result.warnings?.duplicate?.toString()?.replaceAll('_', ' ')
			if (dupe_of) {
				fileRedirectMap[file] = dupe_of
				await redirectRetry('File:' + fileName, 'File:' + dupe_of, reason)
				return
			}

			if (result.warnings?.exists) {
				const currentContent = (await client.read('File:' + fileName)).revisions?.[0]?.content
				if (!currentContent || currentContent.includes('{{Placeholder Image')) {
					// if this is placeholder image, we can safely replace it
					await client.upload(file, fileName, pageContent, {
						comment: reason,
						ignorewarnings: true
					})
					// and remove the placeholder template
					await client.save('File:' + fileName, pageContent, reason)
				}
			}
		} else if (result.filename) {
			fileRedirectMap[file] = result.filename.replaceAll('_', ' ')
		}
	}).catch(async err => {
		if (err instanceof MwnError && err.code == 'ratelimited') {
			await setTimeout(20_000)
			await uploadRetry(file, fileName, categories, reason)
		}
	}).finally(() => {
		console.log(`Uploaded "${fileName}"`)
	})
}