import { execSync } from 'child_process';
import { program } from 'commander';
import { existsSync } from 'fs';
import { mkdir, rm, writeFile } from 'fs/promises';
import config from '../../../config.json' with { "type": "json" };
import { sanitizeString, zeroPad } from '../../Shared.js';
import { Enemy } from '../../Stage.js';
import { textMap } from '../../TextMap.js';
import { getFile } from '../../files/GameFile.js';
import { teardown } from '../../util/JSONParser.js';
import { files, langs } from './util.js';

const loadFrom = config.asset_roots.TXTP
// const VO_MAP: Record<string, SoundData[]> = JSON.parse((await readFile('./output/VO_Map.json')).toString())

program
	// .option('--file [file]')
	.option('--id <id>')
	.option('--name [name]')
	.option('--only-normal-speed') // sometimes they'll make two identical files for both speeds lol
	.parse()

const opts = program.opts()

interface AnimSoundEvent {
	$type: string
	SoundName: string
	StopOnAnimStateExit?: string
}

interface AnimSoundEvents {
	AnimatorStateName: string
	NormalizedTime: number
	EventList: AnimSoundEvent[]
}

interface SoundEventData {
	AnimatorStateEvents: AnimSoundEvents[]
}

const STATE_MAP = {
	Alert: 'Alerted',
	Attack: 'Attacking the Player',
	Detect: 'Spotting the Player',
	Die: 'Defeated',
	Appear: 'Entering Battle',
	Appear02: 'Entering Battle',
	ChangePhaseStart: 'Entering Phase 2',
	ChangePhaseEnd: 'Entered Phase 2',
	ChangePhaseStart02: 'Entered Phase 3',
	ChangePhaseEnd02: 'Entered Phase 3',
	ChangePhase02: 'Entered Phase 3',
	ChangePhase_End: 'Entered Phase 2',
	Hit: 'Hit by Light Attack',
	Hit_H: 'Hit by Heavy Attack',
	Hit_H_Break: 'Weakness Broken',
	Hit_H_Break_P3: 'Weakness Broken',
	Hit_P3: 'Hit by Light Attack',
	Stagger: 'Hit While Weakness Broken',
	Revive: 'Entering Phase 2',
	Revive02: 'Entering Phase 3',
	SkillPerform01: 'Entering Battle',
	
	// TEMPORARY //
	// SkillRage: 'Warhead Moon Rage',
	// Skill04_02: 'Breathing Ether',
	// Skill05_02: 'Firmament Divider',
	// Skill06_02: 'Realm Exterminator',
	// Skill05: 'Frigid Waterfall',
	// Skill06: 'Tit for Tat',
	// Skill12: 'Besiege'
	// Skill05: 'Team Building',
	// Skill08: 'Havoc'
	// Skill09: 'Aethereal Dreamflux',
	// Skill04: 'Mara-Summon'
	// Skill04: 'Rite of Subduing Prana'
	// Skill01: 'Brainteaser- Basic ATK',
	// Skill02: 'Brainteaser- Skill',
	// Skill03: 'Brainteaser- Ultimate',
	// Skill04: 'Looping Explanation',
	// Skill07: 'Fury Falls, and All Bows to Strife'
	Skill05_Wait: 'But Suffering is Essential',
}

const ALL_AS_LIST = false
const AS_LIST = [
	'Defeated',
	'Hit by Light Attack',
	'Hit by Heavy Attack',
	'Weakness Broken',
	'Grazioso',
	'Weakness Broken (Phase 3)',
	'Hit by Light Attack (Phase 3)',
	'Hit While Weakness Broken'
]

const SKIP: string[] = [
	// 'Hit by Light Attack',
	// 'Hit by Heavy Attack',
	// 'Weakness Broken',
	// 'Disciplined',
	// 'Grazioso',
	// 'Weakness Broken (Phase 3)',
	// 'Hit by Light Attack (Phase 3)',
	// 'Hit While Weakness Broken',
	// 'Cascading Laceration',
	// 'Rapturous Wind',
	// 'Fleeting Gilded Spikes',
	// 'Hit2',
	// 'Thunder-Shock',
	// 'Skill06',
	// 'Skill08'
	// 'Stagger',
	// 'Stagger_P3_1',
	// 'Weakness Broken (Phase 3)',
	// 'Hit by Light Attack (Phase 3)'
	'Stun_Occur', // seems to be unused?
	// 'Skill03'
]

const SWAP_SPEED = {
	'Warhead Moon Rage': 3,
	'Barrenness of Earth Gouged': 3,
}
const IGNORE_SPEED = {
	'Wreathed in Storm': true,
	'Gunblade- Swordfang': true,
	'Great Ax- Irontalon': true,
	'Passing Tempest': true,
	"Heaven's Binds": true,
}

