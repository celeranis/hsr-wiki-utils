import { Dictionary, VERSION_LIST, Version } from './Shared.js';
import { HttpError, getFile } from './files/GameFile.js';
import type { ItemConfig } from './files/Item.js';
import type { InternalMainMission } from './files/Mission.js';
import type { RogueTalkNameConfig } from './files/Occurrence.js';
import type { InternalWorldInfo } from './files/Worlds.js';

const ITEM_ID_MATCH = (items: ItemConfig, itemId: string) => items[itemId]

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
		
		for (const version of VERSION_LIST.toReversed()) {
			const versionData = await this.readVersion(version)
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
	}
	
	static occurrences = new ChangeHistory(
		'ExcelOutput/RogueTalkNameConfig.json',
		(items: RogueTalkNameConfig, talkId: string) => items[talkId]
	)

	static missions = new ChangeHistory(
		'ExcelOutput/MainMission.json',
		(items: Dictionary<InternalMainMission>, missionId: string) => items[missionId]
	)
	
	static worlds = new ChangeHistory(
		'ExcelOutput/RogueAreaConfig.json',
		(worlds: Dictionary<InternalWorldInfo>, worldId: string | number) => worlds[worldId]
	)
}