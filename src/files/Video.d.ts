export interface VideoData {
	VideoID: number
	VideoPath: string
	IsPlayerInvolved?: boolean
	CaptionPath: string
	Encryption?: boolean
}

export interface VideoCaption {
	CaptionTextID: number
	StartTime: number
	EndTime: number
}

export interface VideoCaptionData {
	CaptionList: VideoCaption[]
}