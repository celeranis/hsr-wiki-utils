import { writeFile } from 'fs/promises';
import { GoldenBloodBoon } from '../Boon.js';
import { ChangeHistory } from '../ChangeHistory.js';
import { Curio, RogueTournMiracle } from '../Curio.js';
import { Equation } from '../Equation.js';
import { Item, ItemList } from '../Item.js';
import { Dictionary, zeroPad } from '../Shared.js';
import { HashReference, TextMap, textMap } from '../TextMap.js';
import { WeirdKey } from '../WeirdKey.js';
import { InternalRogueBonus } from '../files/Blessing.js';
import { getExcelFile, getFile } from '../files/GameFile.js';
import { teardown } from '../util/JSONParser.js';

interface InternalWeeklyChallenge {
	ChallengeID: number
	WeeklyName: HashReference
	WeeklyContentList: number[]
	WeeklyContentDetailList: number[]
	RewardID: number
	DisplayFinalMonsterGroups: {
		"0": number
	}
	DisplayMonsterGroups1: {
		"0": number
		"3": number
	}
	DisplayMonsterGroups2: {
		"0": number
		"3": number
	}
	DisplayMonsterGroups3: {
		"0": number
	}
}

interface InternalWeeklyDisplay {
	WeeklyDisplayID: number
	WeeklyDisplayContent: HashReference
	DescParams: Dictionary<string>[]
}

const weeklyData = await getFile<Dictionary<InternalWeeklyChallenge>>('ExcelOutput/RogueTournWeeklyChallenge.json')
const weeklyDisplay = await getExcelFile<InternalWeeklyDisplay>('ExcelOutput/RogueTournWeeklyDisplay.json', 'WeeklyDisplayID')
const rogueMonsterGroups = await getFile('ExcelOutput/RogueMonsterGroup.json')
const rogueMonsters = await getFile('ExcelOutput/RogueMonster.json')
const monsterNpcs = await getFile('ExcelOutput/NPCMonsterData.json')
const rogueBonus = await getExcelFile<InternalRogueBonus>('RogueBonus.json', 'BonusID')

await Item.loadAll()

const START_DATE = Date.parse('2024-06-17 04:00:00 UTC')
const DURATION = 1000 * 60 * 60 * 24 * 7

function displayDate(date: Date) {
	return `${date.getUTCFullYear()}-${zeroPad(date.getUTCMonth()+1, 2)}-${zeroPad(date.getUTCDate(), 2)} ${zeroPad(date.getUTCHours(), 2)}:${zeroPad(date.getUTCMinutes(), 2)}:${zeroPad(date.getUTCSeconds(), 2)}`
}

export function getEnemyList(groupId: number) {
	return Object.keys(Object.values(rogueMonsterGroups).find(grp => grp.RogueMonsterGroupID == groupId)!.RogueMonsterListAndWeight)
		.map(monster => Object.values(rogueMonsters).find(m => m.RogueMonsterID == monster))
		.map(rmonster => Object.values(monsterNpcs).find(npc => npc.ID == rmonster.NpcMonsterID))
		.map(npcmonter => textMap.getText(npcmonter.NPCName))
}

let trailblazeNumber = 504

const IGNORE_RULES = [1001, 1003, 1004, 1005, 2001, 2003, 2004, 2005, 2006]