const monster = Enemy.fromId(opts.id)
const battleAudioPath = (await getFile<any>(monster.config_path))?.AnimEventConfigList?.find(path => path.includes('/Audio/')) as (string | undefined)

if (!battleAudioPath) {
	throw new Error(`Could not find audio file path for ${monster.name}`)
}

const animEvents = (await getFile<SoundEventData>(battleAudioPath)).AnimatorStateEvents

const npcMonsters = (await getFile<any>('ExcelOutput/NPCMonsterData.json')).filter(nmons => monster.npc_monster_ids.includes(nmons.ID))
// console.log(npcMonsters)
for (const npcMonster of npcMonsters) {
	const npcConfig = await getFile<any>(npcMonster.JsonPath)
	const audioPath = npcConfig.AnimEventConfigList.find(path => path.includes('/Audio/'))
	if (!audioPath) continue
	const audioData = await getFile<SoundEventData>(audioPath)
	animEvents.unshift(...audioData.AnimatorStateEvents)
}

const folderName = sanitizeString(opts.name || monster.name) || 'unnamed'

const VO_TABLE = [
	'{{VO/Enemy',
	`|enemy                   = ${folderName}`,
]
let hasVoice = false
let currentIndex = 1

// const incs = {}
const exported = new Set<string>()

function getFilesByPrefix(prefix: string) {
	return Object.entries(files).filter(file => file[0].startsWith(prefix)).map(([file, file_path]) => {
		const lang = file.match(/{l=([\w\-]+)}/i)?.[1] ?? 'sfx'
		const num = parseInt(file.match(/{r(\d)}/i)?.[1] ?? '') || 1
		
		const speed_state_hash = file.match(/\(State_Battle_Speed=(\w+)\)/)?.[1]
		console.log(file)
		
		const phase = file.match(/\(State_Battle_Monster_W2_Feixiao_00=(\w+)\)/)?.[1]
		
		const duplicate = file.includes('{d}')
		
		let speed_state: number | undefined = undefined
		if (speed_state_hash == 'Double_Speed') speed_state = 2
		else if (speed_state_hash == 'Normal_Speed') speed_state = 1
		else if (speed_state_hash == 'State_Battle_Auto') speed_state = 4
		
		return { lang, num, speed_state, file, file_path, phase, duplicate }
	})
}

if (existsSync(`./output/file/vo/${folderName}`)) {
	await rm(`./output/file/vo/${folderName}`, { recursive: true })
}

