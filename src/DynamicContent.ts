import { readFileSync } from 'fs';
import config from '../config.json' with { "type": "json" };
import type { OutputList } from './Event.js';
import { Stage } from './Stage.js';
import { HashReference, TextMap } from './TextMap.js';

export type DynamicParamType = 'Append' | 'ReplaceAll' | 'ReplaceOne'
export interface InternalDynamicContent {
	DynamicContentID: number
	ArgID: number
	DisplayID?: number
	DynamicParamType: DynamicParamType
	DynamicParamList: number[]
}

export interface InternalDynamicDisplay {
	DisplayID: number
	ContentText: HashReference
}

export class DynamicContent {
	static internal_data: {[key: string]: {[key2: string]: InternalDynamicContent}} = JSON.parse(readFileSync(`./versions/${config.target_version}/DialogueDynamicContent.json`).toString())
	static display_data: {[key: string]: InternalDynamicDisplay} = JSON.parse(readFileSync(`./versions/${config.target_version}/DialogueDynamicDisplay.json`).toString())
	
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
	
	generateEnemyList(): OutputList {
		const list: OutputList = []
		let variant = 1
		for (const [ stage_id ] of this.param_lists) {
			const stage = Stage.exists(stage_id) && new Stage(stage_id)
			
			if (stage) {
				const enemyList = stage.generateEnemyList()
				if (typeof enemyList == 'string') {
					list.push(`'''Variant ${variant}:''' ${enemyList}`)
				} else {
					list.push(`'''Variant ${variant}:'''`)
					list.push(enemyList)
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