for (const data of Object.values(weeklyData)) {
	const periodStart = new Date(START_DATE + (DURATION * (data.ChallengeID - 1)))
	const periodEnd = new Date(START_DATE + (DURATION * data.ChallengeID) - 1)

	const curios: Curio[] = []
	const equations: Equation[] = []
	const boons: GoldenBloodBoon[] = []
	
	for (const displayId of data.WeeklyContentList) {
		const display = weeklyDisplay[displayId]!
		for (const entry of display.DescParams) {
			if (entry[WeirdKey.get('DescParamType')] == 'Formula') {
				equations.push(new Equation(Number(entry[WeirdKey.get('DescParamValue')])))
			} else if (entry[WeirdKey.get('DescParamType')] == 'Miracle') {
				if (!RogueTournMiracle[entry[WeirdKey.get('DescParamValue')]]) continue
				curios.push(new Curio(Number(entry[WeirdKey.get('DescParamValue')]), true))
			} else if (entry[WeirdKey.get('DescParamType')] == 'TitanBless') {
				boons.push(GoldenBloodBoon.fromId(entry[WeirdKey.get('DescParamValue')]))
			} else {
				console.warn(`Unknown DescParam type`, entry)
			}
		}
	}
	
	const alreadyIncludedRules = new Set<number>()
	const rules = data.WeeklyContentDetailList.map(id => alreadyIncludedRules.add(id) && textMap.getText(weeklyDisplay[id]?.WeeklyDisplayContent)?.replace(/^● /, ''))
	data.WeeklyContentList.filter(item => !IGNORE_RULES.includes(item) && !alreadyIncludedRules.has(item) && !weeklyDisplay[item]?.DescParams?.length).forEach(item => rules.push(textMap.getText(weeklyDisplay[item].WeeklyDisplayContent)?.replace(/^● /, '')))
	
	let trailblazeBlessing = ''
	if (equations?.length > 0 && data.ChallengeID >= 38) {
		const bonus = rogueBonus[trailblazeNumber]
		trailblazeBlessing = `'''${textMap.getText(bonus.BonusTitle)}'''<br />${textMap.getText(bonus.BonusDesc)}`
		trailblazeNumber += 1
	}
	
	const [version] = await ChangeHistory.weeklyChallenge.findAdded(data.ChallengeID)
	const output = [
		`<%-- [PAGE_INFO]`,
		`PageTitle=#Divergent Universe/Cyclical Extrapolation/${periodStart.getUTCFullYear()}-${zeroPad(periodStart.getUTCMonth()+1, 2)}-${zeroPad(periodStart.getUTCDate(), 2)}#`,
		`[END_PAGE_INFO] --%>`,
		`{{Event`,
		`|name              = ${textMap.getText(data.WeeklyName)}`,
		`|image             = Event ${textMap.getText(data.WeeklyName).replaceAll(':', '')}.png`,
		`|type              = Cyclical Extrapolation`,
		`|time_known        = yes`,
		`|time_start        = ${displayDate(periodStart)}`,
		`|time_end          = ${displayDate(periodEnd)}`,
		'}}',
		'',
		`{{Cyclical Extrapolation`,
		`|boons      = ${boons.map(boon => boon.name).join('; ')}`,
		`|curios     = ${curios.map(curio => curio.name).join('; ')}`,
		`|equations  = ${equations.map(equation => equation.name).join(';; ')}`,
		`|trailblaze = ${trailblazeBlessing}`,
		`|rewards    = ${ItemList.fromRewardId(data.RewardID).asCardListParams()}`,
		`|boss_1_1   = ${getEnemyList(data.DisplayMonsterGroups1[0]).join('; ')}`,
		`|boss_1_2   = ${getEnemyList(data.DisplayMonsterGroups1[3]).join('; ')}`,
		`|boss_2_1   = ${getEnemyList(data.DisplayMonsterGroups2[0]).join('; ')}`,
		`|boss_2_2   = ${getEnemyList(data.DisplayMonsterGroups2[3]).join('; ')}`,
		`|boss_3     = ${getEnemyList(data.DisplayMonsterGroups3[0]).join('; ')}`,
		`|rules      = ${rules.join('; ')}`,
		`|root       = ${data.ChallengeID > 37 ? 'Divergent Universe: Protean Hero' : 'Divergent Universe: The Human Comedy'}`,
		`}}`,
		'',
		`==Other Languages==`,
		`${await TextMap.generateOL(data.WeeklyName)}`,
		'',
		'==Change History==',
		`{{Change History|${version}}}`
	]
	
	await writeFile(`./output/du_weekly/${data.ChallengeID}.wikitext`, output.join('\n'))
}

teardown()