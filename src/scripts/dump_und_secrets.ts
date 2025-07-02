import { writeFile } from 'fs/promises';
import { ActDialogueTree } from '../dialogue/Dialogue.js';
import { getFile } from '../files/GameFile.js';
import type { Act } from '../files/graph/Dialog.js';
import { HashReference, textMap } from '../TextMap.js';
import { pageInfoHeader, uploadPrompt } from '../util/General.js';
import { teardown } from '../util/JSONParser.js';

export interface InternalRogueMagicStory {
	StoryID: number
	StoryCategory: 'MagicFaction' | 'MagicWar' | 'Final'
	StoryName: HashReference
	IsHide: boolean
	LevelGraphPath: string
	StoryImage: string
	UnLockDisplay: number
}

export interface InternalRogueCommonDialogue {
	DialoguePath: string
	DialogueID: number
}

export const RogueMagicStory = await getFile<InternalRogueMagicStory[]>('ExcelOutput/RogueMagicStory.json')
export const RogueCommonDialogue = await getFile<InternalRogueCommonDialogue[]>('ExcelOutput/RogueCommonDialogue.json')

const output: string[] = [
	pageInfoHeader('Simulated Universe: Unknowable Domain/Secrets'),
	'{{Simulated Universe: Unknowable Domain Tabs}}',
	''
]

export class SecretDialogueTree extends ActDialogueTree {
	type: 'secret' = 'secret'

	protected constructor(act: Act) {
		super(act, `secret`)
	}

	static async fromStory(story: InternalRogueMagicStory) {
		const act = await getFile<Act>(story.LevelGraphPath)
		const tree = new this(act)
		tree.root = await tree.processAct(act)
		return tree
	}
	
	static async fromCommon(common: InternalRogueCommonDialogue) {
		const act = await getFile<Act>(common.DialoguePath)
		const tree = new this(act)
		tree.root = await tree.processAct(act)
		return tree
	}
}

async function addCategory(cat: InternalRogueMagicStory['StoryCategory']) {
	output.push(`==${cat}==`)
	for (const story of RogueMagicStory) {
		if (story.StoryCategory != cat) continue
		
		const imgNum = story.StoryImage.match(/RoguePicEventDLC_(\d+)/)?.[1]
		const imgName = `Trailblaze Secret ${imgNum}.png`
		
		const dialogue = await SecretDialogueTree.fromStory(story)
		
		output.push(
			'',
			`===${textMap.getText(story.StoryName)}===`,
			`[[File:${imgName}|thumb|right|150px]]${uploadPrompt(story.StoryImage, imgName, 'Trailblaze Secret Images')}`,
			'{{Dialogue Start}}',
			await dialogue.optimize().wikitext(),
			'{{Dialogue End}}'
		)
	}
	output.push('')
}

await addCategory('MagicFaction')
await addCategory('MagicWar')
await addCategory('Final')

await writeFile('./output/und-secrets.wikitext', output.join('\n'))

for (const common of RogueCommonDialogue) {
	const tree = await SecretDialogueTree.fromCommon(common)
	tree.optimize()
	writeFile(`./output/roguecommon/${common.DialogueID}.wikitext`, await tree.wikitext())
}

teardown()