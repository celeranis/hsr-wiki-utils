import { writeFileSync } from 'fs'
import { setTimeout } from 'timers/promises'
import { AWB } from '../util/AWB.js'

type Position = [number, number]

declare namespace Fandom {
	interface IconData {
		title: string
		url: string
		height: number
		width: number
	}

	interface CategoryData {
		id: string
		color: string
		icon?: string
		listId: number
		name: string
		symbol: string
		symbolColor: string
	}

	interface LinkData {
		label: string
		url: string
	}

	interface MarkerPopupData {
		title: string
		description: string
		descriptionHtml: string
		link?: LinkData
	}

	interface MarkerData {
		categoryId: string
		id: string
		popup: MarkerPopupData
		icon?: IconData
		position: Position
	}

	interface MapOptions {
		editActionUrl?: string
		isTranscluded: boolean
		useMarkerClustering: boolean
	}

	interface MapData {
		backgroundUrl: string
		bounds: [Position, Position]
		categories: CategoryData[]
		coordinateOrder: 'xy' | 'yx'
		description?: string
		editable: boolean
		markerProgressEnabled?: boolean
		markers: MarkerData[]
		name: string
		origin: 'top-left' | 'bottom-left'
	}
}

type World = 'herta' | 'jarilo' | 'luofu' | 'penacony'

interface ExpectCategory {
	id: string
	name: string
	icon: string
	worlds?: World[]
	areas?: string[]
}

const PAGE_CONTENT: Fandom.MapData = JSON.parse(AWB.init().trim())

const MOVE_CATEGORIES = {
	major_landmarks: 'space_anchors',
	other_landmarks: 'marked_locations',
	instances_with_collectibles: 'subareas_with_collectibles',
	'Mission Context': 'adventure_mission_steps'
}