for (const animState of animEvents) {
	let stateName = 
		STATE_MAP[animState.AnimatorStateName] 
		|| STATE_MAP[animState.AnimatorStateName.replace(/_.+/, '')]
		|| (
			animState.AnimatorStateName.startsWith('Skill')
			&& sanitizeString(textMap.getText((await monster.getSkill(animState.AnimatorStateName))?.SkillName))
		) 
		|| animState.AnimatorStateName
		
	if (SKIP.includes(stateName)) continue
		
	// let inc = incs[stateName] ?? 1
	
	const pendingEntries = [
		'',
		`|vo_${zeroPad(currentIndex, 2)}_00_title          = ${stateName}`,
		''
	]
	const list: string[] = []
	const list2x: string[] = []
	let entryIndex = 1
	let addPending = false
	
	for (const animEvent of animState.EventList) {
		if (!animEvent.SoundName || animEvent.SoundName.startsWith('Ev_sfx')) continue
		
		for (const soundData of getFilesByPrefix(animEvent.SoundName)) {
			if (exported.has(soundData.file) /*|| soundData.lang == 'sfx'*/ || soundData.duplicate || (soundData.phase && soundData.phase != 'None')) continue

			const notes: string[] = []

			if (soundData.speed_state && soundData.speed_state != 1) {
				notes.push(`${soundData.speed_state}&times; speed`)
				if (SWAP_SPEED[stateName]) {
					soundData.num = SWAP_SPEED[stateName] - soundData.num
				}
				if (opts.onlyNormalSpeed || IGNORE_SPEED[stateName]) continue
			}

			// if (soundData.phase) {
			// 	notes.push(soundData.phase)
			// 	// if (IGNORE_PHASE[stateName] && soundData.phase != 'Phase1') continue
			// }
			
			let outFileSuffix = `${stateName} ${soundData.num}${(soundData.speed_state && !opts.onlyNormalSpeed && !IGNORE_SPEED[stateName]) ? ` ${soundData.speed_state}x` : ''}`

			const lang = langs[soundData.lang]
			
			while (existsSync(`./output/file/vo/${folderName}/${lang.display}/VO ${lang.file}${folderName} - ${outFileSuffix}.ogg`)) {
				soundData.num++
				outFileSuffix = `${stateName} ${soundData.num}${(soundData.speed_state && !opts.onlyNormalSpeed) ? ` ${soundData.speed_state}x` : ''}`
			}
			
			const txPrefix = notes.length > 0 ? `''(${notes.join(', ')})'' ` : ''
			
			if (soundData.lang == 'en' || soundData.lang == 'sfx') {
				if (ALL_AS_LIST || AS_LIST.includes(stateName)) {
					(soundData.speed_state == 2 ? list2x : list).push(`VO ${soundData.lang == 'sfx' ? '' : '{lang}'}{name} - ${outFileSuffix}.ogg`)
				} else {
					pendingEntries.push(
						`|vo_${zeroPad(currentIndex, 2)}_${zeroPad(entryIndex, 2)}_file           = VO {lang}{name} - ${outFileSuffix}.ogg`,
						`|vo_${zeroPad(currentIndex, 2)}_${zeroPad(entryIndex, 2)}_tx_en          = ${txPrefix}{{tx}}`,
						`|vo_${zeroPad(currentIndex, 2)}_${zeroPad(entryIndex, 2)}_tx_zh          = ${txPrefix}{{tx}}`,
						`|vo_${zeroPad(currentIndex, 2)}_${zeroPad(entryIndex, 2)}_tx_ja          = ${txPrefix}{{tx}}`,
						`|vo_${zeroPad(currentIndex, 2)}_${zeroPad(entryIndex, 2)}_tx_ko          = ${txPrefix}{{tx}}`,
						''
					)
				}
			}
			// console.log(soundData.lang, lang)
			
			var num = soundData.num
			
			const outDir = `./output/file/vo/${folderName}/${lang.display}`
			let outFile = `VO ${lang.file}${folderName} - ${outFileSuffix}.ogg`
			hasVoice = true
			await mkdir(outDir, { recursive: true })
			try {
				execSync(`"${config.vgmstream_path}" -o "${outFile.replace(/\.ogg$/, '.wav')}" "${soundData.file_path}"`, {
					cwd: `./output/file/vo/${folderName}/${lang.display}`
				})
				execSync(`ffmpeg -i "${outFile.replace(/\.ogg$/, '.wav')}" "${outFile}" -hide_banner -loglevel error`, {
					cwd: `./output/file/vo/${folderName}/${lang.display}`
				})
			} catch(err) {
				if (err && typeof err == 'object' && 'stderr' in err) {
					console.error(`Error while dumping ${outFile}: ${err.stderr!.toString()}`)
				}
			}
			if (existsSync(`./output/file/vo/${folderName}/${lang.display}/${outFile.replace(/\.ogg$/, '.wav')}`)) {
				await rm(`./output/file/vo/${folderName}/${lang.display}/${outFile.replace(/\.ogg$/, '.wav')}`)
			}
			
			exported.add(soundData.file)
			addPending = true
			// inc++
			entryIndex++
		}
	}
	if (ALL_AS_LIST || AS_LIST.includes(stateName)) {
		pendingEntries.push(
			`|vo_${zeroPad(currentIndex, 2)}_01_file           = ${list.join('; ')}`,
			`|vo_${zeroPad(currentIndex, 2)}_01_tx_en          = &nbsp;`,
			`|vo_${zeroPad(currentIndex, 2)}_01_tx_zh          = &nbsp;`,
			`|vo_${zeroPad(currentIndex, 2)}_01_tx_ja          = &nbsp;`,
			`|vo_${zeroPad(currentIndex, 2)}_01_tx_ko          = &nbsp;`,
			''
		)
		if (list2x.length > 0) {
			pendingEntries.push(
				`|vo_${zeroPad(currentIndex, 2)}_02_file           = ${list2x.join('; ')}`,
				`|vo_${zeroPad(currentIndex, 2)}_02_tx_en          = ''(2&times; speed)''`,
				`|vo_${zeroPad(currentIndex, 2)}_02_tx_zh          = ''(2&times; speed)''`,
				`|vo_${zeroPad(currentIndex, 2)}_02_tx_ja          = ''(2&times; speed)''`,
				`|vo_${zeroPad(currentIndex, 2)}_02_tx_ko          = ''(2&times; speed)''`,
				''
			)
		}
	}
	
	// incs[stateName] = inc
	if (addPending) {
		VO_TABLE.push(...pendingEntries)
		currentIndex++
	}
}

VO_TABLE.push('}}')

if (!hasVoice) {
	console.warn(`No valid voice-overs found for ${monster.name}`)
	process.exit()
}

await writeFile(`./output/file/vo/${folderName}/vo_table.wikitext`, VO_TABLE.join('\n'))
await writeFile(`./output/file/vo/${folderName}/wikiup.txt`, `==Summary==\n{{File\n|categories = ${opts.name || monster.name} <%-2> Voice-Overs\n}}\n\n==Licensing==\n{{Fairuse}}`)

teardown()