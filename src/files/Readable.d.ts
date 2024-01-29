import { HashReference } from '../TextMap.ts'

export interface BookSeries {
	BookSeriesID: number
	BookSeries: HashReference
	BookSeriesComments: HashReference
	BookSeriesNum: number
	BookSeriesWorld: number
}

export interface Book {
	BookID: number
	BookSeriesID: number
	BookSeriesInsideID: number
	BookInsideName: HashReference
	BookContent: HashReference
	BookDisplayType: number
	LocalBookImagePath: string[]
}