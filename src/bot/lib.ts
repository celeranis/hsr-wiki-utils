import { MwnPage } from 'mwn'

export const listening = []

export function RevisionListener(namespaces: WikiNamespace | WikiNamespace[]) {
	if (!Array.isArray(namespaces)) namespaces = [namespaces]
	
	return function RCListenerFinal(method: any, context: ClassMethodDecoratorContext) {
		return method
	}
}

export abstract class BaseBotTask {
	abstract init(params: BotParams): void
}

export interface BotParams {
	wiki_url: string
	username: string
	password: string
}

export interface RevisionListenerEntry {
	namespaces: WikiNamespace[]
	method: any
}

export type RevisionListenerMethod = (revision: PageRevision) => void

export class PageRevision {
	mwn_page!: MwnPage
	
	// parseJsonContent<T>(): T {
	// 	this.mwn_page
	// }
}

export const enum WikiNamespace {
	MAIN = 0,
	TALK = 1,
	USER = 2,
	USER_TALK = 3,
	PROJECT = 4,
	PROJECT_TALK = 5,
	FILE = 6,
	FILE_TALK = 7,
	MEDIAWIKI = 8,
	MEDIAWIKI_TALK = 9,
	TEMPLATE = 10,
	TEMPLATE_TALK = 11,
	HELP = 12,
	HELP_TALK = 13,
	CATEGORY = 14,
	CATEGORY_TALK = 15,
	FORUM = 110,
	FORUM_TALK = 111,
	GEOJSON = 420,
	GEOJSON_TALK = 421,
	USER_BLOG = 500,
	USER_BLOG_COMMENT = 501,
	BLOG = 502,
	BLOG_TALK = 503,
	MODULE = 828,
	MODULE_TALK = 829,
	MESSAGE_WALL = 1200,
	THREAD = 1201,
	MESSAGE_WALL_GREETING = 1202,
	BOARD = 2000,
	BOARD_THREAD = 2001,
	TOPIC = 2002,
	GADGET = 2300,
	GADGET_TALK = 2301,
	GADGET_DEFINITION = 2302,
	GADGET_DEFINITION_TALK = 2303,
	MAP = 2900,
	MAP_TALK = 2901,
}