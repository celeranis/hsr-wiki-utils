import { writeFile } from 'fs/promises'
import { Dictionary } from '../Shared.js'
import { HashReference, textMap } from '../TextMap.js'
import { getFile } from '../files/GameFile.js'
import { teardown } from '../util/JSONParser.js'

export interface InternalLoadingScreen {
	ID: number
	MinLevel: number
	MaxLevel: number
	Group: string
	LockParam: unknown[]
	LockParamForOr: unknown[]
	UnlockParam: unknown[]
	UnlockParamForOr: unknown[]
	ForceParam: unknown[]
	ForceParamForOr: unknown[]
	Weight: number
	TitleTextmapID: HashReference
	DescTextmapID: HashReference
	ImageID: number
}

const output: string[] = []

const loadingData = await getFile<Dictionary<InternalLoadingScreen>>('ExcelOutput/LoadingDesc.json')
const list = Object.values(loadingData).sort((a, b) => {
	const titleA = textMap.getText(a.TitleTextmapID)
	const titleB = textMap.getText(b.TitleTextmapID)
	if (titleA > titleB)
		return 1
	else if (titleA < titleB)
		return -1
	else
		return 0
})

for (const load of list) {
	const name = textMap.getText(load.TitleTextmapID)
	output.push(`* '''${textMap.getText(load.TitleTextmapID)}:''' <section begin="${name.replaceAll('"', '&quot;')}" />${textMap.getText(load.DescTextmapID).replaceAll('\n', ' ')}<section end="${name.replaceAll('"', '&quot;')}" />`)
	// output.push(`* <section begin="${name.replaceAll('"', '&quot;')}" />{{Loading Screen|${textMap.getText(load.TitleTextmapID)}|${textMap.getText(load.DescTextmapID).replaceAll('\n', '<br />')}}}<section end="${name.replaceAll('"', '&quot;')}" />`)
}

await writeFile('./output/loading_screens.wikitext', output.join('\n'))

teardown()