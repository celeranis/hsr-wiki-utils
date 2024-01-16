export function whitespace(string: string, targetWhitespace: number = 13) {
	return string + ' '.repeat(targetWhitespace - string.length)
}