import { getExcelFile, getFile } from './files/GameFile.js';
import { InternalTutorialData, InternalTutorialGroup, InternalTutorialType } from './files/Tutorial.js';
import { wikiTitle } from './Shared.js';
import { textMap } from './TextMap.js';

const TutorialGuideData = await getExcelFile<InternalTutorialData>('TutorialGuideData.json')
const TutorialGuideGroup = Object.values(await getFile<InternalTutorialGroup[]>('ExcelOutput/TutorialGuideGroup.json'))
const TutorialGuideGroupType = await getExcelFile<InternalTutorialType>('TutorialGuideGroupType.json')

export interface TutorialPage {
	id: number
	image: string
	text: string
}

export class Tutorial {
	id: number
	name: string
	order: number
	can_review: boolean
	pagetitle: string
	
	page_ids: number[]
	
	type_id: number
	type: string
	
	constructor(data: InternalTutorialGroup) {
		this.id = data.GroupID
		this.name = textMap.getText(data.MessageText)
		this.order = data.Order
		this.can_review = data.CanReview ?? false
		this.page_ids = data.TutorialGuideIDList
		
		this.pagetitle = wikiTitle(this.name, 'tutorial', this.id)
		
		this.type_id = data.TutorialType
		this.type = textMap.getText(TutorialGuideGroupType[data.TutorialType]?.MessageTitle) || ''
	}
	
	getPages(): TutorialPage[] {
		return this.page_ids
			.map(id => TutorialGuideData[id])
			.filter(Boolean) // remove missing
			.map(internal => ({
				id: internal.ID,
				image: internal.ImagePath,
				text: textMap.getText(internal.DescText)
					.replaceAll(/{{Color\|(\w+)\|/gi, '{{Color|$1|nobold=1|')
					.replaceAll('\n', '<br />'),
			}))
	}
	
	static fromId(tutorialId: number | string): Tutorial | null {
		const data = TutorialGuideGroup.find(group => group.GroupID == tutorialId)
		if (!data) return null
		
		return new this(data)
	}
	
	static loadAll() {
		return TutorialGuideGroup.map(group => new this(group))
	}
}