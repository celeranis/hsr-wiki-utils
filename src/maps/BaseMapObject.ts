import { MapObject, Vector3 } from '../files/MapData.js';

export class BaseMapObject {
	object_id: number

	position: Vector3
	rotation: Vector3

	internal_name?: string
	
	constructor(data: MapObject) {
		this.object_id = data.ID
		this.position = { X: data.PosX ?? 0, Y: data.PosY ?? 0, Z: data.PosZ ?? 0 }
		this.rotation = { X: data.RotX ?? 0, Y: data.RotY ?? 0, Z: data.RotZ ?? 0 }
		this.internal_name = data.Name
	}
}