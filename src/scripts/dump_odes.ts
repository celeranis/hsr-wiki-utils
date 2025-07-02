import { writeFileSync } from 'fs';
import { Item, ItemList } from '../Item.js';
import { TextMap } from '../TextMap.js';
import { TitanOde } from '../TitanOde.js';
import { pageInfoHeader } from '../util/General.js';
import { teardown } from '../util/JSONParser.js';
import { Table } from '../util/Table.js';

const odes = TitanOde.loadAll()
await Item.loadFrom('main')

const output = [
	pageInfoHeader('Divergent Universe: Protean Hero/Titan Odes'),
	'{{Divergent Universe: Protean Hero Tabs}}',
	'',
	'==Abilities==',
]

const titans = new Set<string>()

for (const ode of odes) {
	titans.add(ode.titan_title)
}

const ICON_MAP = {
	'SpriteOutput/Rogue/Talent/1006.png': 'Icon Additional Mechanism.png',
	'SpriteOutput/BuffIcon/Inlevel/IconBuffHealRatio.png': 'Icon Outgoing Healing Boost.png',
	'SpriteOutput/Rogue/Talent/1004.png': 'Icon DMG Reduction.png',
	'SpriteOutput/BuffIcon/Inlevel/IconBuffDefenceUp.png': 'Icon DEF.png',
	'SpriteOutput/BuffIcon/Inlevel/IconBuffHPBoost.png': 'Icon HP Boost.png',
	'SpriteOutput/BuffIcon/Inlevel/IconBuffDamageResistance.png': 'Icon Effect RES.png',
	'SpriteOutput/BuffIcon/Inlevel/IconBuffShield.png': 'Icon Shield.png',
	'SpriteOutput/BuffIcon/Inlevel/IconBuffAttackUp.png': 'Icon ATK Boost.png',
	'SpriteOutput/BuffIcon/Inlevel/IconBuffAttackUpElement.png': 'Icon All DMG Boost.png',
	'SpriteOutput/UI/Avatar/Icon/IconCriticalDamage.png': 'Icon CRIT DMG.png',
	'SpriteOutput/BuffIcon/Inlevel/IconBuffBreakDamage.png': 'Icon Break Effect.png',
	'SpriteOutput/BuffIcon/Inlevel/IconBuffStatusProbability.png': 'Icon Effect Hit Rate.png',
	'SpriteOutput/BuffIcon/Inlevel/IconBuffSpeedUp.png': 'Icon SPD Boost.png'
}

for (const titan of titans) {
	output.push(`===${titan}===`)
	
	const odeTable = new Table('article-table')
	for (const ode of odes.filter(ode => ode.titan_title == titan).sort((o0, o1) => o0.level - o1.level)) {
		odeTable.addRow(
			`! rowspan="2" | ${ode.level}`,
			`class="align-center" | {{Icon/White|${ICON_MAP[ode.icon]}|48}}`,
			`'''${ode.name}'''<br />${ode.description.replaceAll('\n', '<br />')}`
		)
		odeTable.addRow(
			`${new ItemList(ode.cost).asItemList(false, 'sent', true)}`,
			`class="align-right" | [[#${ode.story_name}|${ode.story_name} →]]`
		)
	}
	
	output.push(
		odeTable.wikitable(false),
		''
	)
}

output.push('==Secrets==')

for (const ode of odes) {
	if (!ode.story_json) continue
	
	output.push(`===${ode.story_name}===`)
	
	const dialogue = (await ode.loadDialogue())!.optimize()
	
	output.push(
		'{{Dialogue Start}}',
		await dialogue.wikitext(),
		'{{Dialogue End}}',
		'----',
		''
	)
}

output.push(
	'==Other Languages==',
	await TextMap.generateOL(9436507094703352798n),
	'',
	'==Change History==',
	'{{Change History|3.1}}'
)

writeFileSync('./output/du-odes.wikitext', output.join('\n'))

teardown()