import type { HashReference } from '../TextMap.ts'

export interface InternalUnlockConfig {
	RogueUnlockID: number
	UnlockFinishWay: number
	RogueUnlockDetail: HashReference
}

// help
export type FinishType = 'AvatarLevelCnt' | 'EquipmentLevelCnt' | 'PropTypeInteract' | 'FinishMission' | 'ChallengeFinish'
	| 'UnlockSkilltreeCnt' | 'AnyCocoonFinish' | 'AllAvatarPromoteCnt' | 'AnyEquipmentPromoteCnt'
	| 'AllAvatarUnlockSkilltreeCnt' | 'RelicSuit' | 'RoguePassAreaProgress' | 'AvatarRankUp' | 'RelicLevelCnt'
	| 'AnyFarmElementFinish' | 'UseItemWithType' | 'UseItem' | 'AutoFinish' | 'FinishDailyMissionCnt'
	| 'AnyMaterialStageFinish' | 'RogueQuestFinishWithGameMode' | 'ItemCompose' | 'PlayerLevel' | 'StageWin'
	| 'ChallengeStars' | 'FinishQuest' | 'TotalLoginDays' | 'GetActivePoint' | 'ExpeditionBeginCnt'
	| 'AnyAvatarLevelUp' | 'AnyEquipmentLevelUp' | 'BattleChallenge' | 'AnyRelicLevelUp' | 'RogueFinishCnt'
	| 'ExcellentEnterBattleAndWin' | 'ChallengeFinishCnt' | 'GetItem' | 'Gacha' | 'ActivityFightFinish'
	| 'PunkLordKillMonsterCnt' | 'PunkLordSupportCnt' | 'BoxingClubAccomplish' | 'MuseumCollectExhibitCnt'
	| 'ActivityFightFirstFinishDifficulty' | 'ActivityMonsterResearchFinishCnt' | 'AnyChallengeStars'
	| 'TreasureDungeonAccomplish' | 'RaidFinishCnt' | 'AlleyLogisticsShopListLink' | 'AlleyNormalOrderFinish'
	| 'AlleySpecialOrderFinish' | 'RogueDLCFinishCnt' | 'RogueDLCFinishCabinetCnt'
	| 'ActivityExpeditionFinishCnt' | 'SubMissionFinishCnt' | 'AetherDivideCollectSpiritType'
	| 'AetherDivideFinishHyperlinkDuel' | 'AetherDivideTrainerLevel' | 'HeliobusPhase'
	| 'HeliobusChallengeFirstClear' | 'SpaceZooExpLevel' | 'RogueNousUnlockDiceSurfaceCnt' | 'RogueUnlockBuff'
	| 'FinishTodayDailyMissionCnt' | 'RogueExploreScore' | 'CocoonFinish' | 'GetPlanar' | 'ResolveRelic'
	| 'UseMazeSkill' | 'AnyAvatarPromoteCnt' | 'AnyAvatarUnlockSkilltreeCnt' | 'PropDestruct'
	| 'RogueExploreRoomFinishCnt' | 'WinBattleWithAssistAvatarCnt' | 'TakePictureCnt' | 'ReplaceMaterialCnt'
	| 'AnyItemComposeCount' | 'PlayStationLogin' | 'TakePlayerLevelReward' | 'ChallengeGivenTypeFloorSettleSuccCnt'
	| 'TrialStageFinish' | 'WorldLevel' | 'SpecificRarityRelicLevelUp' | 'AnyAvatarDressAllRelicMax'
	| 'AnyAvatarSkilltreeMax' | 'FinishQuestByClient' | 'GetAvatarStar' | 'EquipmentTypeCnt' | 'GetAnyRarityRelic'
	| 'ComposeItemWithType' | 'RandomMessageFinishCount' | 'GetBookWithWorld' | 'TreasureChestOpenWithWorld'
	| 'UnlockSpring' | 'TreasureChestOpenCnt' | 'FinishTreasureChallengeWithTag' | 'ExcellentEnterBattle'
	| 'BadEnterBattle' | 'KillMonsterWithGameMode' | 'UAVOutBound' | 'DeliveryTwelve' | 'ItemNum'
	| 'AlleyPlacingGameGoodsNumByGoodsId' | 'AlleyLogisticsDetonateStarSkiff' | 'AlleyShipmentProfit'
	| 'AlleySpecialOrderFinishById' | 'AlleyPlacingGameGoodsNum' | 'AlleyLogisticsShopBattery' | 'StageWinList'
	| 'GetItemWithType' | 'MainMissionHasCustomValue' | 'HeliobusSnsSpecialPostCnt' | 'RaidFinished'
	| 'HeliobusSnsSpecialPostTendency' | 'HeliobusSnsLikeCnt' | 'HeliobusSnsSubCommentCnt' | 'GetItemWithList'
	| 'FinishFirstTalkPerformance' | 'SpaceZooUnlockFeatureCount' | 'SpaceZooUnlockSpecialID' | 'BattleWinWithSingleAvatar'
	| 'BattleWinWithSpecificProfessionAvatar' | 'BattleWinWithSpecificDamageAvatar' | 'WinBattleWithSomeAvatar'
	| 'SkillHitTargetAfterDuration' | 'TriggerRepeatableAvatarVoice' | 'ConsecutiveLoginDays' | 'ComposeConsumeItemWithId'
	| 'InclinationTextWithType' | 'TriggerAvatarVoice' | 'EnterAggroRangeForDuration' | 'UseItemInContinuousDays'
	| 'ChangePhoneThemeCnt' | 'ChangeChatBubbleCnt' | 'SendChatEmojiCnt' | 'SendTrainMemberChatEmojiCnt'
	| 'RecvOppositeGenderChatEmoji' | 'SendMaxChatMsgByChatBubble' | 'BuyShopGoods' | 'BattleLastStandAndEscape'
	| 'RogueKillBattleMonster' | 'DialogueEventCntWithGameMode' | 'RogueFinishWithDifficulty' | 'RoguePropDestruct'
	| 'RogueBuffEnhance' | 'RogueTalentEnable' | 'RogueMiracleUnlock' | 'RogueKillChestMonster' | 'RogueFreeChestMonster'
	| 'RogueFinishWithBuff' | 'RogueFinishWithBuffType' | 'RogueFinishWithBuffCnt' | 'RogueFinishDialogueWithCnt'
	| 'RogueFinishWithMiracleCnt' | 'RogueFinishWithCoinCnt' | 'RogueFinishWithMonster' | 'RogueFinishWithEvent'
	| 'RogueFinishWithDownloadCnt' | 'RogueFinishWithPropDestroyCnt' | 'RogueFinishWithSkillCastCnt'
	| 'RogueFinishWithAvatarCnt' | 'RogueFinishWithAllSameBaseType' | 'RogueFinishWithAllBattleFullHp'
	| 'RogueDLCFinishByHappyDice' | 'RogueDLCKillBattleChestMonsterWithAeon' | 'RogueDLCRollDiceMemeryRewardCnt'
	| 'RogueDLCFinishByWarriorDice' | 'RogueDLCFinishByWarlockDice' | 'RogueDLCFinishByKnightDice'
	| 'RogueDLCFinishByPriestDicePosivive' | 'RogueDLCFinishByBreedDice' | 'RogueDLCRollDiceAccumulateCnt'
	| 'RogueDLCFinishManyMoney' | 'RogueDLCFinishDialogueEvent' | 'RogueDLCShopSoldOutCnt' | 'RogueDLCFinishWithEvent'
	| 'RogueDLCFinishWithPropDestructCnt' | 'RogueDLCFinishAdventureRoomWithMonsterCnt'
	| 'RogueDLCLightenFirstHiddenCabinet' | 'RogueDLCFinishWithAeonCrossCnt' | 'RogueDLCFinishAeonEventWithAeonCnt'
	| 'RogueDLCRollDiceUseCheatCnt' | 'RogueDLCRollDiceUseRepeatCnt' | 'RogueDLCNotWarlockDiceEnterEmptyRoom'
	| 'RogueDLCFinishAdventureRoomWithLevelCnt' | 'RogueDLCNotBreedkDiceEnterSwarmRoom' | 'RogueDLCFinishByAnyDiceNegative'
	| 'RogueDLCFinishMainStoryCnt' | 'RogueDLCFinishSubStoryGroupCnt' | 'RogueDLCFinishMainStory'
	| 'RogueDialogueWithAvatar' | 'RogueChessSetSpecialTypeCnt' | 'RogueNousFinishSubStoryAsRecommend'
	| 'RogueNousValueReachPositive' | 'RogueNousValueReachNeagtive' | 'RogueNousNousValueChange'
	| 'RogueNousFinishDiceWithStt' | 'RogueNousContinuationEnterNotAroundCellWithDiceCnt'
	| 'RogueNousFinishDiceWithMoneyNum' | 'RogueNousFinishDiceWithMapStt' | 'RogueNousFinishDiceWithMiracleNum'
	| 'RogueNousFinishMainStory' | 'RogueNousUnlockDiceBranchCnt' | 'RogueNousFinishWithDiceBranch'
	| 'RogueNousTalentEnable' | 'RogueNousFinishWithDifficultyComp' | 'RogueNousFinishWithActionPoint'
	| 'RogueChessFinishWithMiracleInGroupNum' | 'RogueNousContinuousRollDiffSurface'
	| 'RogueNousFinishWithDiceSurfaceRarity' | 'RogueAdventureEscapeLazerSuccInContinuousRounds'
	| 'PunkLordSummonMonsterCnt' | 'PunkLordStageFinish' | 'MuseumPhaseFinish' | 'MuseumAreaLevel'
	| 'MuseumCollectStuffCnt' | 'MuseumTargetFinishCnt' | 'TreasureDungeonFinishFloor' | 'ActivityFightMaxWave'
	| 'ActivityFantasticStoryFinishBattleWithScore' | 'ActivityStrongChallengeEndScore' | 'ActivityStrongChallengeBegin'
	| 'AlleyLogisticsBattery' | 'AlleyLogisticsShopLink' | 'AlleyEventFinishByType' | 'AlleyPrestigeLevel'
	| 'RogueDLCGetCoinCnt' | 'RogueDLCBlockFinishCnt' | 'RogueDLCGetAeonBuffEnhanceCnt' | 'RogueDLCDiceNegativeCnt'
	| 'RogueDLCGetBuffTypeCnt' | 'RogueDLCMarkTypeFinishCnt' | 'RogueDLCChessBoardEventCnt' | 'RogueDLCGetMiracleCnt'
	| 'RogueDLCGetCoinExceptBattleCnt' | 'RogueDLCBuyShopItemOnceRoomCnt' | 'RogueDLCContinuationEnterBattleBlockCnt'
	| 'RogueDLCBlockEnterCnt' | 'RogueDLCEnterBlockWithDiceZero' | 'RogueDLCBlockFinishFullHpCnt'
	| 'RogueDLCMarkTypeFinishOneLayerCnt' | 'RogueDLCEnterBlockWithCoinCnt' | 'RogueDLCContinuationEnterDiffBlockCnt'
	| 'RogueDLCAeonOptionCnt' | 'RogueDLCFailCnt' | 'RogueNousFinishSubStory' | 'RogueNousFinishWithAeonDifficultyComp'
	| 'RogueNousFinishWithDifficultyCompDicePassive' | 'RogueNousFinishStoryCnt' | 'SpaceZooHybridCount'
	| 'SpaceZooUnlockSpecialCount' | 'SpaceZooOpCatteryCount' | 'SpaceZooExpPoint' | 'AetherDivideCollectSpiritId'
	| 'FinishQuestListAndTakeReward' | 'HeliobusLevel' | 'HeliobusChallengeTargetFinish' | 'RaidTargetFinish'
	| 'SceneTreasureChestOpenCnt' | 'PropState' | 'RogueFinishArea' | 'FinishRogueEndlessWithScore' | 'FarmElementFinish'
	| 'RogueDLCSelectedAeonDimensionCnt' | 'RogueMagicTalentEnable'

export type ParamType = 'GreaterEqual' | 'Equal' | 'ListContain' | 'NoPara' | 'LessEqual' | 'IntContainListContain'

export interface InternalFinishWay {
	ID: number
	FinishType: FinishType
	ParamType: ParamType
	// unused(?)
	ParamStr1?: string
	ParamInt1?: number
	ParamInt2?: number
	ParamInt3?: number
	ParamIntList: number[]
	ParamItemList?: unknown[]
	Progress: number
	IsBackTrack?: boolean
	MazePlaneID?: number
	MazeFloorID?: number
}

export interface InternalQuestData {
	QuestID: number
	QuestType: number
	QuestTitle: HashReference
	ImagePath: string
	UnlockType: string
	UnlockParamList: unknown[]
	RewardID: number
	FinishWayID: number
}