import { getExcelFile, getFileSafe } from '../../files/GameFile.js';
import { PlayVideo } from '../../files/graph/Dialog.js';
import { VideoCaptionData, VideoData } from '../../files/Video.js';
import { textMap } from '../../TextMap.js';
import { TranscriptionNote } from '../../util/AbstractDialogueTree.js';
import { BaseDialogueTask, BaseDialogueTaskEntry } from '../DialogueBase.js';

export const VideoConfig = await getExcelFile<VideoData>('VideoConfig.json', 'VideoID')

export class VideoTask extends BaseDialogueTask {
	declare $type: 'RPG.GameCore.PlayVideo'  
	video_id: number
	caption_path?: string
	
	constructor(data: PlayVideo) {
		super(data)
		this.video_id = data.VideoID
		this.caption_path = VideoConfig[this.video_id].CaptionPath || undefined
	}
	
	async wikitext(level: number): Promise<string> {
		if (!this.caption_path) {
			return ';([[#Gallery|Cutscene]] plays)'
		}
		
		const captionData = await getFileSafe<VideoCaptionData>(this.caption_path)
		if (!captionData) {
			return '----\n' + ':'.repeat(level) + ';([[#Gallery|Cutscene]] plays)\n'
				+ ':'.repeat(level + 2) + `{{tx}}{{subst:void|<!--Failed to load captions from ${this.caption_path}-->}}`
				+ '\n' + ':'.repeat(level) + ';(Cutscene ends)\n'
				+ ':'.repeat(level) + '----'
		}
		
		return '----\n' + ':'.repeat(level) + ';([[#Gallery|Cutscene]] plays)\n' + captionData.CaptionList
			.sort((c0, c1) => c0.StartTime - c1.StartTime)
			.map(caption => `${':'.repeat(level + 2)}${textMap.getText(caption.CaptionTextID)}`)
			.join('\n')
			+ '\n' + ':'.repeat(level) + ';(Cutscene ends)\n'
			+ ':'.repeat(level) + '----'
	}
	
	equals(otherTask: BaseDialogueTask | BaseDialogueTaskEntry | TranscriptionNote): boolean {
		return otherTask instanceof VideoTask && this.video_id == otherTask.video_id
	}
}