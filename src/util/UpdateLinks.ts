import { client } from './Bot.js';

const CLOSING_PATTERN = `(\\]\\]|\\}\\}|\\|)`

function escapeRegex(text: string) {
	return text.replaceAll(/([^\w\s])/g, '\\$1')
		.replaceAll(' ', '[\\s_]')
}

export async function updateLinks(fromPage: string, toPage: string) {
	fromPage = fromPage.replaceAll('_', ' ')
	toPage = toPage.replaceAll('_', ' ')
	
	const escapedFrom = escapeRegex(fromPage)
	for await (const results of client.continuedQueryGen({ action: 'query', format: 'json', prop: 'linkshere', titles: fromPage, lhprop: 'title' })) {
		for (const page of Object.values(results.query?.pages).map((pages: any) => pages.linkshere.map(page => page.title)).flat(1)) {
			console.log(page)
			await client.edit(page, ({content}) => {
				return content
					.replaceAll(new RegExp(`(\\[\\[:?)${escapedFrom}]]`, 'gi'), `$1${toPage}]]`)
					.replaceAll(new RegExp(`(\\[\\[:?)${escapedFrom}\\|`, 'gi'), `$1${toPage}|`)
					.replaceAll(new RegExp(`(\\[\\[:?)${escapedFrom}\\#`, 'gi'), `$1${toPage}#`)
					.replaceAll(new RegExp(`(link\\s+=\\s+)${escapedFrom}${CLOSING_PATTERN}`, 'gi'), `$1${toPage}$2`)
			})
		}
	}
}