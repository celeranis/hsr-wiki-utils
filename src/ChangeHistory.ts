import { readFile } from 'fs/promises';
import config from '../config.json' with { "type": "json" };
import { Dictionary, VERSION_LIST, Version } from './Shared.js';
import { HashReference, SupportedLanguage, TextMap } from './TextMap.js';
import { InternalEquationData } from './files/Equation.js';
import { HttpError, getFile } from './files/GameFile.js';
import type { ItemConfig } from './files/Item.js';
import { InternalMessagesContact } from './files/Messages.js';
import type { InternalMainMission } from './files/Mission.js';
import type { RogueTalkNameConfig } from './files/Occurrence.js';
import { InternalBookSeries } from './files/Readable.js';
import { InternalShop } from './files/Shop.js';
import { InternalStage } from './files/Stage.js';
import type { InternalWorldInfo } from './files/Worlds.js';
import { MazeFloor } from './files/graph/MapData.js';

const ITEM_ID_MATCH = (items: ItemConfig, itemId: number | string) => Object.values(items).find(item => item?.ID == itemId)
let hashDiffs: Record<number, bigint> | undefined = undefined

/**
 * This is a somewhat abstract class used to figure out the change history of something.
 */
export class ChangeHistory<FileContents extends object, SearchReturn, FindArg> {
	private readonly versions: Map<Version, FileContents | null> = new Map()
	
	constructor(public filePath: string, private search: (data: FileContents, arg: FindArg) => SearchReturn | undefined) { }
	
	private async readVersion(version: Version): Promise<FileContents | null> {
		if (!this.versions.has(version)) {
			const data = await getFile<FileContents>(this.filePath, version)
				.catch(err => {
					// file did not exist at this time
					if (
						(err instanceof HttpError && err.status == 404) // file not found in remote repository
						|| (err instanceof Error && 'code' in err && err.code == 'ENOENT') // file not found on local system
					) {
						return null;
					}
					throw err;
				})
			
			this.versions.set(version, data)
			return data
		}
		
		return this.versions.get(version)!
	}
	
	async findAdded(target: FindArg): Promise<[Version, SearchReturn] | [null, null]> {
		let lastFoundVersion: Version | undefined = undefined
		let lastFound: SearchReturn | undefined = undefined
		
		const versionDataMap = await Promise.all(VERSION_LIST.toReversed()
			.map(async version => [version, await this.readVersion(version)] as const)
		)
		
		for (const [version, versionData] of versionDataMap) {
			const searchReturn = versionData != null && this.search(versionData, target)
			
			if (!searchReturn) {
				break
			}
			
			lastFoundVersion = version
			lastFound = searchReturn
		}
		
		return lastFoundVersion ? [lastFoundVersion, lastFound!] : [null, null]
	}
	
	// keys mirror Item.ts itemData
	static readonly item = {
		main: new ChangeHistory('ExcelOutput/ItemConfig.json', ITEM_ID_MATCH),
		characters: new ChangeHistory('ExcelOutput/ItemConfigAvatar.json', ITEM_ID_MATCH),
		character_default_pfps: new ChangeHistory('ExcelOutput/ItemConfigAvatarPlayerIcon.json', ITEM_ID_MATCH),
		eidolons: new ChangeHistory('ExcelOutput/ItemConfigAvatarRank.json', ITEM_ID_MATCH),
		skins: new ChangeHistory('ExcelOutput/ItemConfigAvatarSkin.json', ITEM_ID_MATCH),
		readables: new ChangeHistory('ExcelOutput/ItemConfigBook.json', ITEM_ID_MATCH),
		disks: new ChangeHistory('ExcelOutput/ItemConfigDisk.json', ITEM_ID_MATCH),
		light_cones: new ChangeHistory('ExcelOutput/ItemConfigEquipment.json', ITEM_ID_MATCH),
		relics: new ChangeHistory('ExcelOutput/ItemConfigRelic.json', ITEM_ID_MATCH),
		profile_pics: new ChangeHistory('ExcelOutput/ItemPlayerCard.json', ITEM_ID_MATCH),
		train_dynamic: new ChangeHistory('ExcelOutput/ItemConfigTrainDynamic.json', ITEM_ID_MATCH),
	}
	
