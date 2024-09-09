import { Event } from './Event.js'
import type { Dictionary } from './Shared.js'
import { HashReference, TextMap } from './TextMap.js'
import type { InternalDiceBranch, InternalDiceSurface, InternalMiscDisplay } from './files/AudienceDice.js'
import { getFile } from './files/GameFile.js'

interface PartialSecret {
	MainStoryName?: HashReference
	TalkNameID: number
	RogueNPCID: number
	QuestID: number
}

interface PartialQuestData {
	RewardID: number
	FinishWayID: number
}

const obtainViaMap: Dictionary<InternalMiscDisplay> = await getFile('ExcelOutput/RogueNousMiscDisplay.json')

const tbSecrets: Dictionary<PartialSecret> = await getFile('ExcelOutput/RogueNousSubStory.json')
const aeonSecrets: Dictionary<PartialSecret> = await getFile('ExcelOutput/RogueNousMainStory.json')

const surfaceData: Dictionary<InternalDiceSurface> = await getFile('ExcelOutput/RogueNousDiceSurface.json')
const questData: Dictionary<PartialQuestData> = await getFile('ExcelOutput/QuestData.json')
const rewardData: Dictionary<PartialQuestData> = await getFile('ExcelOutput/RewardData.json')

export class DiceSurface {
	static data: Dictionary<InternalDiceSurface> = surfaceData
	static questData: Dictionary<PartialQuestData> = questData
	static rewardData: Dictionary<PartialQuestData> = rewardData
	static secrets: Dictionary<PartialSecret> = Object.assign(tbSecrets, aeonSecrets)
	
	name: string
	description: string
	id: number
	rarity: number
	icon: string
	sort: number
	item_id: number
	obtained_via: string
	
	constructor(id: number) {
		const data = Object.values(DiceSurface.data).find(surf => surf.SurfaceID == id)
		if (!data) {
			throw new TypeError(`Unknown DiceSurface ID ${id}`)
		}
		
		this.id = data.SurfaceID
		this.name = TextMap.default.getText(data.SurfaceName)
		this.description = TextMap.default.getText(data.SurfaceDesc, data.DescParam.map(v => v.Value))
		this.rarity = data.Rarity
		this.icon = data.Icon
		this.sort = data.Sort
		this.item_id = data.ItemID
		this.obtained_via = data.UnlockDisplayID == 100 ? this.findSourceSecret() : TextMap.default.getText(Object.values(obtainViaMap).find(via => via.DisplayID == data.UnlockDisplayID)?.DisplayContent)
		
		DiceSurface.map.set(this.id, this)
	}
	
	findSourceSecret() {
		for (const secret of Object.values(DiceSurface.secrets)) {
			const quest = Object.values(DiceSurface.questData).find(quest => quest.FinishWayID == secret.QuestID)!
			const reward = Object.values(DiceSurface.rewardData).find(reward => reward.RewardID == quest.RewardID)!
			if (Object.values(reward).includes(this.item_id)) {
				const name = TextMap.default.getText(secret.MainStoryName ?? Event.TALK_NAMES[secret.TalkNameID].Name)
				return `[[Simulated Universe/Secret#${name}|${name}]]`
			}
		}
		return `Unknown [[Simulated Universe/Secret|Secret]]`
	}
	
	static get(id: number) {
		return this.map.get(id) ?? new this(id)
	}
	
	static map = new Map<number, DiceSurface>()
	
	card(show_category: boolean = false) {
		return `{{Card|${this.name}|type=Dice Face${show_category ? '|show_caption=1' : ''}}}`
	}
	
	static loadAll() {
		Object.values(this.data).forEach(dat => new this(dat.SurfaceID))
	}
}

const diceData: Dictionary<InternalDiceBranch> = await getFile('ExcelOutput/RogueNousDiceBranch.json')

export class AudienceDice {
	static data: Dictionary<InternalDiceBranch> = diceData
	
	name: string
	initial_desc: string
	passive_desc: string
	id: number
	icon: string
	intro: string
	tag: number
	
	default_surface_ids: number[]
	recommended_surface_ids: number[]
	
	constructor(id: number) {
		const data = Object.values(AudienceDice.data).find(dice => dice.BranchID == id)!
		
		this.id = data.BranchID
		this.name = TextMap.default.getText(data.BranchName)
		this.icon = data.DiceIcon
		this.tag = data.BranchTag

		this.intro = TextMap.default.getText(data.BranchIntroduction)
		this.initial_desc = TextMap.default.getText(data.EffectDescParam1, data.ParamValue1.map(v=>v.Value))
		this.passive_desc = `${TextMap.default.getText(data.EffectDescParam2, data.ParamValue2.map(v=>v.Value))} (${TextMap.default.getText(data.EffectDescParam3, data.ParamValue3.map(v=>v.Value))})`
		
		this.default_surface_ids = [data.DefaultUltraSurface, ...data.DefaultCommonSurfaceList]
		this.recommended_surface_ids = data.RecommendSurfaceList
		
		AudienceDice.map.set(this.id, this)
	}
	
	get default_surfaces() {
		return this.default_surface_ids.map(id => DiceSurface.get(id))
	}

	get recommended_surfaces() {
		return this.recommended_surface_ids.map(id => DiceSurface.get(id))
	}
	
	static forTag(id: number) {
		const forTag: AudienceDice[] = []
		for (const dice of this.map.values()) {
			if (dice.tag == id) forTag.push(dice)
		}
		return forTag
	}

	static map = new Map<number, AudienceDice>()

	static loadAll() {
		Object.values(this.data).forEach(dat => new this(dat.BranchID))
	}
}