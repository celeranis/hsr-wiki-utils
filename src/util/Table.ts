export function whitespace(string: string, targetWhitespace: number = 13) {
	return string + ' '.repeat(targetWhitespace - string.length)
}

export function multilineFormat(cell: string | number) {
	if (typeof cell == 'string' && cell.includes('\n'))
		return '\n' + cell
	else
		return ' ' + cell
}

export class Table {
	data: (string | number)[][] = []
	
	constructor(public customClass: string, public header?: string[]) {
		
	}
	
	addRow(...args: (string | number)[]) {
		this.data.push([...args])
	}
	
	addRows(...rows: (string | number)[][]) {
		this.data.push(...rows)
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
			output.push('|-')
			if (inlineRows && !row.find(cell => typeof cell == 'string' && cell.includes('\n'))) {
				output.push(`| ${row.join(' || ')}`)
			} else {
				output.push(...row.map(cell => `|${multilineFormat(cell)}`))
			}
		}
		
		output.push('|}')
		
		return output.join('\n')
	}
	
	get row_count() {
		return this.data.length + (this.header ? 1 : 0)
	}

	get col_count() {
		return Math.max(...this.data.map(row => row.length))
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
			output.push(...row.map((cell, i) => `|${whitespace(`cell-${currentRow}-${i + 1}`)}=${multilineFormat(cell)}`))
			currentRow++
		}
		
		output.push('}}')
		
		return output.join('\n')
	}
}