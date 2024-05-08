import { execSync } from 'child_process';
import { program } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import { writeFile } from 'fs/promises';
import inquirer from 'inquirer';

export function tagRegex(tagName: string) {
	return new RegExp(`<\\s*/?\\s*${tagName}\\s*/?\\s*>`, 'gi')
}

export class AWB {
	static file: string
	static file_contents: string
	static page_name: string
	
	static init(): string {
		program
			.option('--name <name>')
			.option('--file <path>')
		
		program.parse()
		
		this.file = program.opts().file
		this.page_name = program.opts().name
		
		this.file_contents = readFileSync(this.file).toString()
		
		return this.file_contents
	}
	
	static customGenfixes(page: string) {
		return page
			.replaceAll(/\n[=]{2,}\s*(.+?)\s*[=]{2,/g, '==$1==') // remove spaces in headings
			
			.replaceAll(tagRegex('br'), '<br />')
			.replaceAll(tagRegex('i'), "''")
			.replaceAll(tagRegex('b'), "'''")
			.replaceAll(tagRegex('references'), "{{Reflist}}")
			
			// .replaceAll(/█+/, (substr) => `{{Obfuscate|${substr.length}}}`)
			.replaceAll('—', '&mdash;')
			.replaceAll('\u00d7', '&times;')
	}
	
	static getLinks() {
		
	}
	
	static fileDiff(oldFile: string, newFile: string): string {
		execSync(`code --diff ${oldFile} ${newFile} --wait`, {
			cwd: process.cwd()
		})
		return readFileSync(newFile).toString()
	}
	
	static async viewDiff(oldContents: string, newContents: string, ext: string = 'wikitext'): Promise<string> {
		await Promise.all([
			writeFile(`./tmp/diff0.${ext}`, oldContents),
			writeFile(`./tmp/diff1.${ext}`, newContents)
		])
		
		return this.fileDiff(`./tmp/diff0.${ext}`, `./tmp/diff1.${ext}`)
	}
	
	static sendOutput(newContents: string) {
		writeFileSync(this.file, newContents)
	}
	
	static async prompt(message: string): Promise<string> {
		const response = await inquirer.prompt([{
			name: 'content',
			type: 'input',
			message,
		}])
		return response.content
	}
	
	static async confirm(message: string = 'Confirm?'): Promise<boolean> {
		const response = await inquirer.prompt([{
			name: 'confirmed',
			type: 'confirm',
			message,
		}])
		return response.confirmed
	}
	
	static async presentOptions<T extends string>(message: string, choices: T[]): Promise<T> {
		const response = await inquirer.prompt([{
			name: 'choice',
			type: 'list',
			message,
			choices
		}])
		return response.choice
	}
}