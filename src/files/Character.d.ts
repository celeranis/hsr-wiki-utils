import { AttackType, CombatPath, Value } from '../Shared.ts'
import { HashReference } from '../TextMap.ts'
import { ItemReference } from './Item.js'
import { InternalStatModifier } from './Stats.js'

export type AvatarRarity = 'CombatPowerAvatarRarityType4' | 'CombatPowerAvatarRarityType5'

export interface AvatarData {
	AvatarID: number
	AvatarName: HashReference
	AvatarFullName: HashReference
	AdventurePlayerID: number
	AvatarVOTag: string
	Rarity: AvatarRarity
	AvatarInitialSkinName: HashReference
	AvatarInitialSkinDesc: HashReference
	JsonPath: string
	DamageType: AttackType
	SPNeed: Value<number>
	ExpGroup: number
	MaxPromotion: number
	MaxRank: number
	RankIDList: [number, number, number, number, number, number]
	RewardList: ItemReference[]
	RewardListMax: ItemReference[]
	SkillList: number[]
	AvatarBaseType: CombatPath
	
	DefaultAvatarModelPath: string
	DefaultAvatarHeadIconPath: string
	AvatarSideIconPath: string
	AvatarMiniIconPath: string
	AvatarGachaResultImgPath: string
	ActionAvatarHeadIconPath: string
	UltraSkillCutInPrefabPath: string
	UIAvatarModelPath: string
	ManikinJsonPath: string
	AIPath: string
	SkilltreePrefabPath: string
	SideAvatarHeadIconPath: string
	WaitingAvatarHeadIconPath: string
	AvatarCutinImgPath: string
	AvatarCutinBgImgPath: string
	AvatarCutinFrontImgPath: string
	
	AvatarDesc: HashReference
	DamageTypeResistance: unknown[]
	Release?: boolean
	
	AvatarCutinIntroText: HashReference
	AvatarDropOffset: number[]
	AvatarTrialOffset: number[]
	PlayerCardOffset: number[]
	AssistOffset: number[]
	AssistBgOffset: number[]
	AvatarSelfShowOffset: number[]
}

export interface AvatarPromotionData {
	AvatarID: number
	Promotion?: number
	PromotionCostList: ItemReference[]
	MaxLevel: number
	WorldLevelRequire: number
	PlayerLevelRequire?: number
	
	AttackBase: Value<number>
	AttackAdd: Value<number>
	DefenceBase: Value<number>
	DefenceAdd: Value<number>
	HPBase: Value<number>
	HPAdd: Value<number>
	SpeedBase: Value<number>
	CriticalChance: Value<number>
	CriticalDamage: Value<number>
	BaseAggro: Value<number>
}

export interface AvatarSkillTreeData {
	PointID: number
	Level: number
	AvatarID: number
	PointType: number
	Anchor: string
	MaxLevel: number
	PrePoint: number[]
	StatusAddList: InternalStatModifier[]
	MaterialList: ItemReference[]
	AvatarPromotionLimit: number
	LevelUpSkillID: number[]
	IconPath: string
	PointName?: string
	PointDesc?: string
	SimplePointDesc?: string
	ExtraEffectIDList: number[]
	SimpleExtraEffectIDList: number[]
	RecommendPriority: number
	AbilityName?: string
	PointTriggerKey: HashReference
	ParamList: number[]
}