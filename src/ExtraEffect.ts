import { InternalExtraEffect } from './files/Equation.js'
import { getExcelFile } from './files/GameFile.js'
import { textMap } from './TextMap.js'

export const EE_ALIASES: Record<string, string[]> = {
	'Action Delayed': ['delayed'],
	'Action Advanced': ['advanced', 'advanced forward', 'advance forward', 'action advances', 'advances its action'],
	'Extra Turn': ['extra action'],
	'Follow-up ATK': ['follow-up attack', 'follow-up', 'follow-up attacks', 'follow-up atks'],
	'Additional DMG': ['additional damage', 'additional', 'additional ice dmg'],
	'Weakness Break State': ['weakness broken', 'weakness break', 'weakness broken state', 'weakness-broken'],
	'Downed State': ['downed', 'knocked down'],
	'Buff': ['buffs', 'buff(s)', 'buffed'],
	'Debuff': ['debuffs', 'debuff(s)', 'debuffed'],
	'DoT Debuff': ['dot'],
	'distribute': ['distributed'],
	'Grit': ['fighting spirit'],
	'Spores': ['spore', 'spore(s)', "spore's"],
	'AoE ATK': ['aoe', 'aoe attack'],
	'Overflow DMG': ['overflow', 'overflows', 'overflow damage'],
	'Summon Memosprite': ['summons the memosprite', 'summons memosprite'],
	'Even Distribution': ['distributed evenly', 'evenly distributed'],
	'Crowd Control debuff': ['crowd control debuffs'],
	'Counter': ['counters', 'counter(s)'],
	'Enemy units that can enter Moon Rage': ['friendly units who can enter the moon rage effect', 'friendly units who can enter the moon rage state'],
	
	'Soul Chrysalis/Butterfly Soul': ['butterfly soul', 'soul chrysalis'],
	
	'Delay Effects': ['delay effect', 'delay effect(s)'],

	// inconsistent
	'Joint Attack': ['joint atk'],
	'Joint ATK': ['joint attack'],
}

export const ExtraEffectConfig = await getExcelFile<InternalExtraEffect>('ExtraEffectConfig.json', 'ExtraEffectID')

function resolvePriority(name: string, id0: number) {
	let id1 = EE_PRIORITY[name]
	if (!id1) {
		EE_PRIORITY[name] = id0
		return
	}

	const isEvent0 = id0.toString().startsWith('70')
	const isEvent1 = id1.toString().startsWith('70')
	if (isEvent1 && !isEvent0) {
		EE_PRIORITY[name] = id0
	} else if (isEvent0 && !isEvent1) {
		EE_PRIORITY[name] = id1
	} else {
		// console.warn(`Collission between ${id0} and ${id1} for "${name}"`)
		EE_PRIORITY[name] = id0 < id1 ? id0 : id1
	}
}

export const EE_PRIORITY: Record<string, number> = {}
for (const effect of Object.values(ExtraEffectConfig)) {
	const effectName = textMap.getText(effect.ExtraEffectName)
	if (!effectName) continue

	resolvePriority(effectName.toLowerCase(), effect.ExtraEffectID)

	if (EE_ALIASES[effectName]) {
		for (const alias of EE_ALIASES[effectName]) {
			resolvePriority(alias, effect.ExtraEffectID)
		}
	}
}

export function replaceUnderlinedEE(str: string, activeEE: number[]) {
	return str
		.replaceAll(/<u>(["\.\s]*)(.+?)(["\.\s]*)<\/u>/gi, (fullMatch: string, before: string, eeName: string, after: string) => {
			let lowerName = eeName.toLowerCase()
				.replaceAll(/[\.\"]/gi, '')
			
			if (lowerName.endsWith("'s")) {
				after = "'s" + after
				lowerName = lowerName.replace(/'s$/i, '')
				eeName = eeName.replace(/'s(?=\b)/i, '')
			}
			
			for (const extraEffectId of activeEE) {
				const extraEffect = ExtraEffectConfig[extraEffectId]
				const checkEEName = textMap.getText(extraEffect.ExtraEffectName).replaceAll(/[\.\"]/gi, '')
				if (lowerName == checkEEName.toLowerCase() || (EE_ALIASES[checkEEName] && EE_ALIASES[checkEEName].includes(lowerName))) {
					if (EE_PRIORITY[lowerName] != extraEffectId || extraEffectId.toString().startsWith('6') || extraEffectId.toString().startsWith('7')) {
						return `${before}{{Extra Effect|${eeName}|${extraEffectId}}}${after}`
					} else {
						return `${before}{{Extra Effect|${eeName}}}${after}`
					}
				}
			}
			
			// special cases where arbitrary nouns can be included in the underline
			if (activeEE.includes(10000001) && lowerName.includes('advance')) {
				return `${before}{{Extra Effect|${eeName}|Action Advanced}}${after}`
			} else if (activeEE.includes(10000002) && lowerName.includes('delay')) {
				return `${before}{{Extra Effect|${eeName}|Action Delayed}}${after}`
			}
			
			console.warn(`Could not find matching Extra Effect for "${eeName}" out of ${activeEE.length} active: ${activeEE.map(ee => textMap.getText(ExtraEffectConfig[ee].ExtraEffectName)).join('; ')}`)
			
			return fullMatch
		})
}