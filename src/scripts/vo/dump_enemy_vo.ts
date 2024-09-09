import { execSync } from 'child_process';
import { program } from 'commander';
import { existsSync } from 'fs';
import { mkdir, rm, writeFile } from 'fs/promises';
import config from '../../../config.json' with { "type": "json" };
import { sanitizeString, zeroPad } from '../../Shared.js';
import { Enemy } from '../../Stage.js';
import { textMap } from '../../TextMap.js';
import { getFile, getFileSafe } from '../../files/GameFile.js';
import { files, langs } from './util.js';

const loadFrom = config.asset_roots.TXTP
// const VO_MAP: Record<string, SoundData[]> = JSON.parse((await readFile('./output/VO_Map.json')).toString())

program
	.option('--file [file]')
	.option('--id <id>')
	.option('--name [name]')
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
	// Skill05: 'Frigid Waterfall',
	// Skill06: 'Tit for Tat',
	// Skill12: 'Besiege'
	// Skill05: 'Team Building',
	// Skill08: 'Havoc'
	// Skill09: 'Aethereal Dreamflux',
	// Skill04: 'Mara-Summon'
	// Skill04: 'Rite of Subduing Prana'
}

// const AS_LIST = [
// 	'Defeated',
// 	'Hit by Light Attack',
// 	'Hit by Heavy Attack',
// 	'Weakness Broken',
// 	'Grazioso',
// 	'Weakness Broken (Phase 3)',
// 	'Hit by Light Attack (Phase 3)',
// 	'Hit While Weakness Broken'
// ]

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
]

const monster = Enemy.fromId(opts.id)
const fileChoice = opts.file ?? monster.config_path.replace(/.+\//, '').replace('_RLElite', '').replace('_RL', '').replace('_ConfigBoss', '_Audio_AnimEvent').replace('_Config', '_Audio_AnimEvent')

const animEvents = (await getFile<SoundEventData>(`Config/ConfigAnimEvents/Monster/Audio/${fileChoice.endsWith('.json') ? fileChoice : (fileChoice + '.json')}`)).AnimatorStateEvents
const animEvents2 = (await getFileSafe<SoundEventData>(`Config/ConfigAnimEvents/NPCMonster/Audio/${fileChoice.endsWith('.json') ? fileChoice : (fileChoice + '.json')}`))?.AnimatorStateEvents

if (animEvents2) {
	animEvents.unshift(...animEvents2)
}

const folderName = sanitizeString(opts.name || monster.name)

const VO_TABLE = [
	'{{VO/Enemy',
	`|enemy                   = ${folderName}`,
]
let currentIndex = 1

// const incs = {}
const exported = new Set<string>()

function getFilesByPrefix(prefix: string) {
	return Object.entries(files).filter(file => file[0].startsWith(prefix)).map(([file, file_path]) => {
		const lang = file.match(/{l=([\w\-]+)}/i)?.[1] ?? 'sfx'
		const num = parseInt(file.match(/{r(\d)}/i)?.[1] ?? '') || 1
		
		const speed_state_hash = file.match(/\(State_Battle_Speed=(\d+)\)/)?.[1]
		
		let speed_state: number | undefined = undefined
		if (speed_state_hash == 'Double_Speed') speed_state = 2
		else if (speed_state_hash == 'Normal_Speed') speed_state = 1
		else if (speed_state_hash == 'State_Battle_Auto') speed_state = 4
		
		return { lang, num, speed_state, file, file_path }
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
	// if (AS_LIST.includes(stateName)) {
	// 	pendingEntries.push(
	// 		`|vo_${zeroPad(currentIndex, 2)}_01_file           = `
	// 	)
	// }
	let entryIndex = 1
	let addPending = false
	
	for (const animEvent of animState.EventList) {
		if (animEvent.SoundName.startsWith('Ev_sfx')) continue
		
		for (const soundData of getFilesByPrefix(animEvent.SoundName)) {
			if (exported.has(soundData.file) || soundData.lang == 'sfx') continue
			// if (soundData.speed_state == 2) inc--
			let outFileSuffix = `${stateName} ${soundData.num}${soundData.speed_state ? ` ${soundData.speed_state}x` : ''} (1.5)`

			const lang = langs[soundData.lang]
			
			while (existsSync(`./output/file/vo/${folderName}/${lang.display}/VO ${lang.file}${folderName} - ${outFileSuffix}.ogg`)) {
				soundData.num++
				outFileSuffix = `${stateName} ${soundData.num}${soundData.speed_state ? ` ${soundData.speed_state}x` : ''}`
			}
			
			const notes: string[] = []
			
			if (soundData.speed_state && soundData.speed_state != 1) {
				notes.push(`${soundData.speed_state}&times; speed`)
				// continue
			}
			
			// const phase = animState.AnimatorStateName.match(/_P(\d+)(?:_|$)/i)?.[1]
			// if (phase) {
			// 	notes.push(phaseNames[phase] ?? `Phase ${phase}`)
			// }
			
			const txPrefix = notes.length > 0 ? `''(${notes.join(', ')})'' ` : ''
			
			if (soundData.lang == 'en') {
				pendingEntries.push(
					`|vo_${zeroPad(currentIndex, 2)}_${zeroPad(entryIndex, 2)}_file           = VO {lang}{name} - ${outFileSuffix}.ogg`,
					`|vo_${zeroPad(currentIndex, 2)}_${zeroPad(entryIndex, 2)}_tx_en          = ${txPrefix}{{tx}}`,
					`|vo_${zeroPad(currentIndex, 2)}_${zeroPad(entryIndex, 2)}_tx_zh          = ${txPrefix}{{tx}}`,
					`|vo_${zeroPad(currentIndex, 2)}_${zeroPad(entryIndex, 2)}_tx_ja          = ${txPrefix}{{tx}}`,
					`|vo_${zeroPad(currentIndex, 2)}_${zeroPad(entryIndex, 2)}_tx_ko          = ${txPrefix}{{tx}}`,
					''
				)
			}
			// console.log(soundData.lang, lang)
			
			var num = soundData.num
			
			const outDir = `./output/file/vo/${folderName}/${lang.display}`
			let outFile = `VO ${lang.file}${folderName} - ${outFileSuffix}.ogg`
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
	
	// incs[stateName] = inc
	if (addPending) {
		VO_TABLE.push(...pendingEntries)
		currentIndex++
	}
}

VO_TABLE.push('}}')

await writeFile(`./output/file/vo/${folderName}/vo_table.wikitext`, VO_TABLE.join('\n'))
await writeFile(`./output/file/vo/${folderName}/wikiup.txt`, `==Summary==\n{{File\n|categories = ${opts.name || monster.name} <%-2> Voice-Overs\n}}\n\n==Licensing==\n{{Fairuse}}`)