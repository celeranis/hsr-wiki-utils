import { textMap } from './TextMap.js'
import { InternalCurio, InternalCurioDisplay, InternalCurioEffectDisplay, InternalIndexCurio, InternalUNDCurio } from './files/Curio.js'
import { getExcelFile } from './files/GameFile.js'
import { getMentions } from './util/Mentions.js'
import { Template } from './util/Template.js'

function curio(name: string) {
	return `{{Item|${name}|20|type=Curio}}`
}

export class CurioGroup {
	// I couldn't find any definitions for these IDs in the game files.
	// If you find something, please let me know.
	// Until then, everything is hardcoded...
	static nameForId(id: number, plural?: boolean): string {
		const s = plural ? 's' : plural === false ? '' : '(s)'
		switch (id) {
			case 10001:
			case 10002:
			case 10010:
			case 12000:
			case 20002:
			case 21011:
			case 21012:
			case 22000:
			case 30002:
			case 30010:
				return `Normal Curio${s}`
			
			case 10003:
			case 20003:
			case 30003:
				return `Negative Curio${s}`
			
			case 10004:
			case 20004:
			case 30004:
			case 30012:
				return `Curio${s}`
			
			case 11042:
			case 20005:
				return `Error Code Curio${s}`
			
			case 10009:
			case 20009:
			case 30009:
				return `Negative Curio${s} of the cuckoo clock series`
			
			case 11012:
			case 21009:
			case 32060:
				return `Curio${s} of the Big Lotto series`
			
			case 11009:
			case 21002:
			case 31060:
				return `Curio&colon; ${curio('Angel-type I.O.U. Dispenser')}`
			
			case 11010:
			case 21003:
			case 31059:
				return `Negative Curio&colon; ${curio('Insect Web')}`
			
			case 11013:
			case 21010:
			case 32021:
				return `Curio&colon; ${curio('Cavity System Model')}`
			
			case 11015:
			case 21007:
			case 31122:
				return `Curio&colon; ${curio('The Pinkest Collision')}`
			
			case 11014:
			case 21006:
			case 31121:
				return `Curio&colon; ${curio('Thalan Toxi-Flame')}`
			
			case 11016:
			case 21008:
			case 32050:
				return `Curio${s}&colon; ${curio('The Pinkest Collision')} ${plural ? 'and' : 'or'} ${curio('Thalan Toxi-Flame')}`
			
			case 21004:
				return `Curio&colon; ${curio('Tonic of Efficacious Chaos')}`
			
			case 31004:
				return `Curio&colon; ${curio('Fruit of the Alien Tree')}`
			
			case 31005:
				return `Curio&colon; ${curio('Casket of Inaccuracy')}`
			
			case 31006:
				return `Curio&colon; ${curio('Ambergris Cheese')}`
			
			case 32030:
				return `Curios&colon; ${curio('Ambergris Cheese')}, ${curio('Casket of Inaccuracy')}, ${plural ? 'and' : 'or'} ${curio('Fruit of the Alien Tree')}`

			case 31208:
				return `Curio&colon; ${curio('Mysterious Magnetism')}`
			
			case 31209:
				return `Curio&colon; ${curio('"Organic Heart"')}`
			
			case 31207:
				return `Curio&colon; ${curio('King of Sponges')}`

			case 31205:
				return `Curio&colon; ${curio('Indecipherable Box')}`
				
			case 31206:
				return `Curio&colon; ${curio('Rotting Fruit of the Alien Tree')}`
			
			case 20008:
			case 30008:
				return `Damageable Curio${s}`
			
			case 32070:
				return `Curios&colon; ${curio('Gold Coin of Discord')} ${plural ? 'and' : 'or'} ${curio('Typical Genius Society Gossip')}`
		}
		
		return `Curio${s}&colon; {{tx}}<!--ID: ${id}-->`
	}
}

export const RogueMiracle = await getExcelFile<InternalCurio>('RogueMiracle.json', 'MiracleID')
export const RogueMiracleDisplay = await getExcelFile<InternalCurioDisplay>('RogueMiracleDisplay.json', 'MiracleDisplayID')
export const RogueHandbookMiracle = await getExcelFile<InternalIndexCurio>('RogueHandbookMiracle.json', 'MiracleHandbookID')
export const RogueMagicMiracle = await getExcelFile<InternalUNDCurio>('RogueMagicMiracle.json', 'MiracleID')
export const RogueMiracleEffectDisplay = await getExcelFile<InternalCurioEffectDisplay>('RogueMiracleEffectDisplay.json', 'MiracleEffectDisplayID')

