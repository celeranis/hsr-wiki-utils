import { writeFileSync } from 'fs';
import { Curio } from '../Curio.js';

const output: string[] = ['{{Curio Information/Header}}']

output.push(...Curio.loadAll().map(curio => curio.entry()))

output.push('{{Curio Information/Footer}}')

writeFileSync('./output/curios.wikitext', output.join('\n'))