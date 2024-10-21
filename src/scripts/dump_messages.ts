import { writeFile } from 'fs/promises';
import { ChangeHistory } from '../ChangeHistory.js';
import { MessageItem, MessagesContact } from '../Messages.js';
import { Mission } from '../Mission.js';
import { sanitizeString } from '../Shared.js';
import { pageInfoHeader } from '../util/General.js';
import { Template } from '../util/Template.js';

for (const contact of MessagesContact.loadAll()) {
	const participants = new Set<string>()
	
	const daily: string[] = []
	const mission: string[] = []
	
	for (const group of contact.getGroups()) {
		let out = group.isDaily() ? daily : mission
		
		for (const section of group.getSections()) {
			const firstMessageWords = MessageItem.fromId(section.starting_message_ids[0]).text?.replaceAll('\n', ' ')?.split(' ') || []
			let header = ''
			if (firstMessageWords?.length > 6) {
				header = firstMessageWords.slice(0, 4).join(' ') + '...'
			} else {
				header = firstMessageWords.join(' ')
			}
			
			const messages = (await section.getMessages()).optimize()
			out.push(
				`===${header}===`,
				group.isDaily() ? `{{Messages|text=\n${await messages.wikitext()}\n}}` : `{{Messages\n|start_condition = \n|text =\n${await messages.wikitext()}\n}}`,
				'----',
				''
			)
			messages.getParticipants().forEach(participant => participants.add(`[[${participant.name == '(Trailblazer)' ? 'Trailblazer' : participant.name}]]`))
		}
	}

	const infobox = new Template('Messages Infobox')
		.addParam('id', contact.id)

	if (contact.fake_name && contact.fake_name != contact.name) {
		infobox.addParam('name', contact.fake_name)
	}
	infobox
		.addParam('image', `${contact.type == 'Group' ? 'NPC' : contact.type} ${contact.name} Icon.png`)
		.addParam('type', contact.type)

	if (contact.type != 'Group') {
		infobox
			.addParam('sender', contact.name)
			.addParam('signature', contact.signature || '')
	} else {
		infobox.addParam('participants', [...participants.values()].sort().join('; '))
	}

	if (contact.fake_faction && contact.fake_faction != contact.faction) {
		const condition = contact.reveal_mission_id ? `{{Mission|${Mission.fromId(contact.reveal_mission_id).pagetitle}|showChapter=0}}` : '{{cx}}'
		infobox.addParam('faction', `[[${contact.fake_faction}]] (Before completing ${condition})<br />[[${contact.faction}]] (After completing ${condition})`)
	} else {
		infobox.addParam('faction', contact.faction ?? '')
	}
	
	const output: string[] = [
		pageInfoHeader(`Messages/${contact.name}`),
		infobox.block(),
		''
	]
	
	if (mission.length > 0) {
		output.push(
			'==Mission-Specific==',
			...mission
		)
	}
	
	if (daily.length > 0) {
		output.push(
			'==Daily==',
			...daily
		)
	}
	
	output.push(
		'==Change History==',
		`{{Change History|${(await ChangeHistory.messageContact.findAdded(contact.id))[0]}}}`,
		'',
		'==Navigation==',
		'{{Messages Navbox}}'
	)
	
	if (daily.length == 0 && mission.length == 0) continue
	await writeFile(`./output/messages/${contact.type}/${sanitizeString(contact.name)}-${contact.id}.wikitext`, output.join('\n'))
}