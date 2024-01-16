import type { AttackType, Dictionary, ItemReference } from '../Shared.ts'
import type { HashReference } from '../TextMap.ts'

export type InternalWorldMap = { [world: string]: { [entryNum: string]: InternalWorldMapEntry } }

export interface InternalWorldMapEntry {
	RogueMapID: number
	SiteID: number
	IsStart: boolean
	PosX: number
	PosY: number
	NextSiteIDList: number[]
	HardLevelGroupList: number[]
	LevelList: number[]
}

export interface InternalWorldInfo {
	RogueAreaID: number
	/** World Number */
	AreaProgress: number
	Difficulty: number
	AreaEnvironment: unknown[]
	RecommendLevel: number
	RecommendNature: AttackType[]
	AreaNameID: HashReference
	AreaIcon: string
	AreaFigure: string
	FirstReward?: number
	/** Boss Enemy */
	DisplayMonsterMap: Dictionary<number>
	/** May Encounter */
	DisplayMonsterMap2: Dictionary<number>
	UnlockID: number
	MapDisplayItemList: ItemReference[]
	ChestDisplayItemList: ItemReference[]
	MonsterDisplayItemList: ItemReference[]
	ScoreMap: Dictionary<number>
	RecommendSkillTreePoints: number
	AreaTipsIcon: string
}

export interface InternalUnlockInfo {
	RogueUnlockID: number
	UnlockFinishWay: number
	RogueUnlockDetail: HashReference
}

export interface InternalRewardData {
	RewardID: number
	Hcoin?: number
	[k: `ItemID_${number}`]: number
	[k: `Count_${number}`]: number
}