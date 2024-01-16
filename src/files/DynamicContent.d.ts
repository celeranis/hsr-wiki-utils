import type { HashReference } from '../TextMap.ts'

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