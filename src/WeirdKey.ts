import config from '../config.json' with { "type": "json" };
import { Version } from './Shared.js';

export class WeirdKey {
	static data = {
		// from RogueBuffGroup
		BlessingGroupID: {
			'3.1': 'IDLBMIHBAPB',
			'3.0': 'IKOLKLEFCGO',
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
			'3.1': 'GNGDPDOMDFH',
			'3.0': 'DKLEHCPFLFJ',
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
			'3.1': 'PICHIHHCOCB',
			'3.0': 'PGCFPBGPDGG',
			'2.7': 'MPNJPFDCBDG',
			'2.6': 'EOMLKKGEAEF',
			'2.5': 'FGMDOEKGPEE',
			'2.4': 'EEOLCCFMJFF',
			'2.3': 'IAGLGKPDLOE',
		},
		DescParamValue: {
			'3.1': 'HMCDHMFHABF',
			'3.0': 'CPPHDJHHGGN',
			'2.7': 'ODPKJEJKOIH',
			'2.6': 'HPPEILAONGE',
			'2.5': 'NLABNDMDIKM',
			'2.4': 'DIBKEHHCPAP',
			'2.3': 'EPBOOFFCKPJ',
		},
		// from RogueMagicTalent
		TalentDescParamValue: {
			'3.1': 'HMCDHMFHABF',
			'3.0': 'INNKEBMHLNF',
			'2.7': 'DOJFLNAILGJ',
			'2.6': 'GLCDOILMFOM'
		},
		// from RogueHandBookEvent
		UnlockProgress: {
			'3.1': 'NNDEOKKKKPE',
			'3.0': 'AFMKGEHANLM',
			'2.7': 'FINLPBFNLHP',
			'2.6': 'EJJEHNGJCJH',
			'2.5': 'EEMMLHDLGKP'
		},
		UnlockNPCID: {
			'3.1': 'MBNKLBEBOHB',
			'3.0': 'HLNMOFDGLAA',
			'2.7': 'KOPDNGGIFKN',
			'2.6': 'GNBAICOJALE',
			'2.5': 'GFKCKEKCGIB'
		},
		// from StageConfig
		StageConfigKey: {
			'3.1': 'HEIKKHLKMOA',
			'3.0': 'EGIHHBKIHAK',
			'2.7': 'BNCHHJCHKON',
			'2.6': 'MFKLINKCPPA',
			'2.5': 'PFMLCKGCKOB',
			'2.4': 'MBBNDDLBEPE',
			'2.3': 'LFKFFCJNFKN',
			'2.2': 'MLMLDHKBPLM',
			'2.1': 'CEDKLKIHFEK',
			'2.0': 'DJBGPLLGOEF',
			'1.6': 'JJNBOIODCCF',
			'1.5': 'CFNMGGCLFHN',
			'1.4': 'JDKAMOANICM',
			'1.3': 'COJNNIIOEAK',
			'1.2': 'LFCIILHABDO',
			'1.1': 'OEOPENFDEML',
			'1.0': 'JOAHDHLLMDK',
		},
		StageConfigValue: {
			'3.1': 'MBMDOCJIMEJ',
			'3.0': 'MBMDOCJIMEJ',
			'2.7': 'ODPKJEJKOIH',
			'2.6': 'HPPEILAONGE',
			'2.5': 'NLABNDMDIKM',
			'2.4': 'DIBKEHHCPAP',
			'2.3': 'EPBOOFFCKPJ',
			'2.2': 'PKPGBCJMDEK',
			'2.1': 'IEDALJJJBCE',
			'2.0': 'BOANKOCFAIM',
			'1.6': 'AMMAAKPAKAA',
			'1.5': 'JCFBPDLNMLH',
			'1.4': 'MOJJBFBKBNC',
			'1.3': 'MBOHKHKHFPD',
			'1.2': 'LGKGOMNMBAH',
			'1.1': 'BHLILFMLNEE',
			'1.0': 'LKJLPJMIGNJ',
		},
		// from RogueMagicScepter
		LockMagicUnitId: {
			'3.1': 'KAMGFNJJJDE',
			'3.0': 'MMBMHEHDIBF',
			'2.7': 'OBLJDNJKECG',
			'2.6': 'GHFHMJLCIEC'
		},
		LockMagicUnitLevel: {
			'3.1': 'OMAMNKOLIOE',
			'3.0': 'PKHCKBELLKE',
			'2.7': 'KFDGMFMJMIA',
			'2.6': 'LDEDAMNEIJO'
		}
	}
	
	static get(key: keyof typeof WeirdKey.data, version: Version = config.target_version as Version): string {
		return this.data[key][version] ?? (version > '3.1' && this.data[key]['3.1'])
	}
}