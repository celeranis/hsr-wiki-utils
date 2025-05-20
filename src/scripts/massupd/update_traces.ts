import { replaceUnderlinedEE } from '../../ExtraEffect.js';
import { AvatarSkillTreeData } from '../../files/Character.js';
import { getFile } from '../../files/GameFile.js';
import { textMap } from '../../TextMap.js';
import { client } from '../../util/Bot.js';
import { updateAllPages } from '../../util/UpdateTemplateParam.js';

const abilityPages = await client.getPagesInCategory('Bonus Abilities')

const abilities = await getFile<AvatarSkillTreeData[]>('ExcelOutput/AvatarSkillTreeConfig.json')

await updateAllPages('Ability Infobox', 'desc', 'updating desc', abilityPages, (pageName, currentParams) => {
	const abilityName = currentParams.title || pageName.replace(' (Ability)', '')
	const trace = abilities.find(ability => textMap.getText(ability.PointName) == abilityName)
	if (!trace) {
		console.warn(`Could not find trace "${abilityName}"`)
		return currentParams.desc
	}
	return replaceUnderlinedEE(textMap.getText(trace.PointDesc, trace.ParamList).replaceAll('\n', '<br />'), trace.ExtraEffectIDList)
})