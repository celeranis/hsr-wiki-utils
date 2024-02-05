import clipboard from 'clipboardy';
import { TextMap } from '../TextMap.js';
import { AWB } from '../util/AWB.js';

while (true) {
	const input = await AWB.prompt('Enter a list of TextMap IDs...')
	const list = input.split(';')
	
	const result = await TextMap.generateOL(list)

	await clipboard.write(result)
	console.log('Copied template to clipboard!')
}