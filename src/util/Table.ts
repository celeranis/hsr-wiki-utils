import { whitespace } from './General.js'

export function multilineFormat(cell: string | number) {
	if (typeof cell == 'string' && cell.includes('\n')) {
		if (cell.includes(' | ')) {
			return cell.replace(' | ', ' |\n')
		} else {
			return '\n' + cell
		}
	}
	else {
		return typeof cell == 'string' && cell.startsWith('!') ? cell : ' ' + cell
	}
}

interface TableRow {
	attr?: string
	contents: string[]
}

export class Table {
	data: TableRow[] = []
	
	constructor(public customClass: string, public header?: string[]) {
		
	}
	
	addRow(...args: string[]) {
		const row = {contents: [...args]}
		this.data.push(row)
		return row
	}

	addRowWithAttr(attr: string | undefined, args: string[] | string) {
		const row = { attr, contents: Array.isArray(args) ? args : [args] }
		this.data.push(row)
		return row
	}
	
	addRows(...rows: string[][]) {
		this.data.push(...rows.map(row => {return {contents: row}}))
	}
	
	wikitable(inlineRows = true) {
		const output = [`{| class="${this.customClass}"`]
		
		if (this.header) {
			if (inlineRows) {
				output.push(`! ${this.header.join(' !! ')}`)
			} else {
				output.push(...this.header.map(header => `! ${header}`))
			}
		}
		
		for (const row of this.data) {
			output.push(row.attr ? `|- ${row.attr}` : '|-')
			if (inlineRows && !row.contents.find(cell => typeof cell == 'string' && cell.includes('\n'))) {
				output.push(`| ${row.contents.join(' || ')}`)
			} else {
				output.push(...row.contents.map(cell => `${cell.toString().startsWith('!') ? '' : '|'}${multilineFormat(cell)}`))
			}
		}
		
		output.push('|}')
		
		return output.join('\n')
	}
	
	get row_count() {
		return this.data.length + (this.header ? 1 : 0)
	}

	get col_count() {
		return Math.max(...this.data.map(row => row.contents.length))
	}
	
	wrapper() {
		const output = [
			`{{Table Wrapper`,
			`|class        = ${this.customClass}`,
			`|size         = ${this.row_count};${this.col_count}`
		]
		let currentRow = 1
		if (this.header) {
			output.push(...this.header.map((cell, i) => `|${whitespace(`header-${currentRow}-${i + 1}`)}= ${cell}`))
			currentRow++
		}
		
		for (const row of this.data) {
			output.push(...row.contents.map((cell, i) => `|${whitespace(`cell-${currentRow}-${i + 1}`)}=${multilineFormat(cell)}`))
			currentRow++
		}
		
		output.push('}}')
		
		return output.join('\n')
	}
	
	html() {
		const output = ['<table class="article table">']
		
		if (this.header) {
			output.push(
				'\t<thead>',
				...this.header.map(cell => `\t\t<th>${cell}</th>`),
				'\t</thead>'
			)
		}
	}
}