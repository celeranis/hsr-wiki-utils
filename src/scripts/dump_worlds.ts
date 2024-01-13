import { readFileSync, writeFileSync } from 'fs'
import config from '../../config.json' with { "type": "json" }
import { AttackType, Dictionary, ItemReference, RARITIES, typeDisplayName } from '../Shared.js'
import { Stage } from '../Stage.js'
import { HashReference, TextMap } from '../TextMap.js'
import { Tabber } from '../util/Tabber.js'
import { Table } from '../util/Table.js'

const maps: InternalWorldMap = JSON.parse(readFileSync(`./versions/${config.target_version}/RogueMap.json`).toString())
const worlds: Dictionary<InternalWorldInfo> = JSON.parse(readFileSync(`./versions/${config.target_version}/RogueAreaConfig.json`).toString())
const unlockInfo: Dictionary<InternalUnlockInfo> = JSON.parse(readFileSync(`./versions/${config.target_version}/RogueUnlockConfig.json`).toString())
const items: Dictionary<any> = JSON.parse(readFileSync(`./versions/${config.target_version}/ItemConfig.json`).toString())
const charItems: Dictionary<any> = JSON.parse(readFileSync(`./versions/${config.target_version}/ItemConfigAvatar.json`).toString())
const rewards: Dictionary<InternalRewardData> = JSON.parse(readFileSync(`./versions/${config.target_version}/ItemConfigAvatar.json`).toString())

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', "VI", 'VII', 'VIII', 'IX', 'X']

const order = {
	1: [
		'Combat', 'Elite', 
		'Respite', 'Combat', 'Occurrence', 
		'Respite', 'Boss'
	],
	2: [
		'Combat', 'Divergence', 'Divergence', 'Elite', 
		'Respite', 'Combat', 'Divergence', 'Elite',
		'Respite', 'Random', 'Divergence',
		'Respite', 'Boss'
	]
}

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
	output.push(`===${textMap.getText(first.AreaNameID)}===`)

	const tabber = new Tabber()
	
	for (const diff of difficulties) {
		const table = new Table('article-table')
		
		if (diff.UnlockID) {
			table.addRow(`'''Unlock Requirement'''`, textMap.getText(unlockInfo[diff.UnlockID].RogueUnlockDetail))
		}
		
		table.addRow(`'''Recommended Team Level'''`, diff.RecommendLevel)
		table.addRow(`'''Recommended Types'''`, `{{Types|${diff.RecommendNature.map(type => typeDisplayName(type)).join(',')}}}`)
		
		const maxPts = Object.values(diff.ScoreMap).pop()
		if (maxPts) {
			const pointsTable = new Table('article-table tdc1', ['Domain', 'Points', '{{Item|Ability Point|20|text=Ability Points}}'])
			
			for (const [domain, pts] of Object.entries(diff.ScoreMap)) {
				pointsTable.addRow(domain, pts, Math.round(pts / 10))
			}
			
			table.addRow(`'''Points'''`, [
				`'''Maximum Points''': ${maxPts}`,
				`'''Maximum {{Item|Ability Point|20|text=Ability Points}}''': ${Math.round(maxPts / 10)}`,
				`{{Collapsible`,
				`|`,
				pointsTable.wrapper(),
				`|Partial Rewards`,
				'|collapsed=1',
				`}}`
			].join('\n'))
		}
		
		const map = maps[(diff.AreaProgress * 100) + diff.Difficulty]
		const layout: string[] = []
		
		if (!map) {
			console.error(`No map found for ${textMap.getText(diff.AreaNameID)} Difficulty ${diff.Difficulty}`)
			continue
		}
		
		function add(entry: InternalWorldMapEntry, num: number) {
			layout.push(`{{SU Domain Card|${order[diff.AreaProgress == 1 ? 1 : 2][num]}|${entry.LevelList[0]}}}`)
			if (entry.NextSiteIDList?.[0]) add(map[entry.NextSiteIDList[0]], num + 1)
		}
		add(Object.values(map).find(domain => domain.IsStart)!, 0)
		
		table.addRow(`'''Layout'''`, layout.join(''))
		
		table.addRow(`'''Boss Enem${Object.values(diff.DisplayMonsterMap).length == 1 ? 'y' : 'ies'}'''`, enemyList(diff.DisplayMonsterMap))
		
		table.addRow(`'''May Encounter'''`, enemyList(diff.DisplayMonsterMap2))
		
		if (diff.FirstReward && rewards[diff.FirstReward]) {
			table.addRow(`'''First-Time Clearance Reward'''`, reward(rewards[diff.FirstReward]))
		}
		
		table.addRow(`'''Extra Drops'''`, itemList(diff.MonsterDisplayItemList))

		if (diff.ChestDisplayItemList?.length) {
			table.addRow(`'''Immersion Reward'''`, itemList(diff.ChestDisplayItemList, true))
		}
		
		tabber.addTab(`Difficulty ${NUMERALS[diff.Difficulty - 1]}`, table.wrapper())
	}
	
	output.push(tabber.template(), '')
}

writeFileSync('./output/worlds.wikitext', output.join('\n'))

export function enemyList(monsterMap: Dictionary<number>) {
	return `{{Card List|${Object.entries(monsterMap).map(([id, lvl]) => `${textMap.getText(Stage.monsters[id].MonsterName)}*Lv. ${lvl}`).join(',')}|type=Enemy|show_caption=1}}`
}

export function itemList(itemList: ItemReference[], caption = false) {
	return `{{Card List|1=${itemList.map(item => {
			const itemData = items[item.ItemID] ?? charItems[item.ItemID]
			itemData.ItemNum = item.ItemNum
			if (item.ItemID == 2) {
				itemData._sort = -100
			} else if (item.ItemID == 22) {
				itemData._sort = 100
			}
			return itemData
		})
		.sort((item0, item1) => (item1._sort ?? RARITIES[item1.Rarity]) - (item0._sort ?? RARITIES[item0.Rarity]))
		.map(item => {
			if (!item) return 'Unknown'
			else return textMap.getText(item.ItemName) 
				+ (item.ItemNum ? `*${item.ItemNum}` : '') 
				+ (item.ItemSubType == 'RelicSetShowOnly' ? `{ rarity = ${RARITIES[item.Rarity]} }` : '')
		})}${caption ? '|show_caption=1' : ' '}}}`
}

export function reward(reward: InternalRewardData) {
	const items: ItemReference[] = []
	if (reward.Hcoin) {
		items.push({ItemID: 1, ItemNum: reward.Hcoin})
	}
	for (let i = 1; reward[`ItemID_${i}`]; i++) {
		items.push({ItemID: reward[`ItemID_${i}`], ItemNum: reward[`Count_${i}`]})
	}
	return itemList(items)
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