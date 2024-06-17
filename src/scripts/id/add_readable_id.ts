import { Dictionary } from '../../Shared.js';
import { textMap } from '../../TextMap.js';
import { getFile } from '../../files/GameFile.js';
import { Book, BookSeries } from '../../files/Readable.js';
import { AWB } from '../../util/AWB.js';
import { Template } from '../../util/Template.js';

const seriesData = await getFile<Dictionary<BookSeries>>('ExcelOutput/BookSeriesConfig.json')
const bookData = await getFile<Dictionary<Book>>('ExcelOutput/LocalbookConfig.json')

AWB.init()

let chosenId: string | undefined = Template.getParamValue(AWB.file_contents, 'id')

if (!chosenId) {
	for (const [id, series] of Object.entries(seriesData)) {
		if (AWB.page_name == textMap.getText(series.BookSeries).replaceAll(/<.+?>/g, '')) {
			chosenId = id
			break
		}
	}
}

if (!chosenId) {
	console.log(`No book series matched "${AWB.page_name}"`)
	chosenId = await AWB.prompt('Enter an ID to use, or leave blank to skip:')
	if (!chosenId) process.exit(0)
}

const partIds = Object.values(bookData)
	.filter(book => book.BookSeriesID == Number(chosenId))
	.map(book => book.BookID)

if (chosenId.length < 3) {
	chosenId = '0'.repeat(3 - chosenId.length) + chosenId
}

let replaced = Template.addParamValue(AWB.file_contents, 'id', chosenId + `\n|partIds     = ${partIds.join(';')}`)
if (!replaced) {
	console.log(`Failed to add ID ${chosenId}: Could not find an ID param.`)
	AWB.sendOutput(AWB.file_contents.replace(/{{Readable(?:_|\s)Infobox\r?\n/, `{{Readable Infobox\n|id          = ${chosenId}\n`))
	await AWB.confirm('Continue?')
}

else {
	AWB.sendOutput(replaced)
}