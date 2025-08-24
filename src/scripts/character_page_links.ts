import { writeFile } from 'fs/promises'
import { pageInfoHeader } from '../util/General.js'

const APP_ID = '113fe6d3b4514cdd'
const worldsURL = `https://sg-public-api-static.hoyoverse.com/content_v2_user/app/${APP_ID}/getContentList?iPage=1&iPageSize=999&sLangKey=en-us&isPreview=0&iChanId=241`
const charactersURL = `https://sg-public-api-static.hoyoverse.com/content_v2_user/app/${APP_ID}/getContentList?iPage=1&iPageSize=999&sLangKey=en-us&isPreview=0&iChanId=242`

interface ContentEntry {
	sChanId: number[]
	sTitle: string
	sIntro: string
	sUrl: string
	sAuthor: string
	sContent: string
	sExt: string
	dtStartTime: string
	dtEndTime: string
	iInfoId: number
	sTagName: string[]
	sCategoryName: string
	sSign: string
	_index?: number
}

interface ContentResponse {
	retcode: number
	message: string
	data: {
		iTotal: number
		list: ContentEntry[]
	}
}

const worldsData: ContentResponse = await (await fetch(worldsURL)).json()
const charData: ContentResponse = await (await fetch(charactersURL)).json()

const output = [
	pageInfoHeader('Module:Character Page Link/data', true),
	'-- auto-generated based on data from the website',
	'return {'
]

output.push('\tcategories = {')

for (const [index, world] of Object.entries(worldsData.data.list)) {
	const catId = world.sCategoryName.trim()
	output.push(`\t\t['${catId.replaceAll("'", "\\'") }'] = ${Number(index) + 1}, -- ${world.sTitle}`)
}

output.push('\t},', '\tcharacters = {')

const indices = {}
for (const character of charData.data.list) {
	const catId = character.sCategoryName.trim()
	character._index = indices[catId] = (indices[catId] ?? 0) + 1
}

charData.data.list.sort((a, b) => a.sTitle < b.sTitle ? -1 : a.sTitle > b.sTitle  ? 1 : 0)

let marched = false
for (const character of charData.data.list) {
	const catId = character.sCategoryName.trim()
	const index = character._index
	let charName = character.sTitle.replaceAll("'", "\\'")
	if (charName == 'March 7th') {
		if (marched) {
			charName = 'March 7th (The Hunt)'
		} else {
			marched = true
		}
	}
	output.push(`\t\t['${charName}'] = { index = ${index}, category = '${catId}' },`)
}

output.push('\t}', '}')

writeFile('./output/character-website-data.lua', output.join('\n'))