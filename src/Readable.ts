import { getFile } from './files/GameFile.js';
import { InternalBook, InternalBookSeries, InternalBookWorld } from './files/Readable.js';
import { textMap } from './TextMap.js';

const BookSeriesConfig = await getFile<InternalBookSeries[]>('ExcelOutput/BookSeriesConfig.json')
const LocalbookConfig = await getFile<InternalBook[]>('ExcelOutput/LocalbookConfig.json')
const BookSeriesWorld = await getFile<InternalBookWorld[]>('ExcelOutput/BookSeriesWorld.json')

export class ReadableSeries {
	id: number
	name: string
	name_hash: number
	description: string
	world_id: number
	visible: boolean
	
	constructor(config: InternalBookSeries) {
		this.id = config.BookSeriesID
		this.name = textMap.getText(config.BookSeries)
		this.name_hash = config.BookSeries.Hash
		this.description = textMap.getText(config.BookSeriesComments)
		this.world_id = config.BookSeriesWorld
		this.visible = config.IsShowInBookshelf ?? false
	}
	
	static loadAll() {
		return Object.values(BookSeriesConfig)
			.map(config => new this(config))
	}
	
	static fromId(seriesId: number) {
		return new this(Object.values(BookSeriesConfig).find(config => config.BookSeriesID == seriesId)!)
	}
	
	getReadables() {
		return Object.values(LocalbookConfig)
			.filter(book => book.BookSeriesID == this.id)
			.map(config => new Readable(config))
			.sort((b1, b2) => b1.series_member_id - b2.series_member_id)
	}
	
	getWorld() {
		return textMap.getText(Object.values(BookSeriesWorld).find(world => world.BookSeriesWorld == this.world_id)!.BookSeriesWorldTextmapID)
	}
}

export class Readable {
	id: number
	series_id: number
	series_member_id: number
	name: string
	content: string
	image_paths: string[]
	
	constructor(config: InternalBook) {
		this.id = config.BookID
		this.series_id = config.BookSeriesID
		this.series_member_id = config.BookSeriesInsideID
		
		this.name = textMap.getText(config.BookInsideName)
		this.content = textMap.getText(config.BookContent)
			.replaceAll(/{{Color\|(\w+)\|/gi, '{{Color|$1|nobold=1|')
			.replaceAll('\n', '<br />')
			.replaceAll('<br /><br />', '\n\n')
			// .replaceAll(/{Img#(\d+)}/gi, `[[File:]]`)
		
		this.image_paths = config.LocalBookImagePath ?? []
	}
	
	static fromId(bookId: number) {
		return new this(LocalbookConfig.find(config => config.BookID == bookId)!)
	}
	
	getSeries() {
		return ReadableSeries.fromId(this.series_id)
	}
}