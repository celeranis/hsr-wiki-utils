import { replaceUnderlinedEE } from '../../ExtraEffect.js';
import { AvatarRankData } from '../../files/Ability.js';
import { getFile } from '../../files/GameFile.js';
import { textMap } from '../../TextMap.js';
import { client } from '../../util/Bot.js';
import { updateAllPages } from '../../util/UpdateTemplateParam.js';

const abilityPages = await client.getPagesInCategory('Eidolons')

const abilities = await getFile<AvatarRankData[]>('ExcelOutput/AvatarRankConfig.json')

await updateAllPages('Eidolon Infobox', 'desc', 'updating desc', abilityPages, (pageName, currentParams) => {
	const abilityName = (currentParams.title || pageName.replace(' (Eidolon)', ''))
		.replaceAll('&#39;', "'")
		.replaceAll('—', '&mdash;')
	const trace = abilities.find(ability => currentParams.level == ability.Rank.toString() && textMap.getText(ability.Name) == abilityName)
	if (!trace) {
		console.warn(`Could not find eidolon "${abilityName}"`)
		return currentParams.desc
	}
	return replaceUnderlinedEE(textMap.getText(trace.Desc, trace.Param).replaceAll('\n', '<br />'), trace.ExtraEffectIDList)
})