const EXPECT_CATEGORIES: ExpectCategory[] = [
	{
		"id": "space_anchors",
		"name": "Space Anchors",
		"icon": "File:Icon Space Anchor Active.png"
	},
	{
		"id": "event_waypoints",
		"name": "Events",
		"icon": "File:Icon Map Event.png"
	},
	{
		"id": "marked_locations",
		"name": "Marked Locations",
		"icon": "File:Icon Map Major Landmark.png"
	},
	{
		"id": "event_locations",
		"name": "Marked Event Locations",
		"icon": "File:Icon Map Event.png"
	},
	{
		"id": "calyx_golden",
		"name": "Calyx (Golden)",
		"icon": "File:Icon Calyx Golden.png"
	},
	{
		"id": "calyx_crimson",
		"name": "Calyx (Crimson)",
		"icon": "File:Icon Calyx Crimson.png"
	},
	{
		"id": "caverns",
		"name": "Caverns of Corrosion",
		"icon": "File:Icon Cavern of Corrosion.png"
	},
	{
		"id": "echo_of_war",
		"name": "Echo of War",
		"icon": "File:Icon Echo of War Enemy.png"
	},
	{
		"id": "stagnant_shadows",
		"name": "Stagnant Shadows",
		"icon": "File:Icon Stagnant Shadow.png"
	},
	{
		"id": "basic_treasures",
		"name": "Basic Treasures",
		"icon": "File:Icon Map Basic Treasure.png"
	},
	{
		"id": "bountiful_treasures",
		"name": "Bountiful Treasures",
		"icon": "File:Icon Map Bountiful Treasure.png"
	},
	{
		"id": "precious_treasures",
		"name": "Precious Treasures",
		"icon": "File:Icon Map Precious Treasure.png"
	},
	{
		"id": "warp_trotters",
		"name": "Warp Trotters",
		"icon": "File:Icon Map Warp Trotter.png"
	},
	{
		"id": "lordly_trashcans",
		"name": "Lordly Trashcans",
		"icon": "File:Icon Map Lordly Trashcan.png",
		worlds: ['penacony']
	},
	{
		"id": "puzzles",
		"name": "Puzzles",
		"icon": "File:Icon Map Puzzle.png"
	},
	{
		"id": "cycrane_roosts",
		"name": "Cyrane Roosts",
		"icon": "File:Icon Map Cycrane Roost.png",
		worlds: ['luofu']
	},
	{
		"id": "origami_birds",
		"name": "Origami Birds",
		"icon": "File:Icon Map Origami Bird.png",
		worlds: ['penacony']
	},
	{
		"id": "great_tree",
		"name": "Origami Bird \"Great Tree\"",
		"icon": "File:Icon Map Origami Bird Tree.png",
		worlds: ['penacony']
	},
	{
		"id": "dreamscape_pass_stickers",
		"name": "Dreamscape Pass Stickers",
		"icon": "File:Icon Map Sticker.png",
		worlds: ['penacony']
	},
	{
		"id": "hanu",
		"name": "Hanu's Adventure",
		"icon": "File:Icon Map Hanu.png",
		worlds: ['penacony']
	},
	{
		"id": "clockies_extras",
		"name": "Clockie's Extras",
		"icon": "File:Icon Map Clockie's Extras.png",
		areas: ['Clock Studios Theme Park']
	},
	{
		"id": "enemies",
		"name": "Enemies",
		"icon": "File:Icon Map Enemy.png"
	},
	{
		"id": "trailblaze_missions",
		"name": "Trailblaze Missions",
		"icon": "File:Icon Map Trailblaze Mission.png"
	},
	{
		"id": "trailblaze_mission_steps",
		"name": "Trailblaze Mission Steps",
		"icon": "File:Icon Map Trailblaze Mission Step.png"
	},
	{
		"id": "trailblaze_continuances",
		"name": "Trailblaze Continuances",
		"icon": "File:Icon Map Trailblaze Continuance.png"
	},
	{
		"id": "trailblaze_continuance_steps",
		"name": "Trailblaze Continuance Steps",
		"icon": "File:Icon Map Trailblaze Continuance Step.png"
	},
	{
		"id": "companion_missions",
		"name": "Companion Missions",
		"icon": "File:Icon Map Companion Mission.png"
	},
	{
		"id": "companion_mission_steps",
		"name": "Companion Mission Steps",
		"icon": "File:Icon Map Companion Mission Step.png"
	},
	{
		"id": "daily_missions",
		"name": "Daily Missions",
		"icon": "File:Icon Map Daily Mission.png"
	},
	{
		"id": "daily_mission_steps",
		"name": "Daily Mission Steps",
		"icon": "File:Icon Map Daily Mission Step.png"
	},
	{
		"id": "adventure_missions",
		"name": "Adventure Missions",
		"icon": "File:Icon Map Adventure Mission.png"
	},
	{
		"id": "adventure_mission_steps",
		"name": "Adventure Mission Steps",
		"icon": "File:Icon Map Adventure Mission Step.png"
	},
	{
		"id": "shops",
		"name": "Shops",
		"icon": "File:Icon Map Shop.png"
	},
	{
		"id": "shops_with_collectibles",
		"name": "Shops with Collectibles",
		"icon": "File:Icon Map Shop With Collectibles.png"
	},
	{
		"id": "exits",
		"name": "Exit",
		"icon": "File:Icon Map Exit.png"
	},
	{
		"id": "entrances",
		"name": "Entrance",
		"icon": "File:Icon Map Entrance.png"
	},
	{
		"id": "subareas_with_collectibles",
		"name": "Subareas with Collectibles",
		"icon": "File:Icon Map Entrance With Collectibles.png"
	},
	{
		"id": "dreamwalker_rooms",
		"name": "Dreamwalker Rooms",
		"icon": "File:Icon Map 3D.png"
	},
	{
		"id": "arcane_artworks",
		"name": "Arcane Artworks",
		"icon": "File:Icon Map Frame Portal.png"
	},
	{
		"id": "npcs",
		"name": "Other NPCs",
		"icon": "File:Icon Map NPC.png"
	},
	{
		"id": "readables",
		"name": "Readables",
		"icon": "File:Icon Map Readable.png"
	},
	{
		"id": "phonograph_records",
		"name": "Phonograph Records",
		"icon": "File:Icon Map Phonograph.png"
	},
	{
		"id": "achievements",
		"name": "Achievements",
		"icon": "File:Icon Map Achievement.png"
	},
	{
		"id": "clockwork_gears",
		"name": "Clockwork - Gears",
		"icon": "File:Icon Map Clockwork.png",
		worlds: ['penacony']
	},
	{
		"id": "clockwork_npcs",
		"name": "Clockwork - NPCs",
		"icon": "File:Icon Map Psychic Detective.png",
		worlds: ['penacony']
	},
	{
		"id": "clockwork_bloodhounds_watchlist",
		"name": "Clockwork - Bloodhound's Watchlist",
		"icon": "File:Icon Map Absorb Emotions.png",
		worlds: ['penacony']
	},
	{
		"id": "billboards",
		"name": "Billboards",
		"icon": "File:Icon Map Billboard.png",
		areas: ['Golden Hour']
	},
	{
		"id": "ice_cream",
		"name": "Ice Cream",
		"icon": "File:Icon Map Achievement.png",
		areas: ['Golden Hour']
	},
	{
		"id": "hound_statues",
		"name": "Hound Statues",
		"icon": "File:Icon Map Achievement.png",
		worlds: ['penacony']
	},
	{
		"id": "herta_puppets",
		"name": "Memory Bubbles",
		"icon": "File:Icon Map Memory Bubble.png",
		worlds: ['herta']
	},
	{
		"id": "belobog_trash_cans",
		"name": "Trash Cans",
		"icon": "File:Icon Map Achievement.png",
		areas: ['Administrative District']
	},
	{
		"id": "dreampeek_call",
		"name": "Dreampeek Call",
		"icon": "File:Icon Map Dreampeek Call.svg",
		areas: ['Golden Hour']
	},
	{
		"id": "memory_bubbles",
		"name": "Memory Bubbles",
		"icon": "File:Icon Map Memory Bubble.png",
		worlds: ['herta'],
		areas: ['Old Weapon Testing Ground']
	},
	{
		"id": "warring_expeditions",
		"name": "Warring Expeditions",
		"icon": "File:Icon Map Warring Expedition.png"
	},
	{
		"id": "expeditions_with_collectibles",
		"name": "Warring Expeditions with Collectibles",
		"icon": "File:Icon Map Warring Expedition With Collectibles.png"
	},
	{
		"id": "investigations",
		"name": "Investigations",
		"icon": "File:Icon Map Investigation.png"
	},
	{
		"id": "landmarks",
		"name": "Landmarks",
		"icon": "File:Icon Map Major Landmark.png"
	},
	{
		"id": "removed_event_waypoints",
		"name": "Removed Events",
		"icon": "File:Icon Map Removed Event.png"
	},
	{
		"id": "dreamjolt_tv_stages",
		"name": "Dreamjolt TV",
		"icon": "File:Icon Map Television.png",
		worlds: ['penacony']
	},
	{
		"id": "starhunt_game_graffiti",
		"name": "Starhunt Game Graffiti",
		icon: 'File:Icon Map Removed Event.png',
		worlds: ['herta']
	}
]

