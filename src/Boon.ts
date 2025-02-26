import { RogueMazeBuff } from './Blessing.js'
import { DayCycle, InternalTitanBless, InternalTitanType } from './files/Boon.js'
import { getExcelFile } from './files/GameFile.js'
import { textMap } from './TextMap.js'

export const RogueTournTitanBless = await getExcelFile<InternalTitanBless>('RogueTournTitanBless.json', 'TitanBlessID')
export const RogueTournTitanType = await getExcelFile<InternalTitanType>('RogueTournTitanType.json', 'RogueTitanType')

const CYCLE_DISPLAY = {
	Day: textMap.getText(10790181242576353338n),
	Night: textMap.getText(12174553876493060569n),
} as const

export class GoldenBloodBoon {
	id: number
	buff_id: number
	name: string
	name_hash: number | bigint

	level: number
	cycle: DayCycle
	cycle_name: string
	
	description: string
	
	titan_id: string
	titan_title: string
	titan_heir: string
	
	card_fg: string
	icon: string
	
	constructor(data: InternalTitanBless) {
		const buffData = RogueMazeBuff.find(buff => buff.ID == data.MazeBuffID)!
		const titan = RogueTournTitanType[data.TitanType]
		
		this.id = data.TitanBlessID
		this.buff_id = data.MazeBuffID
		this.level = data.TitanBlessLevel
		
		this.name = textMap.getText(buffData.BuffName)
		this.name_hash = buffData.BuffName.Hash
		this.description = textMap.getText(buffData.BuffDesc, buffData.ParamList)
		
		this.titan_id = data.TitanType
		this.titan_title = textMap.getText(titan.TitanTitle)
		this.titan_heir = textMap.getText(titan.CharacterName)
		
		this.cycle = titan.RogueTitanCategory
		this.cycle_name = CYCLE_DISPLAY[titan.RogueTitanCategory]
		
		this.card_fg = titan.RogueTitanCardIcon
		this.icon = titan.RogueTitanAvatarRoundIconMid
	}
	
	static loadAll() {
		return Object.values(RogueTournTitanBless).map(data => new this(data))
	}
	
	static fromId(id: number) {
		if (!RogueTournTitanBless[id]) {
			throw new Error(`Unknown Golden Blood's Boon ID: ${id}`)
		}
		return new this(RogueTournTitanBless[id])
	}
}