import { writeFileSync } from 'fs';
import { BlessingGroup } from '../Blessing.js';

BlessingGroup.loadAll()

for (const group of BlessingGroup.map.values()) {
	const fileName = `${group.id} - ${group.name}.txt`
	const blessings = group.resolveAllBlessings().map(blessing => `${blessing.name} (${blessing.rarity}-star Blessing of ${blessing.path})`)
	writeFileSync(`./output/blessing_groups/${fileName}`, blessings.join('\n'))
}