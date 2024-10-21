import type { performance } from '../dialogue/tasks/Performance.ts'
import type { DICON_MAP, Dictionary } from '../Shared.ts'
import { HashReference } from '../TextMap.ts'
import { ItemReference } from './Item.js'

export interface StageData {
	Name: string
	BlockNodeConfigList: BlockNodeConfig[]
	AliasConfigList: string[]
	VolumeConfigPath: string
}

export interface BlockNodeConfig {
	MarkForDelete?: boolean
	Index?: number
	BlockName: string
	BlockTag: string
	Independent?: boolean
	Alias?: string
	PcOnly?: boolean
	HLODPath: string
	TagContainer?: { List?: BlockNodeTag[] }
}

export interface BlockNodeTag {
	Tag: string
	TagHash: number
}

export interface BlockData {
	Name: string
	PrefabData: string
	StagePrefabIntroList: StagePrefabInfo[]
	EnvironmentDataInfoList: EnvironmentDataInfo[]
	TerrainAlbedo?: number
	TerrainCoverage?: number
	TerrainControlMode?: number
	PolymerList: unknown[]
	Cells?: unknown
}

export interface EnvironmentDataInfo {
	Name: string
	AssetPath: string
}

export type InternalLayerName = 'Landmark' | 'Prop' | 'StandAloneProp'

export interface StagePrefabInfo {
	$type: 'RPG.GameCore.StagePrefabInfo'
	Index: number
	Name: string
	LayerName: string
	AssetPath: string
	Active: number
	PosX: number
	PosY: number
	PosZ: number
	RotX: number
	RotY: number
	ScaleX: number
	ScaleY: number
	ScaleZ: number
	Bound: ObjectBoundData
}

export interface ObjectBoundData {
	Center: Vector3
	Size: Vector3
}

export interface Vector2 {
	X: number
	Y: number
}
export interface Vector3 extends Vector2 {
	Z: number
}

export type LevelGroupCategory = 'Mission'
export type LevelGroupSaveType = 'Reset'

export interface LevelFloor {
	FloorID: number
	StartAnchorID: number
	StageData: string
	CameraType?: string
	LayerToAreaMask: number[]
	NavmapConfigPath: string
	SavedValues?: LevelSavedValue[]
	GroupInstanceList: LevelGroupReference[]
	DimensionList?: unknown[]
	GroupInstanceCommonMap: Dictionary<unknown>
	EnableGroupStreaming?: boolean
	EnableGroupSpaceConflict?: boolean
	EnableGroupRegionStreaming?: boolean
}

export interface LevelSavedValue {
	ID: number
	Name: string
	AllowedValues?: number[]
	MaxValue?: number
}

export interface MinimapVolumeData {
	Center?: Vector3
	Size: Vector3
	SectionVertices: Vector2[]
	Atlas: string
	Sections: MinimapSection[]
	BackgroundMapSprite: string
	RoadMapSpriteDict: Dictionary<string>
	ItemSpriteDict: Dictionary<string>
	Scale: number
	CompleteScale: number
}

export interface MinimapSection {
	MapLayerID: number
	Sprite: string
	IsRect?: boolean
	Indices: number[]
	UIPosition: Vector2
	InitialHidden?: boolean
	Center?: Vector2
	Triangles: Vector2[]
	Pivot?: Vector2
}

export interface LevelGroupReference {
	// GroupGUID: string
	GroupPath: string
	// DimensionFilter?: { List?: unknown[] }
	Name?: string
	ID: number
	IsDelete?: boolean
}

export interface LevelGroupData {
	GroupGUID: string
	GroupName: string
	Category: LevelGroupCategory
	ConfigPrefabPath: string
	AreaAnchorName: string
	SaveType: LevelGroupSaveType
	LoadCondition?: LoadConditionList
	UnloadCondition?: LoadConditionList
	OwnerMainMissionID: number
	ConflictIDList: number[]
	AnchorList: MapAnchor[]
	MonsterList?: MapMonster[]
	PropList?: MapProp[]
	DistrictList?: MapDistrict[]
	WaypointList?: MapObject[]
	PathwayList?: MapPathway[]
	BattleAreaList?: MapBattleArea[]
	NPCList?: MapNPC[]
	CrowdList?: unknown[] // don't really need this
	PedestrianList?: unknown[] // or this
	SmartObjectList?: unknown[] // and this one seems pretty niche
}

export interface MissionCondition {
	Type: 'SubMission'
	Phase?: 'Finish'
	ID: number
}

export interface LoadConditionList {
	Conditions: LoadCondition[]
	Operation?: 'Or' | undefined
}

export type LoadCondition = MissionCondition

export interface MapObject {
	Name?: string
	RotX?: number
	RotY?: number
	RotZ?: number
	ID: number
	PosX: number
	PosY?: number
	PosZ: number
}

export interface MapAnchor extends MapObject {
	Name: string
}

