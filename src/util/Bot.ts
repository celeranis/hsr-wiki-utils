import { Mwn } from 'mwn';
import config from '../../config.json' with { type: 'json' };

export const client = new Mwn(config.wikibot_options)

await client.login()