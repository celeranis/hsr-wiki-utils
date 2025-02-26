import { Value } from '../Shared.ts'
import { HashReference } from '../TextMap.ts'
import { ItemReference } from './Item.js'

export type DayCycle = 'Day' | 'Night'

export interface InternalTitanBless {
	TitanBlessID: number
	TitanType: string
	TitanBlessLevel: number
	MazeBuffID: number
	ExtraEffectIDList: number[]
	BlessRatio?: number
	BlessBattleDisplayCategoryList: DayCycle[]
}

export interface InternalTitanType {
	RogueTitanType: string
	RogueTitanCategory: DayCycle
	TitanTitle: HashReference
	CharacterName: HashReference
	RogueTitanCardIcon: string
	RogueTitanCardShadowIcon: string
	RogueTitanTalentIcon: string
	RogueTitanAvatarRoundIconSmall: string
	RogueTitanAvatarRoundIconMid: string
}

export interface InternalTitanTalent {
	ID: number
	TitanType: string
	Level: number
	Cost: ItemReference[]
	TalentTitle: HashReference
	TalentDesc: HashReference
	DescParamList: Value<number>[]
	TalentIconPath: string
	ActTitle: HashReference
	ActJson: string
}