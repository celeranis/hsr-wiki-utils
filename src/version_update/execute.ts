import { program } from 'commander'
import { Dirent, existsSync } from 'fs'
import { readFile, readdir, writeFile } from 'fs/promises'
import { MwnError } from 'mwn/build/error.js'
import config from '../../config.json' with { "type": 'json' }
import { COMMON_ICON_MAP } from '../Item.js'
import { sanitizeString, zeroPad } from '../Shared.js'
import { AWB } from '../util/AWB.js'
import { client } from '../util/Bot.js'

const MOVE: Record<string, string> = {
	
}

const REDIRECT: Record<string, string> = {
	
}

let fileRedirectMap: Record<string, string> = 
	existsSync('./src/version_update/FileRedirectMap.json')
		? JSON.parse((await readFile('./src/version_update/FileRedirectMap.json')).toString())
		: {}

for (const [key, val] of Object.entries(COMMON_ICON_MAP)) {
	fileRedirectMap[config.asset_roots.Texture2D + '/' + key] = val
}

async function checkPages(pages: string[], shouldExist: boolean = false) {
	let foundPages = await client.read(pages)
	if (!Array.isArray(foundPages)) {
		foundPages = [foundPages]
	}
	for (const page of foundPages) {
		if (page.invalid) {
			console.error(`"${page.title}" is invalid!`)
		}
		if (shouldExist && page.missing) {
			console.error(`"${page.title}" should exist, but does not!`)
		} else if (!shouldExist && !page.missing) {
			console.error(`"${page.title}" shouldn't exist, but does!`)
		} else {
			console.debug(`${page.title} is ready!`)
		}
	}
}

program
	.option('--reason <reason>', 'The reason to include with this action', config.target_version)
	.option('--check')
	.option('--midpatch <midpatch>', 'The subfolder of "midpatch" to use')
	.parse()

const args = program.opts()

const asiaTime = new Date(Date.now() + (1000 * 60 * 60 * 8))
const midpatch = args.midpatch == 'today' ? `${asiaTime.getUTCFullYear()}-${zeroPad(asiaTime.getUTCMonth()+1, 2)}-${zeroPad(asiaTime.getUTCDate(), 2)}`
	: args.midpatch

const REASON = args.reason
const CHECK = args.check
const ROOT = midpatch ? `./src/version_update/midpatch/${midpatch}` : './src/version_update'

const CHECK_NOEXIST: string[] = []
const CHECK_EXIST: string[] = []

if (!existsSync(ROOT)) {
	console.warn(`Nothing to upload in "${ROOT}", exiting...`)
	process.exit()
}

