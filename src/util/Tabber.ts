export class Tabber {
	tabs: [string, string][] = []
	
	constructor(public no_border = false) {
		
	}
	
	addTab(label: string, content: string) {
		this.tabs.push([label, content])
	}
	
	template() {
		const output = ['{{Tabber']
		
		for (const [label, content] of this.tabs) {
			output.push(
				`|${label}`,
				'|',
				content
			)
		}
		
		if (this.no_border) {
			output.push('|no_border = 1')
		}
		
		output.push('}}')
		
		return output.join('\n')
	}
}