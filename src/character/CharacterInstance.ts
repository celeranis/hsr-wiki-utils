import { AvatarData, AvatarPromotionData } from '../files/Character.js'
import { getFile } from '../files/GameFile.js'
import { ItemReference } from '../files/Item.js'
import { ItemList } from '../Item.js'
import { Character } from './Character.js'

export const AvatarPromotionConfig = await getFile<AvatarPromotionData>('ExcelOutput/AvatarPromotionConfig.json')

export class CharacterInstance extends Character {
	ascension_level: number
	max_level: number

	private _atk_base: number
	private _atk_add: number
	private _def_base: number
	private _def_add: number
	private _hp_base: number
	private _hp_add: number
	private _spd_base: number
	private _cr_base: number
	private _cd_base: number
	private _aggro_base: number

	costs_data: ItemReference[]
	async getCosts(): Promise<ItemList> {
		const { ItemList, Item } = await import('../Item.js')
		await Item.loadFrom('main', 'eidolons')
		return new ItemList(this.costs_data)
	}
	
	constructor(avatar_data: AvatarData, data: AvatarPromotionData, public level: number) {
		super(avatar_data)
		this.ascension_level = data.Promotion || 0
		this.max_level = data.MaxLevel
		
		this._atk_base = data.AttackBase?.Value || 0
		this._atk_add = data.AttackAdd?.Value || 0
		this._def_base = data.DefenceBase?.Value || 0
		this._def_add = data.DefenceAdd?.Value || 0
		this._hp_base = data.HPBase?.Value || 0
		this._hp_add = data.HPAdd?.Value || 0
		this._spd_base = data.SpeedBase?.Value || 0
		this._cr_base = data.CriticalChance?.Value || 0
		this._cd_base = data.CriticalDamage?.Value || 0
		this._aggro_base = data.BaseAggro?.Value || 0
		
		this.costs_data = data.PromotionCostList
	}
	
	get base_atk() {
		return this._atk_base + (this._atk_add * (this.level - 1))
	}
	
	get base_def() {
		return this._def_base + (this._def_add * (this.level - 1))
	}

	get base_hp() {
		return this._hp_base + (this._hp_add * (this.level - 1))
	}
	
	get base_spd() {
		return this._spd_base
	}
	
	get base_crit_rate() {
		return this._cr_base
	}
	
	get base_crit_dmg() {
		return this._cd_base
	}
	
	get base_aggro() {
		return this._aggro_base
	}
}