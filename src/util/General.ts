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