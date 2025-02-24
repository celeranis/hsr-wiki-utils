import config from '../config.json' with { "type": "json" };
import { Version } from './Shared.js';

export class WeirdKey {
	static data = {
		// from RogueBuffGroup
		BlessingGroupID: {
			'2.7': 'BHOJPHAJLMI',
			'2.6': 'HFLJEIPCCNF',
			'2.5': 'IOMDAGGIAME',
			'2.4': 'MNNPAFJEGJC',
			'2.3': 'LIOICIOFLGL',
			'2.2': 'GKOGJPDANCE',
			'2.1': 'EGDAIIJDDPA',
			'2.0': 'GJHLAKLLFDI',
			'1.6': 'JHOKDPADHFM',
		},
		BlessingGroupMembers: {
			'2.7': 'NDFFCMBIOAG',
			'2.6': 'ILLJGPJPFAC',
			'2.5': 'HLKMFHBOAIA',
			'2.4': 'KCFPNHGBGIA',
			'2.3': 'LEEMGFGKCMO',
			'2.2': 'NFPAICKGMBC',
			'2.1': 'AMGHNOBDGLM',
			'2.0': 'DNKFBOAIDCE',
			'1.6': 'ADJICNNJFEM'
		},
		// from RogueTournWeeklyDisplay
		DescParamType: {
			'3.0': 'PGCFPBGPDGG',
			'2.7': 'MPNJPFDCBDG',
			'2.6': 'EOMLKKGEAEF',
			'2.5': 'FGMDOEKGPEE',
			'2.4': 'EEOLCCFMJFF',
			'2.3': 'IAGLGKPDLOE',
		},
		DescParamValue: {
			'3.0': 'CPPHDJHHGGN',
			'2.7': 'ODPKJEJKOIH',
			'2.6': 'HPPEILAONGE',
			'2.5': 'NLABNDMDIKM',
			'2.4': 'DIBKEHHCPAP',
			'2.3': 'EPBOOFFCKPJ',
		},
		// from RogueMagicTalent
		TalentDescParamValue: {
			'2.7': 'DOJFLNAILGJ',
			'2.6': 'GLCDOILMFOM'
		},
		// from RogueHandBookEvent
		UnlockProgress: {
			'2.7': 'FINLPBFNLHP',
			'2.6': 'EJJEHNGJCJH',
			'2.5': 'EEMMLHDLGKP'
		},
		UnlockNPCID: {
			'2.7': 'KOPDNGGIFKN',
			'2.6': 'GNBAICOJALE',
			'2.5': 'GFKCKEKCGIB'
		},
		// from StageConfig
		StageConfigKey: {
			'2.7': 'BNCHHJCHKON',
			'2.6': 'MFKLINKCPPA',
			'2.5': 'PFMLCKGCKOB'
		},
		StageConfigValue: {
			'2.7': 'ODPKJEJKOIH',
			'2.6': 'HPPEILAONGE',
			'2.5': 'NLABNDMDIKM'
		},
		// from RogueMagicScepter
		LockMagicUnitId: {
			'2.7': 'OBLJDNJKECG',
			'2.6': 'GHFHMJLCIEC'
		},
		LockMagicUnitLevel: {
			'2.7': 'KFDGMFMJMIA',
			'2.6': 'LDEDAMNEIJO'
		}
	}
	
	static get(key: keyof typeof WeirdKey.data, version: Version = config.target_version as Version): string {
		return this.data[key][version]
	}
}