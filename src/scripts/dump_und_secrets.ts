import { writeFile } from 'fs/promises';
import { ActDialogueTree } from '../dialogue/Dialogue.js';
import type { Act } from '../files/Dialog.js';
import { getFile } from '../files/GameFile.js';
import { HashReference, textMap } from '../TextMap.js';
import { pageInfoHeader, uploadPrompt } from '../util/General.js';

export interface InternalRogueMagicStory {
	StoryID: number
	StoryCategory: 'MagicFaction' | 'MagicWar' | 'Final'
	StoryName: HashReference
	IsHide: boolean
	LevelGraphPath: string
	StoryImage: string
	UnLockDisplay: number
}

export const RogueMagicStory = await getFile<InternalRogueMagicStory[]>('ExcelOutput/RogueMagicStory.json')

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