	static occurrences = new ChangeHistory(
		'ExcelOutput/RogueTalkNameConfig.json',
		(items: RogueTalkNameConfig, talkId: string | number) => Object.values(items).find(item => item.TalkNameID == talkId)
	)

	static missions = new ChangeHistory(
		'ExcelOutput/MainMission.json',
		(items: Dictionary<InternalMainMission>, missionId: string | number) => Object.values(items).find(item => item.MainMissionID == missionId)
	)
	
	static worlds = new ChangeHistory(
		'ExcelOutput/RogueAreaConfig.json',
		(worlds: Dictionary<InternalWorldInfo>, worldId: string | number) => Object.values(worlds).find(item => item.RogueAreaID == worldId)
	)
	
	static mazeFloors = new ChangeHistory(
		'ExcelOutput/MazeFloor.json',
		(floors: Dictionary<MazeFloor>, floorId: string | number) => Object.values(floors).find(item => item.FloorID == floorId)
	)
	
	static weeklyChallenge = new ChangeHistory(
		'ExcelOutput/RogueTournWeeklyChallenge.json',
		(challenges: Dictionary<any>, challengeId: number) => Object.values(challenges).find(challenge => challenge.ChallengeID == challengeId)
	)
	
	static shops = new ChangeHistory(
		'ExcelOutput/ShopConfig.json',
		(shops: Dictionary<InternalShop>, shopId: number) => Object.values(shops).find(shop => shop.ShopID == shopId)
	)
	
	static readableSeries = new ChangeHistory(
		'ExcelOutput/BookSeriesConfig.json',
		(readables: Dictionary<InternalBookSeries>, seriesId: number) => Object.values(readables).find(readable => readable.BookSeriesID == seriesId)
	)
	
	static messageContact = new ChangeHistory(
		'ExcelOutput/MessageContactsConfig.json',
		(contacts: Dictionary<InternalMessagesContact>, contactId: number) => Object.values(contacts).find(contact => contact.ID == contactId)
	)
	
	static stage = new ChangeHistory(
		'ExcelOutput/StageConfig.json',
		(stages: InternalStage[], stageId: number) => Object.values(stages).find(stage => stage.StageID == stageId)
	)

	static equation = new ChangeHistory(
		'ExcelOutput/RogueTournFormula.json',
		(equations: InternalEquationData[], equationId: number) => Object.values(equations).find(equation => equation.FormulaID == equationId)
	)
	
	static async getRenameHistory(textMapHash: HashReference | number | bigint | string) {
		let lastText: string | undefined = undefined
		let results: string[] = []
		
		let oldHash: number
		if (typeof (textMapHash) == 'string' && !Number(textMapHash)) {
			oldHash = TextMap.getStableHash(textMapHash, false)
			textMapHash = TextMap.getStableHash(textMapHash, true)
		} else {
			hashDiffs ??= JSON.parse((await readFile('./output/hash_diffs.json')).toString())
			oldHash = hashDiffs![textMapHash.toString()]
		}

		for (const version of VERSION_LIST) {
			const textMap = await TextMap.load(version, config.output_lang as SupportedLanguage)
			
			const text = textMap.getText(version < '3.1' ? (oldHash ?? textMapHash) : textMapHash)
			if (text && lastText != text) {
				if (lastText) {
					results.push(`Renamed to "${text}" in version ${version}`)
				} else {
					if (version == '3.1' && !oldHash) {
						results.push('History before version 3.1 may have been lost due to hash changes.')
					}
					results.push(`Added in version ${version} as "${text}"`)
				}
				lastText = text
			}
		}

		return results
	}
	
	static async findText(text: string) {
		for (const version of VERSION_LIST.toReversed()) {
			const textMap = await TextMap.load(version, config.output_lang as SupportedLanguage)

			const found = Object.entries(textMap.json).find(([, entry]) => entry == text)
			if (found) {
				return await this.getRenameHistory(found[0])
			}
		}

		return []
	}
	
	static async findTerm(text: string) {
		for (const version of VERSION_LIST.toReversed()) {
			const textMap = await TextMap.load(version, config.output_lang as SupportedLanguage)

			const found = Object.entries(textMap.json).filter(([, entry]) => entry.includes(text))
			if (found.length) {
				console.log(`Found ${found.length} occurrences in version ${version}:\n${found.map(f => f[0]).join(' ')}`)
			}
		}
	}
}