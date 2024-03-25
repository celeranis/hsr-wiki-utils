import { AWB } from '../util/AWB.js';
import { Template } from '../util/Template.js';

const CATEGORY_REGEXP = /\[\[Category:(.+?)\]\]/gi
const SUMMARY_HEADER = /==\s*?Summary\s*?==/gi

const contents = AWB.init()

const contentsLower = contents.toLowerCase()
if (
	contentsLower.includes('{{file') 
	|| contentsLower.includes('#redirect') 
	|| contentsLower.includes('{{delete') 
	|| contentsLower.includes('{{map')
) process.exit(0)

const categories = [...contents.matchAll(CATEGORY_REGEXP)].map(match => match[1]).join(';')

let output = contents
	.replaceAll(CATEGORY_REGEXP, '')

const fileTemplate = new Template('File', { categories })
const newSummary = `==Summary==\n${fileTemplate.block()}`
	
if (output.match(SUMMARY_HEADER)) {
	output = output.replace(SUMMARY_HEADER, newSummary)
} else {
	output = newSummary + '\n\n' + output.trim()
}

AWB.sendOutput(output)