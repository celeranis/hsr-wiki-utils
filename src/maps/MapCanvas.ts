import { Image, createCanvas, loadImage } from 'canvas';
import config from '../../config.json' with { "type": "json" };
import { MinimapVolumeData } from '../files/MapData.js';
import { AreaMap } from './AreaMap.js';

export class MapCanvas {
	
	volume_data: MinimapVolumeData
	
	constructor(public map: AreaMap) {
		this.volume_data = map.level_output!.MinimapVolumeData
	}
	
	loadImage(path: string): Promise<Image> {
		return loadImage(`${config.asset_roots.Texture2D}/${path}`)
	}
	
	async render() {
		const bg = await this.loadImage(this.volume_data.BackgroundMapSprite)
		
		const canvas = createCanvas(bg.width, bg.height)
		const ctx = canvas.getContext('2d')
		
		ctx.drawImage(canvas, )
	}
	
	
}