export const RogueTournMiracle = await getExcelFile<InternalCurio>('RogueTournMiracle.json', 'MiracleID')
export const RogueTournMiracleDisplay = await getExcelFile<InternalCurioDisplay>('RogueTournMiracleDisplay.json', 'MiracleDisplayID')
export const RogueTournHandbookMiracle = await getExcelFile<InternalIndexCurio>('RogueTournHandbookMiracle.json', 'HandbookMiracleID')

const TYPE_MAP = {
	100: 'su',
	130: 'swarm',
	160: 'gng',
	260: 'und',
}

export class Curio {
	index_id: number
	name: string
	effect: string
	lore: string
	obtainable_in: string[]
	order: number
	is_indexable: boolean
	rarity?: string
	icon_path: string
	period?: 'Tourn1' | 'Tourn2'
	// unlock_list: Unlock[]
	
	constructor(public id: number, public is_du: boolean) {
		const curio = (is_du ? RogueTournMiracle : RogueMiracle)[id] ?? RogueMagicMiracle[id]
		const display = (is_du ? RogueTournMiracleDisplay : RogueMiracleDisplay)[curio.MiracleDisplayID!] ?? RogueTournMiracleDisplay[curio.MiracleDisplayID!] ?? RogueMiracleDisplay[curio.MiracleDisplayID!]
		const effectDisplay = RogueMiracleEffectDisplay[curio.MiracleEffectDisplayID]
		const index = (is_du ? RogueTournHandbookMiracle : RogueHandbookMiracle)[is_du ? curio.HandbookMiracleID! : curio.UnlockHandbookMiracleID!]
		
		this.period = curio.TournMode
		this.index_id = curio.HandbookMiracleID ?? curio.UnlockHandbookMiracleID!
		this.name = textMap.getText(display.MiracleName)
		this.effect = textMap.getText(effectDisplay.MiracleDesc, effectDisplay.DescParamList) || textMap.getText(display.MiracleDesc, display.DescParamList)
		this.lore = textMap.getText(display.MiracleBGDesc)
		this.obtainable_in = index?.MiracleTypeList?.map(id => TYPE_MAP[id]) || []
		this.order = index?.Order ?? 1000
		this.is_indexable = Boolean(curio.HandbookMiracleID ?? curio.UnlockHandbookMiracleID)
		this.icon_path = display.MiracleFigureIconPath
		if (index?.MiracleCategory) {
			this.rarity = index.MiracleCategory == 'Common' ? '1' : index.MiracleCategory == 'Rare' ? '2' : index.MiracleCategory == 'Legendary' ? '3' : index.MiracleCategory == 'Hex' ? 'Weighted' : 'Negative'
		}
		// this.unlock_list = curio.UnlockIDList.map(unlock => Unlock.fromUnlockId(unlock))
		console.groupEnd()
	}
	
	getNotes(): string[] {
		const notes: string[] = []
		if (!this.is_indexable) {
			notes.push(`* This Curio is not included in the Simulated Universe Index.`)
		}
		// for (const unlock of this.unlock_list) {
		// 	notes.push(`* This Curio is only obtainable ${unlock.desc.replace('Unlocked ', '')}`)
		// }
		return notes
	}
	
	entry(): string {
		const template = new Template('Curio Information')
			.addParam('name', this.name.replaceAll(/<\s*\/?\s*\w+\s*>/gi, ''))
			.addParam('price', '')
			.addParam('effect', this.effect)
			.addParam('story', ':' + this.lore)
			.addParam('notes', this.getNotes().join('\n'))
			.addParam('available', this.obtainable_in.join(','))
			.addParam('mentions', getMentions(this.lore).join('; '))
		
		if (template.getParam('name') != this.name) template.addParam('displayname', this.name)
		
		return template.block(12)
	}
	
	static loadAll(du: boolean) {
		const loaded: Curio[] = []
		for (const data of du ? Object.values(RogueTournMiracle) : [...Object.values(RogueMiracle), ...Object.values(RogueMagicMiracle)]) {
			if (!data.MiracleDisplayID) continue // idk?
			loaded.push(new this(data.MiracleID, du))
		}
		return loaded
	}
}