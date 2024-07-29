import { program } from 'commander'
import { existsSync } from 'fs'
import { readFile, readdir } from 'fs/promises'
import { AWB } from '../util/AWB.js'
import { client } from '../util/Bot.js'

const REASON = 'bot fail'

const MOVE: Record<string, string> = {
	// items
	'Acheron (Dreamscape Pass Sticker)': 'Acheron (The Reverie Sticker)',
	'Argenti (Dreamscape Pass Sticker)': 'Argenti (The Reverie Sticker)',
	'Aventurine (Dreamscape Pass Sticker)': 'Aventurine (The Reverie Sticker)',
	'Black Swan (Dreamscape Pass Sticker)': 'Black Swan (The Reverie Sticker)',
	'Boothill (Dreamscape Pass Sticker)': 'Boothill (The Reverie Sticker)',
	'Dr. Ratio (Dreamscape Pass Sticker)': 'Dr. Ratio (The Reverie Sticker)',
	'Firefly (Dreamscape Pass Sticker)': 'Firefly (The Reverie Sticker)',
	'Gallagher (Dreamscape Pass Sticker)': 'Gallagher (The Reverie Sticker)',
	'Misha (Dreamscape Pass Sticker)': 'Misha (The Reverie Sticker)',
	'Sparkle (Dreamscape Pass Sticker)': 'Sparkle (The Reverie Sticker)',
	'Stellaron Hunter: Sam (Dreamscape Pass Sticker)': 'Stellaron Hunter: Sam (The Reverie Sticker)',
	'Sunday (Dreamscape Pass Sticker)': 'Sunday (The Reverie Sticker)',
	'Backscratcher': 'Self-Sufficer',
	'File:Item Backscratcher.png': 'File:Item Self-Sufficer.png',
	'Stranger in a Strange Land': 'Stranger in a Strange Land (Achievement)'
}

const REDIRECT: Record<string, string> = {
	// fate's ensemble
	'Topaz: The Aviator': "Fate's Ensemble#Topaz: The Aviator",
	'Jade: Poison and Sweet Dew': "Fate's Ensemble#Jade: Poison and Sweet Dew",
	"Firefly: Soldier's Pay": "Fate's Ensemble#Firefly: Soldier's Pay",
	"File:Icon Fate's Ensemble Jade.png": "File:Icon Fate's Ensemble Topaz.png",
	"File:Item Firefly's Eidolon.png": 'Item Eidolon (5-star).png',
}

async function checkPages(pages: string[], shouldExist: boolean = false) {
	const foundPages = await client.read(pages)
	for (const page of foundPages) {
		if (page.invalid) {
			console.error(`"${page.title}" is invalid!`)
		}
		if (shouldExist && page.missing) {
			console.error(`"${page.title}" should exist, but does not!`)
		} else if (!shouldExist && !page.missing) {
			console.error(`"${page.title}" shouldn't exist, but does!`)
		}
	}
}

program.option('--check')

program.parse()
const CHECK = program.opts().check

const CHECK_NOEXIST: string[] = []
const CHECK_EXIST: string[] = []

async function getFile(file: string): Promise<[string, string]> {
	let content = (await readFile(file)).toString()
	const page = content.match(/PageTitle\s*=\s*#(.+?)#/i)?.[1]
	if (!page) {
		throw new TypeError(`No PageTitle on ${file}`)
	}

	content = content.replace(/<%\-\-\s+\[PAGE_INFO\].+\[END_PAGE_INFO\]\s+\-\-%>/is, '').trimStart()
	
	console.log(content)
	
	return [page, content]
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
		await client.save(page, content, summary)
			.catch(console.error)
		console.log(`Created "${page}"`)
	} else {
		CHECK_NOEXIST.push(page)
	}
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
}

async function redirect(from: string, to: string, summary: string = REASON) {
	if (!CHECK) {
		await client.create(from, `#REDIRECT [[${to}]]\n\n[[Category:Redirect Pages]]`, `${summary} — Redirecting page to [[${to}]]`)
			.catch(console.error)
		console.log(`Redirected "${from}" to "${to}"`)
	} else {
		CHECK_NOEXIST.push(from)
	}
}

async function updateOL(file: string, summary: string = REASON) {
	const [page, content] = await getFile(file)
	
	console.log(page)
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
}

async function upload(file: string, fileName: string, summary: string = REASON) {
	let pageContentFile = file.replace(/\.png$/, '.wikitext')
	
	let foundCat = 'undefined'
	for (const [folder, cat] of Object.entries(CATEGORIES)) {
		if (file.replaceAll('\\', '/').includes(`/${folder}/`)) {
			foundCat = cat
		}
	}
	
	let pageContent = `==Summary==\n{{File\n|categories = ${foundCat}\n}}\n\n==Licensing==\n{{Fairuse}}`
	if (existsSync(pageContentFile)) {
		pageContent = (await readFile(pageContentFile)).toString()
	} else {
		if (foundCat == 'undefined') {
			console.warn(`No category found for ${file}, skipping...`)
			return
		}
	}
	
	if (!CHECK && !fileName.startsWith('Mission') && !fileName.startsWith('Profile Picture') && !fileName.startsWith('Dreamscape')) {
		await client.save('File:' + fileName, pageContent, REASON)
		console.log(`Uploaded "${fileName}"`)
	} else {
		CHECK_NOEXIST.push(fileName)
	}
}

if (!CHECK) {
	const confirmed = await AWB.confirm('CHECK NOT ENABLED. Start?')
	if (!confirmed) process.exit()
}

// for (const [from, to] of Object.entries(MOVE)) {
// 	await move(from, to)
// }

// for (const file of await readdir('./src/version_update/create', { withFileTypes: true, recursive: true })) {
// 	if (file.isFile() && file.name.endsWith('.wikitext')) {
// 		await create(file.path + '/' + file.name)
// 	}
// }

// for (const file of await readdir('./src/version_update/edit', { withFileTypes: true, recursive: true })) {
// 	if (file.isFile() && file.name.endsWith('.wikitext')) {
// 		await edit(file.path + '/' + file.name)
// 	}
// }

for (const file of await readdir('./src/version_update/upload', { withFileTypes: true, recursive: true })) {
	if (file.isFile() && !file.name.endsWith('.wikitext')) {
		await upload(file.path + '/' + file.name, file.name)
	}
}

// for (const [from, to] of Object.entries(REDIRECT)) {
// 	await redirect(from, to)
// }

// for (const file of await readdir('./src/version_update/ol_edit', { withFileTypes: true, recursive: true })) {
// 	if (file.isFile() && file.name.endsWith('.wikitext')) {
// 		await updateOL(file.path + '/' + file.name)
// 	}
// }

if (CHECK) {
	await checkPages(CHECK_EXIST, true)
	await checkPages(CHECK_NOEXIST)
}