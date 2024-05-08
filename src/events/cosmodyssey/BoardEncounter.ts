import { textMap } from '../../TextMap.js'
import { BoardEncounterType, InternalBoardEncounter } from '../../files/Cosmodyssey.js'

export class BoardEncounter {
	id: number
	type: BoardEncounterType
	name: string
	content: string
	image_path: string
	option_ids: number[]
	auto_effects: number[]
	is_report?: boolean 
	
	constructor(data: InternalBoardEncounter) {
		this.id = data.EventID
		this.type = data.Type
		this.name = textMap.getText(data.EventName)
		this.content = textMap.getText(data.EventContent)
		this.image_path = data.PicPath
		this.option_ids = data.EventOptionIDList
		this.auto_effects = data.AutoTriggerEffectIDList
		this.is_report = data.IsDataReport
	}
	
	
}