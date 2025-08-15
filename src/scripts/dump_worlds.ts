import { mkdirSync, writeFileSync } from 'fs'
import { ChangeHistory } from '../ChangeHistory.js'
import { Item, ItemList } from '../Item.js'
import { Dictionary, sanitizeString, wikiTitle } from '../Shared.js'
import { MonsterConfig } from '../Stage.js'
import { TextMap, typeDisplayName } from '../TextMap.js'
import { getFile } from '../files/GameFile.js'
import type { InternalUnlockInfo, InternalWorldInfo, InternalWorldMap } from '../files/Worlds.js'
import { teardown } from '../util/JSONParser.js'
import { Tabber } from '../util/Tabber.js'
import { Table } from '../util/Table.js'
import { Template } from '../util/Template.js'

const maps: InternalWorldMap = await getFile('ExcelOutput/RogueMap.json')
const worlds: Dictionary<InternalWorldInfo> = await getFile('ExcelOutput/RogueAreaConfig.json')
const unlockInfo: Dictionary<InternalUnlockInfo> = await getFile('ExcelOutput/RogueUnlockConfig.json')

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', "VI", 'VII', 'VIII', 'IX', 'X']

const order = {
	1: [
		'Combat', 'Elite', 
		'Respite', 'Combat', 'Occurrence', 
		'Respite', 'Boss'
	],
	2: [
		'Combat', ['Combat', 'Occurrence'], ['Combat', 'Occurrence'], 'Elite', 
		'Respite', 'Combat', ['Combat', 'Occurrence', 'Encounter'], 'Elite',
		'Respite', ['Combat', 'Occurrence', 'Transaction'],
		['Combat', 'Occurrence', 'Transaction', 'Encounter'],
		'Respite', 'Boss'
	]
}

const textMap = TextMap.default

const worldSet = new Map<number, InternalWorldInfo[]>()

// organize difficulties by world
for (const world of Object.values(worlds)) {
	if (!worldSet.has(world.AreaProgress)) worldSet.set(world.AreaProgress, [])
	
	const list = worldSet.get(world.AreaProgress)!
	list.push(world)
}

await Item.loadAll()