async function getFile(file: string): Promise<[string, string]> {
	let content = (await readFile(file)).toString()
	const page = content.match(/PageTitle\s*=\s*#(.+?)#/i)?.[1]
	if (!page) {
		throw new TypeError(`No PageTitle on ${file}`)
	}

	content = content.replace(/<%\-\-\s+\[PAGE_INFO\].+\[END_PAGE_INFO\]\s+\-\-%>/is, '').trimStart()
	
	// console.log(content)
	
	return [page, content]
}

async function processUploadPrompts(content: string): Promise<void> {
	const alreadyUploaded = new Set<string>()
	for (const [, path, filename, categories] of content.matchAll(/\$UPLOAD:<<(.+?)>-<(.+?)>-<(.+?)>>/g)) {
		if (alreadyUploaded.has(filename)) continue
		alreadyUploaded.add(filename)
		
		const sanitizedName = sanitizeString(filename)
		await upload(config.asset_roots.Texture2D + '/' + path, sanitizedName, categories)
		if (filename != sanitizedName) {
			await redirect('File:' + filename, 'File:' + sanitizedName)
		}
	}
}

async function move(from: string, to: string, summary: string = REASON) {
	if (!CHECK) {
		await client.move(from, to, summary)
			.catch(console.error)
		console.log(`Moved "${from}" to "${to}"`)
	} else {
		CHECK_EXIST.push(from)
		CHECK_NOEXIST.push(to)
	}
}

async function create(file: string, summary: string = REASON) {
	const [page, content] = await getFile(file)
	
	if (!CHECK) {
		await client.create(page, content, summary)
			.catch(console.error)
		console.log(`Created "${page}"`)
	} else {
		CHECK_NOEXIST.push(page)
	}
	await processUploadPrompts(content)
}

async function edit(file: string, summary: string = REASON) {
	const [page, content] = await getFile(file)
	
	if (!CHECK) {
		await client.save(page, content, summary)
			.catch(console.error)
		console.log(`Edited "${page}"`)
	} else {
		CHECK_EXIST.push(page)
	}
	await processUploadPrompts(content)
}

async function redirect(from: string, to: string, summary: string = REASON) {
	if (!CHECK) {
		const err = await client.create(from, `#REDIRECT [[${to}]]\n\n[[Category:Redirect Pages]]`, `${summary} — Redirecting page to [[${to}]]`)
			.catch(err => err)
		if (err && err instanceof Error && !(err instanceof MwnError && err.code == 'articleexists')) {
			console.error(err)
		}
		console.log(`Redirected "${from}" to "${to}"`)
	} else {
		CHECK_NOEXIST.push(from)
	}
}

async function updateOL(file: string, summary: string = REASON) {
	const [page, content] = await getFile(file)
	
	// console.log(page)
	const pageData = await client.read(page)
	let pageContent = pageData.revisions![0]?.content
	pageContent = pageContent?.replace(/{{Other Languages.+?\n}}/is, content.match(/{{Other Languages.+?\n}}/is)?.[0]!)

	if (!CHECK) {
		await client.save(page, pageContent!, summary)
		console.log(`Updated OL for "${page}"`)
	} else {
		CHECK_EXIST.push(page)
	}
}

const CATEGORIES = {
	consumable: 'Consumable Icons',
	dpass: 'Dreamscape Pass Stickers',
	fatecard: "Fate's Ensemble Cards",
	fateicon: "Fate's Ensemble Icons",
	pfp: 'Profile Pictures',
	fatesatlas: "Fate's Atlas Images",
	curios: 'Curio Icons',
	equations: 'Equation Icons',
	event: 'Event Banners'
}

async function upload(file: string, fileName: string, categories?: string, reason: string = REASON) {
	if (fileRedirectMap[file] == fileName) {
		return
	} else if (fileRedirectMap[file]) {
		await redirect('File:' + fileName, 'File:' + fileRedirectMap[file], reason)
	}
	
	let pageContentFile = file.replace(/\.png$/, '.wikitext')
	
	if (!categories) {
		for (const [folder, cat] of Object.entries(CATEGORIES)) {
			if (file.replaceAll('\\', '/').includes(`/${folder}/`)) {
				categories = cat
			}
		}
	}
	
	let pageContent = `==Summary==\n{{File\n|categories = ${categories}\n}}\n\n==Licensing==\n{{Fairuse}}`
	if (existsSync(pageContentFile)) {
		pageContent = (await readFile(pageContentFile)).toString()
	} else {
		if (!categories) {
			console.warn(`No category found for ${file}, skipping...`)
			return
		}
	}
	
	if (!CHECK) {
		const result = await client.upload(file, fileName, pageContent, {
			comment: reason,
			ignorewarnings: false
		})
		if (result.result == 'Warning') {
			const dupe_of = result.warnings?.duplicate?.toString()?.replaceAll('_', ' ')
			if (dupe_of) {
				fileRedirectMap[file] = dupe_of
				await redirect('File:' + fileName, 'File:' + dupe_of, reason)
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
		console.log(`Uploaded "${fileName}"`)
	} else {
		CHECK_NOEXIST.push(fileName)
		if (!existsSync(file)) {
			console.error(`File "${file}" (to be uploaded to "${fileName}") does not exist!`)
		}
	}
}

async function readDir(folder: string): Promise<Dirent[]> {
	if (!existsSync(folder)) {
		return []
	}
	return readdir(folder, { withFileTypes: true, recursive: true })
}

if (!CHECK && !midpatch) {
	const confirmed = await AWB.confirm('CHECK NOT ENABLED. Start?')
	if (!confirmed) process.exit()
}

for (const [from, to] of Object.entries(MOVE)) {
	await move(from, to)
}

for (const file of await readDir(`${ROOT}/create`)) {
	if ((file.isFile() || file.isSymbolicLink()) && (file.name.endsWith('.wikitext') || file.name.endsWith('.lua'))) {
		await create(file.path + '/' + file.name)
	}
}

for (const file of await readDir(`${ROOT}/edit`)) {
	if ((file.isFile() || file.isSymbolicLink()) && (file.name.endsWith('.wikitext') || file.name.endsWith('.lua'))) {
		await edit(file.path + '/' + file.name)
	}
}

for (const file of await readDir(`${ROOT}/upload`)) {
	if ((file.isFile() || file.isSymbolicLink()) && !file.name.endsWith('.wikitext')) {
		await upload(file.path + '/' + file.name, file.name)
	}
}

for (const [from, to] of Object.entries(REDIRECT)) {
	await redirect(from, to)
}

for (const file of await readDir(`${ROOT}/ol_edit`)) {
	if ((file.isFile() || file.isSymbolicLink()) && file.name.endsWith('.wikitext')) {
		await updateOL(file.path + '/' + file.name)
	}
}

if (CHECK) {
	await checkPages(CHECK_EXIST, true)
	await checkPages(CHECK_NOEXIST)
}

await writeFile('./src/version_update/FileRedirectMap.json', JSON.stringify(fileRedirectMap, null, '\t'))