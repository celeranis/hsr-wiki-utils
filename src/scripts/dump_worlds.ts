import { readFileSync } from 'fs'
import config from '../../config.json' with { "type": "json" }
import { AttackType, Dictionary, ItemReference } from '../Shared.js'
import { HashReference, TextMap } from '../TextMap.js'

const maps: InternalWorldMap = JSON.parse(readFileSync(`./versions/${config.target_version}/RogueMap.json`).toString())
const worlds: Dictionary<InternalWorldInfo> = JSON.parse(readFileSync(`./versions/${config.target_version}/RogueAreaConfig.json`).toString())
const unlockInfo: Dictionary<InternalUnlockInfo> = JSON.parse(readFileSync(`./versions/${config.target_version}/RogueUnlockConfig.json`).toString())

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', "VI", 'VII', 'VIII', 'IX', 'X']

const textMap = TextMap.default

const output: string[] = ['==Worlds==']
const worldSet = new Map<number, InternalWorldInfo[]>()

// organize difficulties by world
for (const world of Object.values(worlds)) {
	if (!worldSet.has(world.AreaProgress)) worldSet.set(world.AreaProgress, [])
	
	const list = worldSet.get(world.AreaProgress)!
	list.push(world)
}

for (const difficulties of worldSet.values()) {
	const first = difficulties[0]
	
}

export type InternalWorldMap = {[world: string]: {[entryNum: string]: InternalWorldMapEntry}}

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