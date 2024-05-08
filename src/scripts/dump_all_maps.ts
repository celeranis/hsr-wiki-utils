import { Area } from '../maps/Area.js';

const allPlanes = await Area.loadAll()

for (const plane of allPlanes) {
	for (const map of await plane.getMaps()) {
		
	}
}