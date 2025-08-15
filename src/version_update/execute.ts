import { program } from 'commander'
import { Dirent, existsSync } from 'fs'
import { readFile, readdir, writeFile } from 'fs/promises'
import config from '../../config.json' with { "type": 'json' }
import { COMMON_ICON_MAP } from '../Item.js'
import { sanitizeString, zeroPad } from '../Shared.js'
import { AWB } from '../util/AWB.js'
import { client, fileRedirectMap, redirectRetry, retryIfRatelimit, uploadRetry } from '../util/Bot.js'

const MOVE: Record<string, string> = {
	
}

const REDIRECT: Record<string, string> = {
	'Theoros: Lygus': 'First Genius, Entelechy, Zandar'
}

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

async function getFile(file: string): Promise<[string, string]> {
	let content = (await readFile(file)).toString()
	const page = content.match(/PageTitle\s*=\s*#(.+?)#/i)?.[1]
	if (!page) {
		throw new TypeError(`No PageTitle on ${file}`)
	}

	content = content.replace(/(?:\-\-\[\=\[)?<%\-\-\s+\[PAGE_INFO\].+\[END_PAGE_INFO\]\s+\-\-%>(?:\-\-\]\=\])?/is, '').trimStart()
	
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
		await retryIfRatelimit(() => client.move(from, to, summary))
			.catch(console.error)
		console.log(`Moved "${from}" to "${to}"`)
	} else {
		CHECK_EXIST.push(from)
		CHECK_NOEXIST.push(to)
	}
}

async function create(file: string, summary: string = REASON) {
	const [page, content] = await getFile(file)

	await processUploadPrompts(content)
	if (!CHECK) {
		await client.create(page, content, summary)
			.catch(console.error)
		console.log(`Created "${page}"`)
	} else {
		CHECK_NOEXIST.push(page)
	}
}

async function edit(file: string, summary: string = REASON) {
	const [page, content] = await getFile(file)

	await processUploadPrompts(content)
	if (!CHECK) {
		await retryIfRatelimit(() => client.save(page, content, summary))
		console.log(`Edited "${page}"`)
	} else {
		CHECK_EXIST.push(page)
	}
}

async function redirect(from: string, to: string, summary: string = REASON) {
	if (!CHECK) {
		await redirectRetry(from, to, summary)
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
		await retryIfRatelimit(() => client.save(page, pageContent!, summary))
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
	if (!categories) {
		for (const [folder, cat] of Object.entries(CATEGORIES)) {
			if (file.replaceAll('\\', '/').includes(`/${folder}/`)) {
				categories = cat
			}
		}
	}
	
	if (!CHECK) {
		if (categories) {
			await uploadRetry(file, fileName, categories, reason)
		} else {
			console.error(`No categories found for "${file}", skipping...`)
		}
	} else {
		CHECK_NOEXIST.push(fileName)
		if (!existsSync(file)) {
			console.error(`File "${file}" (to be uploaded to "${fileName}") does not exist!`)
		}
		if (!categories) {
			console.error(`File "${file}" has no categories and will be skipped`)
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

if (existsSync(ROOT)) {
	for (const [from, to] of Object.entries(MOVE)) {
		await move(from, to)
	}
	
	for (const file of await readDir(`${ROOT}/create`)) {
		if ((file.isFile() || file.isSymbolicLink()) && (file.name.endsWith('.wikitext') || file.name.endsWith('.lua'))) {
			await create(file.parentPath + '/' + file.name)
		}
	}

	for (const file of await readDir(`${ROOT}/edit`)) {
		if ((file.isFile() || file.isSymbolicLink()) && (file.name.endsWith('.wikitext') || file.name.endsWith('.lua'))) {
			await edit(file.parentPath + '/' + file.name)
		}
	}

	for (const file of await readDir(`${ROOT}/upload`)) {
		if ((file.isFile() || file.isSymbolicLink()) && !file.name.endsWith('.wikitext')) {
			await upload(file.parentPath + '/' + file.name, file.name)
		}
	}

	for (const [from, to] of Object.entries(REDIRECT)) {
		await redirect(from, to)
	}

	for (const file of await readDir(`${ROOT}/ol_edit`)) {
		if ((file.isFile() || file.isSymbolicLink()) && file.name.endsWith('.wikitext')) {
			await updateOL(file.parentPath + '/' + file.name)
		}
	}
}

if (midpatch && asiaTime.getUTCDate() == 1 && !CHECK) {
	console.log('Creating new Starlight Exchange page')
	let activeCharacter1 = ''
	let activeCharacter2 = ''
	switch ((asiaTime.getUTCMonth() + 1) % 6) {
		case 1:
			activeCharacter1 = 'March 7th (Preservation)'
			activeCharacter2 = 'Tingyun'
			break
		case 2:
			activeCharacter1 = 'Hook'
			activeCharacter2 = 'Pela'
			break
		case 3:
			activeCharacter1 = 'Qingque'
			activeCharacter2 = 'Sushang'
			break
		case 4:
			activeCharacter1 = 'Arlan'
			activeCharacter2 = 'Sushang'
			break
		case 5:
			activeCharacter1 = 'Dan Heng'
			activeCharacter2 = 'Serval'
			break
		case 0:
			activeCharacter1 = 'Natasha'
			activeCharacter2 = 'Sampo'
			break
		default:
			console.error('what', asiaTime, asiaTime.getUTCMonth())
	}
	const nextMonth = asiaTime.getUTCMonth() == 11 ? 1 : asiaTime.getUTCMonth() + 2
	const nextMonthYear = nextMonth == 1 ? asiaTime.getUTCFullYear() + 1 : asiaTime.getUTCFullYear()
	const starlightExchange = `{{Starlight Exchange\n|time_start = ${midpatch} 04:00:00\n|time_end   = ${nextMonthYear}-${zeroPad(nextMonth, 2)}-01 03:59:59\n|shop = \n{{Shop/Old|${activeCharacter1}|140|1|type=Character}}\n{{Shop/Old|${activeCharacter2}|140|1|type=Character}}\n}}`

	await retryIfRatelimit(() => client.create(`Starlight Exchange/${midpatch}`, starlightExchange, REASON))
		.catch(console.error)
}

if (CHECK) {
	await checkPages(CHECK_EXIST, true)
	await checkPages(CHECK_NOEXIST)
}

await writeFile('./src/version_update/FileRedirectMap.json', JSON.stringify(fileRedirectMap, null, '\t'))