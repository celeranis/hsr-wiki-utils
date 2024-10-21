import type { Dictionary } from './Shared.js';
import { Stage } from './Stage.js';
import { TextMap } from './TextMap.js';
import type { DynamicParamType, InternalDynamicContent, InternalDynamicDisplay } from './files/DynamicContent.js';
import { getExcelFile, getFile } from './files/GameFile.js';

const internal_data: Dictionary<Dictionary<InternalDynamicContent>> = await getFile('ExcelOutput/DialogueDynamicContent.json')
const display_data = await getExcelFile<InternalDynamicDisplay>('RogueDialogueDynamicDisplay.json', 'DisplayID')

export class DynamicContent {
	static internal_data = internal_data
	static display_data = display_data
	
	text_params?: string[]
	param_lists: number[][] = []
	param_type: DynamicParamType = 'Append'
	
	constructor(public id: number) {
		const possibleValues = DynamicContent.internal_data[id]
		
		for (const data of Object.values(possibleValues)) {
			const textParam = TextMap.default.getText(DynamicContent.display_data[data.DisplayID!]?.ContentText)
			if (textParam) {
				this.text_params ??= []
				this.text_params.push(textParam)
			}
			
			this.param_lists.push(data.DynamicParamList)
			this.param_type = data.DynamicParamType
		}
	}
	
	asEnemyLists(): string[] {
		const list: string[] = []
		let variant = 1
		for (const [ stage_id ] of this.param_lists) {
			const stage = Stage.fromPlaneEvent(stage_id)
			
			if (stage) {
				const enemyList = stage.asEnemyLists()
				if (enemyList.length == 1) {
					list.push(`'''Variant ${variant}:''' ${enemyList[0]}`)
				} else {
					list.push(`'''Variant ${variant}:'''`)
					list.push(...enemyList.map(line => ':' + line))
				}
			} else {
				list.push(
					`'''Variant ${variant}''': [Unknown Stage ID: ${stage_id}]`
				)
			}
			variant++
		}
		return list
	}
}