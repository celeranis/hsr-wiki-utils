import { TextMap } from '../TextMap.js';
import { AWB } from '../util/AWB.js';
import { teardown } from '../util/JSONParser.js';
import { Template } from '../util/Template.js';

const fileContents = AWB.init()

async function getOL(target: string) {
	let matching = Object.entries(TextMap.default.json)
		.filter(([, val]) => val == target)
		.map(pair => pair[0])
	
	let generated: string[] = []
	let allSame = true
	let prev: string | undefined = undefined
	for (const id of matching) {
		const ol = await TextMap.generateOL(id)
		generated.push(ol)
		if (prev && ol != prev) allSame = false
		prev = ol
	}
		
	let chosen: string | null = generated[0]

	if (generated.length == 0 || (generated.length > 1 && !allSame)) {
		console.log(
			generated.length == 0 
			? `No IDs matched string "${target}"\nhttps://saccharose.wiki/hsr/textmap?q=${encodeURIComponent(target)}`
			: `Multiple unique IDs matched string "${target}"\nhttps://saccharose.wiki/hsr/OL?q=${encodeURIComponent(target)}`
		)
		let hash = await AWB.prompt('Enter a hash to use, or leave blank to skip:')
		chosen = hash ? await TextMap.generateOL(hash) : null
	}

	if (!chosen) return
	
	return chosen
}

const title = Template.getParamValue(AWB.file_contents, 'title') || AWB.page_name
const ol = await getOL(title)

if (ol) {
	const newContents = fileContents.replace(/{{Other Languages.+?\n}}/is, ol)
	if (fileContents == newContents) {
		await AWB.confirm('No changes. Skip?')
	} else {
		AWB.sendOutput(newContents)
	}
}

teardown()