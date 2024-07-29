import { writeFile } from 'fs/promises';
import { Curio } from '../Curio.js';
import { Equation } from '../Equation.js';
import { Item, ItemList } from '../Item.js';
import { Dictionary, zeroPad } from '../Shared.js';
import { HashReference, TextMap, textMap } from '../TextMap.js';
import { WeirdKey } from '../WeirdKey.js';
import { getFile } from '../files/GameFile.js';

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
const weeklyDisplay = await getFile<Dictionary<InternalWeeklyDisplay>>('ExcelOutput/RogueTournWeeklyDisplay.json')
const rogueMonsterGroups = await getFile('ExcelOutput/RogueMonsterGroup.json')
const rogueMonsters = await getFile('ExcelOutput/RogueMonster.json')
const monsterNpcs = await getFile('ExcelOutput/NPCMonsterData.json')

await Item.loadAll()

const START_DATE = Date.parse('2024-06-17 04:00:00 UTC')
const DURATION = 1000 * 60 * 60 * 24 * 7

function displayDate(date: Date) {
	return `${date.getUTCFullYear()}-${zeroPad(date.getUTCMonth()+1, 2)}-${zeroPad(date.getUTCDate(), 2)} ${zeroPad(date.getUTCHours(), 2)}:${zeroPad(date.getUTCMinutes(), 2)}:${zeroPad(date.getUTCSeconds(), 2)}`
}

export function getEnemyList(groupId: number) {
	return Object.keys(rogueMonsterGroups[groupId].RogueMonsterListAndWeight)
		.map(monster => rogueMonsters[monster])
		.map(rmonster => monsterNpcs[rmonster.NpcMonsterID])
		.map(npcmonter => textMap.getText(npcmonter.NPCName))
}

for (const data of Object.values(weeklyData)) {
	const periodStart = new Date(START_DATE + (DURATION * (data.ChallengeID - 1)))
	const periodEnd = new Date(START_DATE + (DURATION * data.ChallengeID) - 1)

	const curios: Curio[] = []
	const equations: Equation[] = []
	
	for (const displayId of data.WeeklyContentList) {
		const display = weeklyDisplay[displayId]
		for (const entry of display.DescParams) {
			if (entry[WeirdKey.get('DescParamType')] == 'Formula') {
				equations.push(new Equation(Number(entry[WeirdKey.get('DescParamValue')])))
			} else if (entry[WeirdKey.get('DescParamType')] == 'Miracle') {
				curios.push(new Curio(Number(entry[WeirdKey.get('DescParamValue')])))
			}
		}
	}
	
	const output = [
		`<%-- [PAGE_INFO]`,
		`PageTitle=#Divergent Universe/Extrapolation/${periodStart.getUTCFullYear()}-${zeroPad(periodStart.getUTCMonth()+1, 2)}-${zeroPad(periodStart.getUTCDate(), 2)}#`,
		`[END_PAGE_INFO] --%>`,
		`{{Event`,
		`|name              = ${textMap.getText(data.WeeklyName)}`,
		`|image             = Event ${textMap.getText(data.WeeklyName).replaceAll(':', '')}.png`,
		`|type              = Cyclical Extrapolation`,
		`|time_start        = ${displayDate(periodStart)}`,
		`|time_end          = ${displayDate(periodEnd)}`,
		'}}',
		'',
		`{{Cyclical Extrapolation`,
		`|curios     = ${curios.map(curio => curio.name).join('; ')}`,
		`|equations  = ${equations.map(equation => `${equation.name}//${equation.path1}//${equation.path2}//${equation.rarity}`).join(';; ')}`,
		`|rewards    = ${ItemList.fromRewardId(data.RewardID).asCardListParams()}`,
		`|boss_1_1   = ${getEnemyList(data.DisplayMonsterGroups1[0]).join('; ')}`,
		`|boss_1_2   = ${getEnemyList(data.DisplayMonsterGroups1[3]).join('; ')}`,
		`|boss_2_1   = ${getEnemyList(data.DisplayMonsterGroups2[0]).join('; ')}`,
		`|boss_2_2   = ${getEnemyList(data.DisplayMonsterGroups2[3]).join('; ')}`,
		`|boss_3     = ${getEnemyList(data.DisplayMonsterGroups3[0]).join('; ')}`,
		`}}`,
		'',
		`==Other Languages==`,
		`${await TextMap.generateOL(data.WeeklyName)}`,
		'',
		'==Change History==',
		`{{Change History|2.3}}`
	]
	
	await writeFile(`./output/du_weekly/${data.ChallengeID}.wikitext`, output.join('\n'))
}