export interface MapNPC extends MapObject {
	NPCID: number
	LoadOnInitial?: boolean
	DialogueGroups: number[]
	ServerInteractVerificationIDList: unknown[]
	DefaultIdleStateName?: string
	DefaultLookAtMode: string
	BoardShowList: number[]
	TalkChosenType?: 'loop'
	OverrideNPCName?: HashReference
	OverrideNPCTitle?: HashReference
	FirstDialogueGroupID?: number
	TalkDialogGroupIDList: number[]
	DefaultIdleFreeStyleMotionID: number
	BornType?: 'Permanent'
	OverrideSeriesID: number
	InitialHiddenNodeList: unknown[]
	Dialog?: NPCDialogData
	ConnectWithSubMissionIDList?: number[]
	SpawnConfig?: NPCSpawnConfig
}

export interface NPCDialogData {
	LevelGraph: string
	PackList: unknown[]
	EnableCondition: LoadConditionList
}

export interface NPCSpawnConfig {
	CaptureDistanceTolerance?: number
	EntitySpawnConfig: unknown
}

export interface MapProp extends MapObject {
	PropID: number
	IsOverrideInitLevelGraph: boolean
	Trigger: MapTriggerData
	CampID: number
	CustomTriggerMap?: Dictionary<MapTriggerData>
	CustomTriggerMapV2?: Dictionary<MapTriggerData>
	BridgeStateRotations?: unknown[]
	AnchorGroupID?: number
	AnchorID?: number
	MappingInfoID?: number
	DialogueGroups?: number[]
	TalkDialogGroupIDList?: number[]
	ServerInteractVerificationIDList?: unknown[]
	CameraCenterEntityList?: unknown[]
}

export interface MapTriggerData {
	Shape?: 'Box' | undefined
	Radius: number
	DimX: number
	DimY: number
	DimZ: number
	Offset?: Vector3
	PointList?: unknown[]
	Server?: boolean
}

export interface MapBattleArea extends MapObject {
	EnviroProfile: string
	Tags: string[]
	TagContainer: unknown
	PropsGroupID: number
	PrefetchMainMissionList: unknown[]
	PrefetchSubMissionList: unknown[]
}

export interface MapDistrict extends MapObject {
	Trigger: MapTriggerData
}

export interface MapPathway extends MapObject {
	WaypointIDList: number[]
}

export interface MapMonster extends MapObject {
	NPCMonsterID: number
	AIConfig: MonsterAIConfig
	ValueSource: unknown
	CampID: number
	BattleArea: MapObjectReference
	EventID: number
	BoardShowList: number[]
	TagList: unknown[]
	SpawnConfig: NPCSpawnConfig
}

export interface MonsterAIConfig {
	PathwayList: unknown[]
	SlaveConfigList: unknown[]
}

export interface MapObjectReference {
	GroupID: number
	ID: number
}

export type PlaneType = 'Rogue' | 'Maze' | 'Challenge' | 'Town' | 'Train' | 'AetherDivide' | 'TrialActivity'

export interface MazePlane {
	PlaneID: number
	PlaneType: PlaneType
	SubType: number
	MazePoolType: number
	WorldID: number
	PlaneName: HashReference
	StartFloorID: number
	FloorIDList: number[]
}

export interface MazeFloor {
	FloorID: number
	FloorName: string
	BaseFloorID: number
	FloorTag?: string[]
	BGMWorldState: string
	FloorBGMGroupName: string
	FloorBGMNormalStateName: string
	FloorDefaultEmotion: string
	FloorBGMBusyStateName: string
	EnterAudioEvent: string[]
	ExitAudioEvent: string[]
	FloorType: 'Default' | 'Indoor'
	OptionalLoadBlocksConfig?: string
	MunicipalConfigPath?: string
	MapLayerNameList: HashReference[]
	CombatBGMLow: string
	CombatBGMHigh: string
}

export interface MazeFloorConnect {
	FromFloorID: number
	ToFloorID: number
	WayPointGroupID: number
	WayPointEntityID: number
}

export interface MapEntrance {
	ID: number
	EntranceType: 'Explore'
	PlaneID: number
	FloorID: number
	BeginMainMissionList: number[]
	FinishMainMissionList: number[]
	FinishSubMissionList: number[]
}

export interface InternalPlaneEvent {
	EventID: number
	WorldLevel: number
	DropList: number[]
	Reward: number
	StageID: number
	DisplayItemList: number[]
}

export type MappingType = 
	| 'FARM_ENTRANCE' | 'RAID_ENTRANCE' | 'CHALLENGE_STORY' | 'CHALLENGE_ENTRANCE' 
	| 'ROGUE_ENTRANCE' | 'WORLD_SHOP_ENTRANCE' | 'ACTIVITY_ENTRANCE' | 'HELIOBUS_CHALLENGE'
	| 'HELIOBUS_RAID' | 'DRONE_ENTRANCE' | 'REWARD_COLLECTION' | 'OFFERING_REWARD'
	| 'ACTIVITY_TELEVISION' | 'SUB_MAP_ENTRANCE'

export type FarmType = 'COCOON' | 'ELEMENT' | 'RELIC' | 'COCOON2'

