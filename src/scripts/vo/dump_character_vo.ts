import { existsSync } from 'fs';
import { rm } from 'fs/promises';
import { getFile } from '../../files/GameFile.js';
import { zeroPad } from '../../Shared.js';
import { textMap } from '../../TextMap.js';
import { dumpFile, getFilesByPrefix, langs } from './util.js';

if (existsSync('./output/file/vo/character/')) {
	await rm('./output/file/vo/character/', { recursive: true })
}

export interface AnimEvent {
	$type: 'RPG.GameCore.TriggerSoundInAnim'
	SoundName: string
	StopOnAnimStateExit?: string
}

export interface AnimStateEvent {
	AnimatorStateName: string
	NormalizedTime?: number
	EventList: AnimEvent[]
}

export interface AudioConfig {
	AnimatorStateEvents: AnimStateEvent[]
}

const DISPLAY_MAP = {
	Hit_H: 'Hit by Heavy Attack',
	Die: 'Downed',
	Die_Hit: 'Downed',
	Die_Limbo: 'Downed',
	Skill01: 'Basic ATK',
	Skill02: 'Skill',
	Skill02_Failed: 'Skill',
	Skill02_Success: 'Skill',
	Skill03: 'Ultimate - Unleash',
	Skill01_Special: 'Enhanced Basic ATK',
	Skill11: 'Enhanced Basic ATK',
	Skill12: 'Enhanced Basic ATK',
	Skill13: 'Enhanced Basic ATK',
	Skill11_Start: 'Enhanced Basic ATK',
	Skill12toSkill13: 'Enhanced Basic ATK',
	Skill02_01: 'Skill',
	Skill_Passive01: 'Talent',
	Skill_Passive01_End: 'Talent',
	SkillP01: 'Talent',
	Skill01_Ready_Special: 'Talent',
	PassiveSkill: 'Talent',
	
	ActionBegin: 'Turn Begins',
	ActionBeginAdvantage: 'Battle Begins - Weakness Break',
	ActionBeginHighThreat: 'Battle Begins - Danger Alert',
	ReceiveHealing: 'Health Recovery',
	ReceiveBuff: 'Received Buff', // seemingly unused?
	Revived: 'Return to Battle',
	UltraReady: 'Ultimate - Activate',
	LightHit: 'Hit by Light Attack',
	StandBy: 'Turn Idling',
	
	Idle_Show_01: 'Idle Animation',
	Idle_Show_02: 'Idle Animation',
	Attack_1: 'Exploration Attack',
	MazeSkill: 'Technique',
}

const OVERRIDE_CHARACTERS = {
	mar7th: 'March 7th (Preservation)',
	mar7th2: 'March 7th (The Hunt)',
	playerboy: 'Caelus (Destruction)',
	playergirl: 'Stelle (Destruction)',
	playerboy2: 'Caelus (Preservation)',
	playergirl2: 'Stelle (Preservation)',
	playerboy3: 'Caelus (Harmony)',
	playergirl3: 'Stelle (Harmony)'
}

const characters = await getFile('ExcelOutput/AvatarConfig.json')
const mazeCharacters = await getFile('ExcelOutput/AdventurePlayer.json')
const audioConfig = await getFile<any>('Config/AudioConfig.json')

function getGlobalAnimEvents(voTag: string): AnimStateEvent[] {
	const globals: AnimStateEvent[] = []
	for (const [event, format] of Object.entries(audioConfig.CharacterVOEventMap)) {
		globals.push({
			AnimatorStateName: event,
			EventList: [
				{
					$type: 'RPG.GameCore.TriggerSoundInAnim',
					SoundName: (format as string).replaceAll('{0}', voTag),
				}
			]
		})
	}
	return globals
}

for (const character of Object.values(characters)) {
	let nums = {}
	let alreadyDumped = new Set<string>()
	
	const characterName = OVERRIDE_CHARACTERS[character.AvatarVOTag] ?? textMap.getText(character.AvatarName)
	const characterJson = await getFile<any>(character.JsonPath)
	const playerJson = await getFile<any>(Object.values(mazeCharacters).find(char => char.AvatarID == character.AvatarID).PlayerJsonPath)
	
	for (const audio of [...playerJson.AnimEventConfigList, ...characterJson.AnimEventConfigList]) {
		if (!audio.includes('/Audio/') || audio.includes('/Common/')) continue
		const audioConfig = await getFile<AudioConfig>(audio)
		for (const animState of [...audioConfig.AnimatorStateEvents, ...getGlobalAnimEvents(character.AvatarVOTag)]) {
			for (const event of animState.EventList) {
				if (typeof event.SoundName == 'object' && 'Value' in event.SoundName) {
					event.SoundName = (event.SoundName as any).Value
				}
				if (!event.SoundName || !event.SoundName.includes('vo_')) continue
				for (const soundData of getFilesByPrefix(event.SoundName)) {
					if (soundData.lang == 'sfx' || soundData.file.includes('(1093036399=None)') || alreadyDumped.has(soundData.file_path)) continue
					const lang = langs[soundData.lang]
					const eventDisplay = DISPLAY_MAP[animState.AnimatorStateName] ?? animState.AnimatorStateName
					const speedSuffix = soundData.speed_state == 2 ? ' 2x' : ''
					const nkey = `${soundData.lang}/${eventDisplay}/${soundData.speed_state}`
					nums[nkey] = (nums[nkey] ?? 0) + 1
					alreadyDumped.add(soundData.file_path)
					await dumpFile(`./output/file/vo/character/${characterName.replaceAll('.', '')}/${lang.display}/`, `VO ${characterName} ${eventDisplay} ${zeroPad(nums[nkey], 2)}${speedSuffix}.ogg`, soundData.file_path)
				}
			}
		}
	}
}