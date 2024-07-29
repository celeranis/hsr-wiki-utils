import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { mkdir, rm } from 'fs/promises';
import config from '../../../config.json' with { "type": "json" };
import { Dictionary } from '../../Shared.js';

const loadFrom = config.asset_roots.TXTP

export interface LangData {
	display: string
	file: string
	txtp_dir: string
}
export const langs: Dictionary<LangData> = {
	en: {
		display: 'English',
		file: '',
		txtp_dir: 'english',
	},
	'zh-cn': {
		display: 'Chinese',
		file: 'ZH ',
		txtp_dir: 'chinese(prc)'
	},
	ja: {
		display: 'Japanese',
		file: 'JA ',
		txtp_dir: 'japanese',
	},
	ko: {
		display: 'Korean',
		file: 'KO ',
		txtp_dir: 'korean'
	}
}

export const files: Dictionary<string> = {}
for (const [code, lang] of Object.entries(langs)) {
	const fileContent = readFileSync(`${loadFrom}/${lang.txtp_dir}/!tags.m3u`).toString()
	for (const [, realName, fileName] of fileContent.matchAll(/\r?\n# %TITLE\s*(.+?)\r?\n([^#]+?\.txtp)/gi)) {
		files[realName] = `${loadFrom}/${lang.txtp_dir}/${fileName}`
	}
	for (const voiceFile of readdirSync(`${config.asset_roots.Audio}/${lang.txtp_dir}/voice`, { withFileTypes: true })) {
		if (!voiceFile.isFile()) continue
		files[voiceFile.name.replace('.wem', '') + ` {l=${code}}`] = `${voiceFile.path}/${voiceFile.name}`
	}
}

export async function dumpFile(outDir: string, outFile: string, sourceName: string) {
	await mkdir(outDir, { recursive: true })
	try {
		execSync(`"${config.vgmstream_path}" -o "${outFile.replace(/\.ogg$/, '.wav')}" "${sourceName}"`, {
			cwd: outDir
		})
		execSync(`ffmpeg -i "${outFile.replace(/\.ogg$/, '.wav')}" "${outFile}" -hide_banner -loglevel error`, {
			cwd: outDir
		})
	} catch (err) {
		if (err && typeof err == 'object' && 'stderr' in err) {
			console.error(`Error while dumping ${outFile}: ${err.stderr!.toString()}`)
		}
	}
	if (existsSync(`${outDir}/${outFile.replace(/\.ogg$/, '.wav')}`)) {
		await rm(`${outDir}/${outFile.replace(/\.ogg$/, '.wav')}`)
	}
}