async function error(str: string): Promise<never> {
	console.error(str)
	await setTimeout(10_000)
	throw new Error(str)
}

const CURRENT_WORLD: World = 'penacony'
const CURRENT_AREA = PAGE_CONTENT.description?.match(/{{Map Description\|(.*?)(?:\||}})/i)?.[1]!
const SYMBOL_CLEARED = Symbol('cleared')

if (!CURRENT_AREA) {
	await error(`Could not detect area from ${PAGE_CONTENT.description}`)
}

function isActive(expect: ExpectCategory) {
	return expect.worlds != null ? expect.worlds.includes(CURRENT_WORLD) || (expect.areas?.includes(CURRENT_AREA) ?? false)
		: expect.areas != null ? expect.areas.includes(CURRENT_AREA)
		: true
}

for (const category of PAGE_CONTENT.categories) {
	const expect = EXPECT_CATEGORIES.find(ocat => ocat.id == category.id)
	if (expect) {
		if (isActive(expect)) {
			category.name = expect.name
			category.id = expect.id
			category.icon = expect.icon
			category[SYMBOL_CLEARED] = true
		}
		continue
	}

	const moveTo = MOVE_CATEGORIES[category.id] || MOVE_CATEGORIES[category.name]
	if (moveTo) {
		PAGE_CONTENT.markers.forEach(marker => {
			if (marker.categoryId == category.id) {
				marker.categoryId = moveTo
			}
		})
	}
	else {
		await error(`Unrecognized category "${category.id}" - "${category.name}"`)
	}
}

PAGE_CONTENT.categories = PAGE_CONTENT.categories
	.filter(cat => cat[SYMBOL_CLEARED])

function io(expect: {id: string}) {
	return EXPECT_CATEGORIES.findIndex(cat => cat.id == expect.id)
}

function expectToFandom(expect: ExpectCategory): Fandom.CategoryData {
	return {
		color: '#fa005a',
		symbol: '',
		symbolColor: '',
		...expect
	} as Fandom.CategoryData
}

for (const expect of EXPECT_CATEGORIES) {
	if (isActive(expect) && !PAGE_CONTENT.categories.find(cat => cat.id == expect.id)) {
		PAGE_CONTENT.categories.push(expectToFandom(expect))
	}
}

PAGE_CONTENT.categories.sort((c0, c1) => io(c0) - io(c1))

for (const marker of PAGE_CONTENT.markers) {
	if (marker.popup?.link?.url) {
		marker.popup.link.url = marker.popup.link.url.replaceAll(' ', '_')
	}
}

PAGE_CONTENT.categories.forEach((cat, index) => cat.listId = index + 1)

writeFileSync(`./output/stupid/${AWB.page_name.replaceAll('Map:', '')}.json`, JSON.stringify(PAGE_CONTENT, null, 4))
// AWB.sendOutput(JSON.stringify(PAGE_CONTENT, null, 4))