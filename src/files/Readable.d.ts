import { HashReference } from '../TextMap.ts'

export interface InternalBookSeries {
	BookSeriesID: number
	BookSeries: HashReference
	BookSeriesComments: HashReference
	BookSeriesNum: number
	BookSeriesWorld: number
	IsShowInBookshelf?: boolean
}

export interface InternalBook {
	BookID: number
	BookSeriesID: number
	BookSeriesInsideID: number
	BookInsideName: HashReference
	BookContent: HashReference
	BookDisplayType: number
	LocalBookImagePath: string[]
}

export interface InternalBookWorld {
	BookSeriesWorld: number
	BookSeriesWorldTextmapID: HashReference
	BookSeriesWorldIconPath: string
	BookSeriesWorldBackgroundPath: string
}