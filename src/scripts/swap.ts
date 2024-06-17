import { program } from 'commander';
import { AWB } from '../util/AWB.js';
import { client } from '../util/Bot.js';

program
	.argument('<page1>')
	.argument('<page2>')

program.parse()

const [from, to] = program.args

const confirmed = await AWB.confirm(`Swap "${from}" with "${to}"?`)
if (!confirmed) process.exit()

const tmpPage = from.replace(/(\.\w+$|$)/, ' tmp' + Date.now() + '$1')
await client.move(from, tmpPage, `Swapping [[${from}]] with [[${to}]]`, {
	noredirect: true
})
await client.move(to, from, `Swapping [[${from}]] with [[${to}]]`, {
	noredirect: true
})
await client.move(tmpPage, to, `Swapping [[${from}]] with [[${to}]]`, {
	noredirect: true
})