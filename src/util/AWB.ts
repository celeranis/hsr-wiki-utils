import { program } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import inquirer from 'inquirer';

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
		
		return this.file_contents = readFileSync(this.file).toString()
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
}