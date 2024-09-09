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

export function uploadPrompt(filePath: string, destinationName: string) {
	return `{{subst:void|<!--$UPLOAD:<<${filePath}>-<${destinationName}>>}}`
}