import config from '../config.json' with { "type": "json" };
import { Version } from './Shared.js';

export class WeirdKey {
	static data = {
		BlessingGroupID: {
			'2.5': 'IOMDAGGIAME',
			'2.4': 'MNNPAFJEGJC',
			'2.3': 'LIOICIOFLGL',
			'2.2': 'GKOGJPDANCE',
			'2.1': 'EGDAIIJDDPA',
			'2.0': 'GJHLAKLLFDI',
			'1.6': 'JHOKDPADHFM',
		},
		BlessingGroupMembers: {
			'2.5': 'HLKMFHBOAIA',
			'2.4': 'KCFPNHGBGIA',
			'2.3': 'LEEMGFGKCMO',
			'2.2': 'NFPAICKGMBC',
			'2.1': 'AMGHNOBDGLM',
			'2.0': 'DNKFBOAIDCE',
			'1.6': 'ADJICNNJFEM'
		},
		DescParamType: {
			'2.5': 'FGMDOEKGPEE',
			'2.4': 'EEOLCCFMJFF',
			'2.3': 'IAGLGKPDLOE',
		},
		DescParamValue: {
			'2.5': 'NLABNDMDIKM',
			'2.4': 'DIBKEHHCPAP',
			'2.3': 'EPBOOFFCKPJ',
		},
		UnlockProgress: {
			'2.5': 'EEMMLHDLGKP'
		},
		UnlockNPCID: {
			'2.5': 'GFKCKEKCGIB'
		},
		StageConfigKey: {
			'2.5': 'PFMLCKGCKOB'
		},
		StageConfigValue: {
			'2.5': 'NLABNDMDIKM'
		}
	}
	
	static get(key: keyof typeof WeirdKey.data, version: Version = config.target_version as Version): string {
		return this.data[key][version]
	}
}