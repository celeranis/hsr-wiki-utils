export function whitespace(string: string, targetWhitespace: number = 13) {
	return string + ' '.repeat(targetWhitespace - string.length)
}

export function andList(list: string[]) {
	if (list.length < 3) {
		return list.join(' and ')
	} else {
		return list.slice(0, -1).join(', ') + ', and ' + list[list.length - 1]
	}
}

export function pageInfoHeader(title: string) {
	return `<%-- [PAGE_INFO]\nPageTitle=#${title}#\n[END_PAGE_INFO] --%>`
}

export function uploadPrompt(filePath: string, destinationName: string, categories: string) {
	if (!filePath) return ''
	if (!destinationName) {
		throw new TypeError(`Failed to generate upload prompt: destination name is empty or missing!`)
	}
	if (!categories) {
		throw new TypeError(`Failed to generate upload prompt: categories are empty or missing!`)
	}
	
	return `{{subst:void|<!--$UPLOAD:<<${filePath}>-<${destinationName}>-<${categories}>>-->}}`
}

export const PAGENAME = '{{subst:#titleparts:{{subst:PAGENAME}}}}'
export const BASEPAGENAME = '{{subst:#titleparts:{{subst:BASEPAGENAME}}}}'