export interface InternalMappingInfo {
	ID: number
	WorldLevel: number
	Type?: MappingType
	FarmType?: FarmType
	IsTeleport?: boolean
	IsShowInFog?: boolean
	PlaneID?: number
	FloorID?: number
	GroupID?: number
	ConfigID?: number
	InitialEnable?: boolean
	Name: HashReference
	Desc: HashReference
	ShowMonsterList: number[]
	DisplayItemList: ItemReference[]
	EntranceId?: number
}

export type PropType = 'PROP_ORDINARY' | 'PROP_SPRING' | 'PROP_COCOON' | 'PROP_MAZE_DECAL'
	| 'PROP_MAZE_PUZZLE' | 'PROP_ELEMENT' | 'PROP_RELIC' | 'PROP_LIGHT' | 'PROP_ROGUE_DOOR'
	| 'PROP_ROGUE_OBJECT' | 'PROP_ROGUE_REWARD_OBJECT' | 'PROP_TREASURE_CHEST'
	| 'PROP_ROGUE_CHEST' | 'PROP_ELEVATOR' | 'PROP_PERSPECTIVE_WALL' | 'PROP_PLATFORM'
	| 'PROP_DESTRUCT' | 'PROP_NO_REWARD_DESTRUCT' | 'PROP_BOXMAN_BINDED'
	| 'PROP_MAP_ROTATION_CHARGER' | 'PROP_MAP_ROTATION_VOLUME' | 'PROP_MAZE_JIGSAW'
	| 'PROP_MAP_ROTATION_SWITCHER'

export interface InternalMazeProp {
	ID: number
	PropType: PropType
	IsMapContent?: boolean
	PropName: HashReference
	PropTitle: HashReference
	PropIconPath: string
	BoardShowList: number[]
	ConfigEntityPath: string
	DamageTypeList: unknown[]
	MiniMapIconType?: number
	MiniMapStateIcons: MinimapStateIcon[]
	JsonPath: string
	PropStateList: string[]
	PerformanceType: keyof typeof performance
	HasRendererComponent: boolean
	LodPriority: number
}

export interface MinimapStateIcon {
	State: string
	IconID: number
	Color: string
}

export type ChestType = 
	// generic types
	| 'CHEST_TREASURE_PUZZLE' | 'CHEST_TREASURE_NORMAl' | 'CHEST_NORMAL_CHALLENGE'
	// world indicators
	| 'CHEST_WORLD_ZERO' | 'CHEST_WORLD_ONE' | 'CHEST_WORLD_TWO' | 'CHEST_WORLD_THREE' | 'CHEST_AETHER_DIVIDE'
	// chest rarity
	| 'CHEST_LOW_LEVEL' | 'CHEST_MIDDLE_LEVEL' | 'CHEST_HIGH_LEVEL'

	// Herta Space Station puzzles
	| 'CHEST_PUZZLE_PAD' | 'CHEST_PUZZLE_FLIP_BRIDGE'
	// Jarilo-VI puzzles
	| 'CHEST_PUZZLE_BOXMAN' | 'CHEST_PUZZLE_CABBLE'
	// The Xianzhou Luofu puzzles
	| 'CHEST_PUZZLE_SUIYUAN' | 'CHEST_PUZZLE_CHEST_PUZZLE_DESTROY_ROOT' | 'CHEST_MAGIC_CUBE' | 'CHEST_ROTARY_TABLE'
	// Pencony puzzles
	| 'CHEST_PUZZLE_JIGSAW' | 'CHEST_PUZZLE_CLOCKBOX' | 'CHEST_PUZZLE_WOLFBRO'

export interface MazeChest {
	ID: number
	WorldID: number
	ChestType: ChestType[]
}

export type NPCSubType = 'Avatar' | 'Special' | 'Monster'

export interface InternalNPCData {
	ID: number
	DefaultNPCName: HashReference
	ConfigEntityPath: string
	DefaultNPCTitle: HashReference
	JsonPath: string
	SubType?: NPCSubType
	SeriesID?: number
}

export type DialogueNPCType = 'Simple'

export interface InternalDialogueNPC {
	GroupID: number
	GroupType: DialogueNPCType
	InteractTitle?: string
	ConditionIDs: number[]
	Priority?: number
	IconType: keyof typeof DICON_MAP
	ActPath: string
}

export interface InternalDialogueCondition {
	ID: number
	Type: 'submission_state_equal' | 'eventmission_state_equal'
	Param1: number
	Param2: number
}

export interface WorldData {
	ID: number
	IsRealWorld?: boolean
	IsShow?: boolean
	WorldName: HashReference
	WorldLanguageName: HashReference
	DynamicOptionalBlock: string
	MapSpaceTypeList: string[]
	ChapterIconBigPath: string
	ChronicleWorldBgPath: string
	ChronicleWorldSubBgPath: string
	ChronicleWorldPredictPath: string
	ChronicleWorldProcessingPath: string
	CameraWidth: number
	CameraHeight: number
	SmallWorldIconPath: string
}

export interface GotoData {
	ID: number
	GotoType: number
	ParamIntList: number[]
	ParamStringList: string[]
	UnlockID?: number
}

export type GotoConfig = Dictionary<GotoData>