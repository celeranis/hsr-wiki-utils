import { writeFileSync } from 'fs'
import { Dictionary, ItemReference, RARITIES, typeDisplayName } from '../Shared.js'
import { Stage } from '../Stage.js'
import { TextMap } from '../TextMap.js'
import { getFile } from '../files/GameFile.js'
import type { InternalRewardData, InternalUnlockInfo, InternalWorldInfo, InternalWorldMap, InternalWorldMapEntry } from '../files/Worlds.js'
import { Table } from '../util/Table.js'

const maps: InternalWorldMap = await getFile('ExcelOutput/RogueMap.json')
const worlds: Dictionary<InternalWorldInfo> = await getFile('ExcelOutput/RogueAreaConfig.json')
const unlockInfo: Dictionary<InternalUnlockInfo> = await getFile('ExcelOutput/RogueUnlockConfig.json')
const items: Dictionary<any> = await getFile('ExcelOutput/ItemConfig.json')
const charItems: Dictionary<any> = await getFile('ExcelOutput/ItemConfigAvatar.json')
const relicItems: Dictionary<any> = await getFile('ExcelOutput/ItemConfigRelic.json')
const rewards: Dictionary<InternalRewardData> = await getFile('ExcelOutput/RewardData.json')

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
	const highest = difficulties.reduce((highest, diff) => Math.max(highest, diff.Difficulty), 1)

	// const tabber = new Tabber()

	const table = new Table('wikitable', ['Difficulty', 'Details'])
	for (const diff of difficulties) {
		let firstRow = ''
		let rowCount = 1
		
		const attr = diff.Difficulty < highest ? `class="mw-collapsible mw-collapsed" id="mw-customcollapsible-lowerdiff${diff.AreaProgress}"` : undefined
		
		if (diff.UnlockID) {
			firstRow += '* ' + textMap.getText(unlockInfo[diff.UnlockID].RogueUnlockDetail).replace(/Trailblaze Mission "(.+?)"/g, `Trailblaze Mission ''[[$1]]''`)
		}
		
		firstRow += `\n* '''Recommended Team Level''': ${diff.RecommendLevel}`
		firstRow += `\n* '''Recommended Types''': {{Types|${diff.RecommendNature.map(type => typeDisplayName(type)).join(',')}}}`

		const row = table.addRowWithAttr(attr, [`! rowspan="<<ROWCOUNT>>" | ${NUMERALS[diff.Difficulty - 1]}`, firstRow.trim()])
		
		const maxPts = Object.values(diff.ScoreMap).pop()
		if (maxPts) {
			const pointsTable = new Table('article-table tdc1', ['Domain', 'Points', '{{Item|Ability Point|20|text=Ability Points}}'])
			
			for (const [domain, pts] of Object.entries(diff.ScoreMap)) {
				pointsTable.addRow(domain, pts.toString(), Math.round(pts / 10).toString())
			}
			
			table.addRowWithAttr(attr, [
				`'''Maximum Points''': ${maxPts}<br />`,
				`'''Maximum {{Item|Ability Point|20|text=Ability Points}}''': ${Math.round(maxPts / 10)}`,
				`{{Collapsible`,
				`|${Object.values(diff.ScoreMap).length == 13 ? `{{SU Partial Point Rewards|${maxPts}}}` : ''}`,
				Object.values(diff.ScoreMap).length == 13 ? undefined : pointsTable.wrapper(),
				`|Partial Rewards`,
				'|collapsed=1',
				`}}`
			].filter(Boolean).join('\n'))
			
			rowCount++
		}
		
		const map = maps[(diff.AreaProgress * 100) + diff.Difficulty]
		const layout: string[] = []
		
		if (!map) {
			console.error(`No map found for ${textMap.getText(diff.AreaNameID)} Difficulty ${diff.Difficulty}`)
			continue
		}
		
		const domains: string[] = []
		function addDomain(entry: InternalWorldMapEntry, num: number) {
			domains.push(`${order[diff.AreaProgress == 1 ? 1 : 2][num]}*${entry.LevelList[0]}`)
			if (entry.NextSiteIDList?.[0]) addDomain(map[entry.NextSiteIDList[0]], num + 1)
		}
		addDomain(Object.values(map).find(domain => domain.IsStart)!, 0)
		layout.push(`{{SU Domain Card|${domains.join(';')}}}`)
		
		table.addRowWithAttr(attr, `'''Layout'''<br />${layout.join('')}`)
		
		table.addRowWithAttr(attr, `'''Boss Enem${Object.values(diff.DisplayMonsterMap).length == 1 ? 'y' : 'ies'}'''<br />${enemyList(diff.DisplayMonsterMap)}`)
		
		table.addRowWithAttr(attr, `'''May Encounter'''<br />${enemyList(diff.DisplayMonsterMap2)}`)

		rowCount += 3
		
		if (diff.FirstReward && rewards[diff.FirstReward]) {
			table.addRowWithAttr(attr, `'''First-Time Clearance Reward'''<br />${reward(rewards[diff.FirstReward])}`)
			rowCount++
		}
		
		table.addRowWithAttr(attr, `'''Extra Drops'''<br />${itemList(diff.MonsterDisplayItemList)}`)
		rowCount++

		if (diff.ChestDisplayItemList?.length) {
			table.addRowWithAttr(attr, `'''Immersion Reward'''<br/>${itemList(diff.ChestDisplayItemList, true)}`)
			rowCount++
		}
		
		row.contents[0] = row.contents[0].replace('<<ROWCOUNT>>', rowCount.toString())
	}
	
	if (table.data.length > 1) {
		output.push('')
		const worldName = textMap.getText(first.AreaNameID)
		output.push(`===[[File:Simulated Universe ${worldName}.png|45px|link=]] ${worldName}===`)
		if (difficulties.length > 1) {
			output.push(`<div class="mw-customtoggle-lowerdiff${first.AreaProgress} wds-button" style="margin:3px 5px 3px 0px;">Toggle Lower Difficulties</div>`)
		}
		output.push(table.wikitable())
	}

	// if (tabber.tabs.length > 1) {
	// 	output.push(`===${textMap.getText(first.AreaNameID)}===`)
	// 	output.push(tabber.template(), '')
	// } else if (tabber.tabs.length == 1) {
	// 	output.push(`===${textMap.getText(first.AreaNameID)}===`)
	// 	output.push(tabber.tabs[0][1], '')
	// }
}

writeFileSync('./output/worlds.wikitext', output.join('\n'))

export function enemyList(monsterMap: Dictionary<number>) {
	return `{{Card List|${Object.entries(monsterMap).map(([id, lvl]) => `${textMap.getText(Stage.monsters[id].MonsterName)}*Lv. ${lvl}`).join(',')}|type=Enemy|show_caption=1}}`
}

export function itemList(itemList: ItemReference[], caption = false) {
	return `{{Card List|1=${itemList.map(item => {
			const itemData = items[item.ItemID] ?? charItems[item.ItemID] ?? relicItems[item.ItemID]
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
		}).join(';')}${caption ? '|show_caption=1' : ''}|delim=;}}`
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