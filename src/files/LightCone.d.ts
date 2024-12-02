import { CombatPath, Value } from '../Shared.ts'
import { HashReference } from '../TextMap.ts'
import { ItemReference } from './Item.js'

export type EquipmentRarity = 'CombatPowerLightconeRarity3' | 'CombatPowerLightconeRarity4' | 'CombatPowerLightconeRarity5'

export interface EquipmentData {
	EquipmentID: number
	Release?: boolean
	EquipmentName: HashReference
	EquipmentDesc: HashReference
	Rarity: EquipmentRarity
	AvatarBaseType: CombatPath
	MaxPromotion: number
	MaxRank: number
	ExpType: number
	SkillID: number
	ExpProvide: number
	CoinCost: number
	RankUpCostList: ItemReference[]
	ThumbnailPath: string
	ImagePath: string
	ItemRightPanelOffset: number[]
	AvatarDetailOffset: number[]
	BattleDialogOffset: number[]
	GachaResultOffset: number[]
}

export interface EquipmentPromotionData {
	EquipmentID: number
	Promotion?: number
	PromotionCostList: ItemReference[]
	MaxLevel: number
	WorldLevelRequire: number
	PlayerLevelRequire?: number

	BaseHP: Value<number>
	BaseHPAdd: Value<number>
	BaseAttack: Value<number>
	BaseAttackAdd: Value<number>
	BaseDefence: Value<number>
	BaseDefenceAdd: Value<number>
}