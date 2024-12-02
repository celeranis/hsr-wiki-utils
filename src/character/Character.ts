import { AvatarData } from '../files/Character.js'
import { getExcelFile } from '../files/GameFile.js'
import { AttackType } from '../Shared.js'
import { HashReference, textMap } from '../TextMap.js'

export const AvatarConfig = await getExcelFile<AvatarData>('AvatarConfig.json', 'AvatarID')

export class Character {
	id: number
	adventure_id?: number
	
	name: string
	name_hash: HashReference
	full_name?: string
	
	vo_tag: string
	rarity: 4 | 5
	json_path: string
	
	combat_type: AttackType
	combat_path: string
	max_energy: number
	
	ascension_group: number
	eidolon_ids: number[]
	skill_ids: number[]
	
	released: boolean
	
	icon_path: string
	round_icon_path: string
	mini_icon_path: string
	warp_results_icon_path: string
	action_icon_path: string
	team_icon_path: string
	splash_fg_path: string
	splash_bg_path: string
	splash_full_path: string
	
	constructor(data: AvatarData) {
		this.id = data.AvatarID
		this.adventure_id = data.AdventurePlayerID
		
		this.name = textMap.getText(data.AvatarName)
		this.name_hash = data.AvatarName
		this.full_name = textMap.getText(data.AvatarFullName) || undefined
		
		this.vo_tag = data.AvatarVOTag
		this.rarity = data.Rarity == 'CombatPowerAvatarRarityType4' ? 4 : 5
		this.json_path = data.JsonPath
		
		this.combat_type = data.DamageType
		this.combat_path = data.AvatarBaseType
		this.max_energy = data.SPNeed?.Value || 0
		
		this.ascension_group = data.ExpGroup
		this.eidolon_ids = data.RankIDList
		this.skill_ids = data.SkillList
		
		this.released = data.Release || false
		
		this.icon_path = data.DefaultAvatarHeadIconPath
		this.round_icon_path = data.AvatarSideIconPath
		this.mini_icon_path = data.AvatarMiniIconPath
		this.warp_results_icon_path = data.AvatarGachaResultImgPath
		this.action_icon_path = data.ActionAvatarHeadIconPath
		this.team_icon_path = data.SideAvatarHeadIconPath
		this.splash_fg_path = data.AvatarCutinImgPath
		this.splash_bg_path = data.AvatarCutinBgImgPath
		this.splash_full_path = data.AvatarCutinFrontImgPath
	}
	
	static fromId(id: number) {
		const data = AvatarConfig[id]
		if (!data) return undefined
		return new Character(data)
	}
}