import { readFileSync } from 'fs'
import config from '../config.json' with { "type": "json" }
import type { Dictionary } from './Shared.js'
import { TextMap } from './TextMap.js'
import type { InternalDiceBranch, InternalDiceSurface } from './files/AudienceDice.js'

const OBTAIN_VIA_MAP = {
	100: '[[Simulated Universe/Trailblaze Secret#Simulated_Universe:_Gold_and_Gears|Trailblaze Secrets]]',
	101: 'Unlock [[#Trotter Extrapolation|Trotter Extrapolation]]',
	102: 'Unlock [[#Walker Symbiosis|Walker Symbiosis]]',
	103: 'Unlock [[#Ultra-Remote Beacon|Ultra-Remote Beacon]]',
	201: 'Unlock [[#Occurrence Extrapolation|Occurrence Extrapolation]]',
	202: 'Unlock [[#Combat Extrapolation|Combat Extrapolation]]',
	203: 'Unlock [[#Pursuit|Pursuit]]',
	301: 'Unlock [[#Countdown|Countdown]]',
	302: 'Unlock [[#Amber Barrier|Amber Barrier]]',
	303: 'Unlock [[#Investment Sale|Investment Sale]]',
	401: 'Unlock [[#Company Time|Company Time]]',
	402: 'Unlock [[#Curio Extrapolation|Curio Extrapolation]]',
	403: 'Unlock [[#Data Inflation|Data Inflation]]'
}

export class DiceSurface {
	static data: Dictionary<InternalDiceSurface> = JSON.parse(readFileSync(`./versions/${config.target_version}/RogueNousDiceSurface.json`).toString())
	
	name: string
	description: string
	id: number
	rarity: number
	icon: string
	sort: number
	obtained_via: string
	
	constructor(id: number) {
		const data = DiceSurface.data[id]
		if (!data) {
			throw new TypeError(`Unknown DiceSurface ID ${id}`)
		}
		
		this.id = data.SurfaceID
		this.name = TextMap.default.getText(data.SurfaceName)
		this.description = TextMap.default.getText(data.SurfaceDesc, data.DescParam.map(v => v.Value))
		this.rarity = data.Rarity
		this.icon = data.Icon
		this.sort = data.Sort
		this.obtained_via = OBTAIN_VIA_MAP[data.UnlockDisplayID]
		
		DiceSurface.map.set(this.id, this)
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

export class AudienceDice {
	static data: Dictionary<InternalDiceBranch> = JSON.parse(readFileSync(`./versions/${config.target_version}/RogueNousDiceBranch.json`).toString())
	
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
		const data = AudienceDice.data[id]
		
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