import { program } from 'commander';
import { existsSync } from 'fs';
import { rm } from 'fs/promises';
import { client } from '../../util/Bot.js';
import { dumpFile, files } from './util.js';

program
	// .option('--file [file]')
	.option('--page <page>')
	.option('--lang <lang>', 'Language to upload', 'en')
	.option('--ignore-warnings')
	.option('--list')
	.parse()

const opts = program.opts()
if (!opts.page) {
	console.error('No page specified!')
	process.exit(1)
}

for (const pageTitle of opts.page.split(';;')) {
	const page = await client.read(pageTitle)
	if (page.invalid) {
		console.error(`Page "${pageTitle}" is invalid!`)
		process.exit(1)
	}
	if (page.missing) {
		console.error(`Page "${pageTitle}" does not exist!`)
		process.exit(1)
	}

	const pageContent = page.revisions?.[0].content
		?.replaceAll(/<!\-\-.+?\-\->/g, '')

	if (!pageContent) {
		throw new TypeError(`pageContent for page "${pageTitle}" is undefined!`)
	}

	if (existsSync('./tmp/uploading.ogg')) {
		await rm('./tmp/uploading.ogg')
	}

	const alreadyUploaded = new Set<string>()
	for (const [, audioName] of pageContent.matchAll(/\{\{A\|(.+?\.ogg)\}\}/gi)) {
		let internalName = audioName
			.replaceAll(' ', '_')
			.replace(/^VO_/, 'vo_')
			.replace(/\.ogg$/, '')
			+ ` {l=${opts.lang}}`

		let file = files[internalName]
		if (!file) {
			internalName = internalName.replace(/^vo_/, '')
			file = files[internalName]
		}
		if (!file) {
			console.warn(`Could not find file for "${internalName}"`)
			continue
		}

		if (alreadyUploaded.has(internalName)) {
			console.log(`Skipped "${internalName}" as it has already been uploaded`)
		}

		await dumpFile(`./tmp/`, `uploading.ogg`, file)

		if (!opts.list) {
			const response = await client.upload('./tmp/uploading.ogg', audioName, `==Summary==\n{{File\n|categories = ${pageTitle}\n}}\n\n==Licensing==\n{{Fairuse}}`, {
				comment: `uploading VO for [[${pageTitle}]]`,
				ignorewarnings: opts.ignoreWarnings ?? false
			})
			if (response.result == 'Warning') {
				if (response.warnings?.exists) {
					console.log(`Skipped ${internalName}, already uploaded to ${audioName}`)
				}
			}
		} else {
			console.log(`"${internalName}" → "${audioName}"`)
		}

		await rm('./tmp/uploading.ogg')

		alreadyUploaded.add(internalName)
	}

	const catPage = await client.read(`Category:${pageTitle}`)
	if (catPage.missing) {
		if (!opts.list) {
			await client.create(`Category:${pageTitle}`, '{{Category Mission}}', `creating VO category for [[${pageTitle}]]`)
		} else {
			console.log(`Category [[Category:${pageTitle}]] will be created`)
		}
	}

	if (!pageContent.match(/\|voiced\s*=\s*/)) {
		if (!opts.list) {
			await client.edit(pageTitle, ({ content }) => {
				return content
					.replace('\n}}\n', '\n|voiced        = yes\n}}\n')
			})
		} else {
			console.log(`[[${pageTitle}]] will be edited to add "voiced" param`)
		}
	}
}