for (const difficulties of worldSet.values()) {
	const first = difficulties[0]
	const last = difficulties[difficulties.length - 1]
	// const highest = difficulties.reduce((highest, diff) => Math.max(highest, diff.Difficulty), 1)

	const worldName = textMap.getText(first.AreaNameID)

	const domainTabber = new Tabber()
	const difficultyTable = new Table('article-table', ['Difficulty' , '[[Equilibrium Level]]<br />Required', 'Recommended<br />Team Level'])
	const rewardTable = new Table('wikitable', ['Difficulty', 'Rewards'])
	
	const infobox = new Template('Domain Infobox')
		.addParam('title', worldName)
		.addParam('image', `Simulated Universe ${worldName}.png`)
		.addParam('type', 'Simulated Universe')
		.addParam('type2', 'World')
		.addParam('mechanism', '')
		.addParam('boss', Object.keys(first.DisplayMonsterMap).map(id => textMap.getText(MonsterConfig[id].MonsterName)).join('; '))
	
	const requiredELs: string[] = []
	const recLevels: number[] = []

	for (const diff of difficulties) {
		const unlockDetail = textMap.getText(unlockInfo[diff.UnlockID]?.RogueUnlockDetail)
		
		const requiredEL = unlockDetail.match(/Equilibrium Level (\d+)/i)?.[1]
		if (requiredEL) requiredELs.push(requiredEL)
		
		recLevels.push(diff.RecommendLevel)
		difficultyTable.addRow(NUMERALS[diff.Difficulty - 1], requiredEL || '0', `Lv. ${diff.RecommendLevel}`)
		
		const maxPts = Object.values(diff.ScoreMap).pop()
		if (maxPts) {
			const pointsTable = new Table('article-table tdc1', ['Domain', 'Points', '{{Item|Ability Point|20|text=Ability Points}}'])
			
			for (const [domain, pts] of Object.entries(diff.ScoreMap)) {
				pointsTable.addRow(domain, pts.toString(), Math.round(pts / 10).toString())
			}
			
			const row = [
				`'''Maximum Points''': ${maxPts}<br />`,
				`'''Maximum {{Item|Ability Point|20|text=Ability Points}}''': ${Math.round(maxPts / 10)}<br />`,
				`{{Collapsible`,
				`|${Object.values(diff.ScoreMap).length == 13 ? `{{SU Partial Point Rewards|${maxPts}}}` : ''}`,
				Object.values(diff.ScoreMap).length == 13 ? undefined : pointsTable.wrapper(),
				`|Partial Rewards`,
				'|collapsed=1',
				`}}`
			]
			rewardTable.addRow(`rowspan=2 | ${NUMERALS[diff.Difficulty - 1] || 'I'}`, row.filter(Boolean).join('\n'))
		}
		
		const rewardListRow: string[] = []
		if (diff.FirstReward && ItemList.rewardData[diff.FirstReward]) {
			rewardListRow.push(`'''First-Time Clearance Reward:'''<br />${ItemList.fromRewardId(diff.FirstReward).asCardList()}`)
		}

		if (diff.ChestDisplayItemList?.length) {
			rewardListRow.push(`'''Immersion Reward:'''<br/>${new ItemList(diff.ChestDisplayItemList).asCardList(false, true)}`)
		}

		rewardListRow.push(`'''Extra Drops:'''<br />${new ItemList(diff.MonsterDisplayItemList).asCardList(false, true)}`)
		
		if (maxPts) {
			rewardTable.addRow(rewardListRow.join('<br />\n'))
		} else {
			rewardTable.addRow(NUMERALS[diff.Difficulty - 1], rewardListRow.join('<br />\n'))
		}
		
		const map = maps[(diff.AreaProgress * 100) + diff.Difficulty]
		
		if (!map) {
			console.error(`No map found for ${textMap.getText(diff.AreaNameID)} Difficulty ${diff.Difficulty}`)
			continue
		}

		const domainTable = new Table('wikitable tdc1', ['Number', 'Possible Domains', 'Possible Enemies'])
		
		let secondElite = false
		for (const [i, currentDomains] of order[diff.AreaProgress == 1 ? 1 : 2].entries()) {
			const areaData = (typeof currentDomains == 'string' || i == 9) ? map[i + 1] : map[`${i + 1}1`]
			const card = `{{SU Domain Card|${typeof currentDomains == 'string' ? currentDomains : currentDomains.join(';')}|${areaData.LevelList[0]}}}`
			if (currentDomains == 'Elite') {
				let enemies: any = Object.entries(diff.DisplayMonsterMap2)
					.filter(([, val]) => secondElite || val == areaData.LevelList[0])
					
				// if (secondElite) enemies = Object.entries(diff.DisplayMonsterMap2)
					
				enemies = enemies
					.map(([id]) => textMap.getText(MonsterConfig[id].MonsterName))
					.map(name => (secondElite && !name.endsWith('(Bug)')) ? `${name} (Bug)` : name)
					.join(';')
				
				domainTable.addRow((i + 1).toString(), card, `{{Card List|${enemies}|amount=Lv. ${areaData.LevelList[0]}|type=Enemy|show_caption=1|delim=;}}`)
				
				secondElite = true
			} 
			
			else if (currentDomains == 'Boss') {
				const enemies = Object.entries(diff.DisplayMonsterMap)
					.map(([id]) => textMap.getText(MonsterConfig[id].MonsterName))
					.join(';')

				domainTable.addRow((i + 1).toString(), card, `{{Card List|${enemies}|amount=Lv. ${areaData.LevelList[0]}|type=Enemy|show_caption=1|delim=;}}`)
			}
			
			else {
				domainTable.addRow((i + 1).toString(), card)
			}
		}
		
		domainTabber.addTab(`Difficulty ${NUMERALS[diff.Difficulty - 1]}`, domainTable.wrapper())
	}
	
	const relics = new ItemList(new ItemList(last.ChestDisplayItemList).data.filter(item => item.item.subtype.toString().includes('Relic') && item.item.rarity == 5))
	
	infobox
		.addParam('requiredEL', requiredELs.join('/'))
		.addParam('recLevel', recLevels.join('/'))
		.addParam('recTypes', first.RecommendNature.map(type => typeDisplayName(type)).join(','))
		.addParam('cost', 40)
		.addParam('drops', relics.asBasicList('; '))
		.addParam('drops_delim', ';')
		.addParam('rewards', '')
		
	const output = [
		`<%-- [PAGE_INFO]\nPageTitle=#Simulated Universe/Worlds/${wikiTitle(worldName)}#\n[END_PAGE_INFO] --%>`,
		infobox.block(13),
		`'''${worldName}''' is a [[Simulated Universe/Worlds#Worlds|World]] in the Simulated Universe${ relics.data.length > 0 ? ` that can be challenged to obtain the Planar Ornament sets ${relics.asBasicList(' and ', true)}.` : '.' }`,
		'\n==Requirements==',
		`* ${textMap.getText(unlockInfo[first.UnlockID]?.RogueUnlockDetail)?.replace(/Trailblaze Mission "(.+?)"/i, "[[Trailblaze Mission]] ''[[$1]]''") || 'None'}`,
		'\n==Stages==',
		difficultyTable.wikitable(),
		'\n==Rewards==',
		rewardTable.wikitable(),
		'\n==Domains==',
		domainTabber.template(),
		'\n==Other Languages==',
		await TextMap.generateOL(first.AreaNameID),
		'\n==Change History==',
		`{{Change History|${(await ChangeHistory.worlds.findAdded(first.RogueAreaID))[0]}}}`,
		'\n==Navigation==',
		`{{Domain Navbox}}`
	]
	
	mkdirSync('./output/worlds', { recursive: true })
	writeFileSync(`./output/worlds/${sanitizeString(worldName)}.wikitext`, output.join('\n'))
}

teardown()