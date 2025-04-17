import { client, retryIfRatelimit } from './Bot.js'

export type TemplateParamUpdater = (page: string, currentParams: Record<string, string>) => (string | number | Promise<string | number>)
export type NameMatcher = (name: string) => boolean

export async function updateAllPages(templateName: string | NameMatcher, paramName: string, pages: string[], updater: TemplateParamUpdater) {
	for (const page of pages) {
		await retryIfRatelimit(() => client.edit(page, async (rev) => {
			let content = rev.content
			const templates = new client.Wikitext(rev.content).parseTemplates({ namePredicate: typeof(templateName) == 'string' ? (name => name == templateName) : templateName })
			
			if (!templates || templates.length == 0) {
				console.warn(`Could not find matching template on page "${page}", skipping...`)
				return null as any
			}
			
			for (const template of templates) {
				const paramMap = Object.fromEntries(template.parameters.map(param => [param.name, param.value]))
				const newValue = await updater(page, paramMap)
				const newWikitext = template.wikitext.replaceAll(new RegExp(`(?<=\\|\\s*)(${paramName}\\s*=\\s*).+?(?=\\s*\\n\\||\\s*\\n\\}\\})`, 'g'), (_, paramLeft) => `${paramLeft}${newValue}`)
				content = content.replace(template.wikitext, newWikitext)
			}
			
			if (content == rev.content) return null as any
			// await AWB.viewDiff(rev.content, content)
			
			return content
		}))
	}
}