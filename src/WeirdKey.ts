import config from '../config.json' with { "type": "json" };
import { Version } from './Shared.js';

export class WeirdKey {
	static data = {
		BlessingGroupID: {
			'2.3': 'LIOICIOFLGL',
			'2.2': 'GKOGJPDANCE',
			'2.1': 'EGDAIIJDDPA',
			'2.0': 'GJHLAKLLFDI',
			'1.6': 'JHOKDPADHFM',
		},
		BlessingGroupMembers: {
			'2.3': 'LEEMGFGKCMO',
			'2.2': 'NFPAICKGMBC',
			'2.1': 'AMGHNOBDGLM',
			'2.0': 'DNKFBOAIDCE',
			'1.6': 'ADJICNNJFEM'
		}
	}
	
	static get(key: keyof typeof WeirdKey.data, version: Version = config.target_version as Version): string {
		return this.data[key][version]
	}
}