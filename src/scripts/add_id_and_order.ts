import { Event } from '../Event.js';
import { textMap } from '../TextMap.js';
import { InternalHandbookEvent } from '../files/Occurrence.js';
import { AWB } from '../util/AWB.js';
import { Template } from '../util/Template.js';

AWB.init()

let foundEvent: InternalHandbookEvent | undefined = undefined
const targetTitle = Template.getParamValue(AWB.file_contents, 'title')
for (const handbook of Object.values(Event.HANDBOOK)) {
	if (textMap.getText(handbook.EventTitle) == targetTitle) {
		foundEvent = handbook
	}
}

if (!foundEvent) {
	foundEvent = Event.HANDBOOK[await AWB.prompt(`Could not find Handbook Event ID for ${targetTitle}, enter or skip:`)]
	if (!foundEvent) process.exit(0)
}

let order = foundEvent.Order.toString()
if (order.length < 3) {
	order = '0'.repeat(3 - order.length) + order
}

let newContent = AWB.file_contents.replace('\n}}', `\n|index_id      = ${foundEvent.EventID}\n|order         = ${order}\n}}`)
AWB.sendOutput(newContent)