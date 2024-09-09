import { program } from 'commander';
import { client } from '../util/Bot.js';

program
	.argument('<page>')

program.parse()

const [pageName] = program.args
const pageData = await client.read(pageName)

if (pageData.invalid || pageData.missing) {
	throw new Error(`Failed to load contents of page "${pageName}"`)
}

const pageContent = pageData.revisions?.[0].content!

const lines = pageContent.split('\n')

for (const [index, line] of lines.entries()) {
	if (!line.startsWith(':')) continue
	
	let newLine = line
	
}