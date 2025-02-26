import { client } from '../util/Bot.js';
import { updateLinks } from '../util/UpdateLinks.js';

const pages = await client.getPagesInCategory('Cyclical Extrapolation Events')

for (const title of pages) {
	if (title == 'Divergent Universe: The Human Comedy/Extrapolation' || !title.includes('The Human Comedy')) continue
	
	const newTitle = title.replaceAll('Divergent Universe: The Human Comedy/Extrapolation/', 'Divergent Universe/Cyclical Extrapolation/')
	console.log(`Moving ${title} to ${newTitle}`)
	
	await client.move(title, newTitle, 'moving to shared')
	
	console.log('Updating links...')
	
	await updateLinks(title, newTitle)
}