import { replaceUnderlinedEE } from '../../ExtraEffect.js';
import { AvatarSkillData } from '../../files/Ability.js';
import { getFile } from '../../files/GameFile.js';
import { textMap } from '../../TextMap.js';
import { client } from '../../util/Bot.js';
import { updateAllPages } from '../../util/UpdateTemplateParam.js';

const abilityPages = await client.getPagesInCategory('Character Abilities')

const abilities = await getFile<AvatarSkillData[]>('ExcelOutput/AvatarSkillConfig.json')

// the maximum level obtainable in-game for each type
const abilityMaxLevels = {
	'Basic ATK': 7,
	'Skill': 12,
	'Ultimate': 12,
	'Talent': 12,
	'Technique': 1,
	'Memosprite Skill': 7,
	'Memosprite Talent': 7,
	'Exclusive Effect': 1,
}

await updateAllPages('Ability Infobox', 'desc', 'updating desc', abilityPages, (pageName, currentParams) => {
	const abilityName = currentParams.title || pageName.replace(' (Ability)', '')
	const abilityType = currentParams.type
	const abilityMaxLevel = abilityMaxLevels[abilityType]
	const abilityMin = abilities.find(ability => ability.Level == 1 && textMap.getText(ability.SkillName) == abilityName)
	const abilityMax = abilities.find(ability => ability.Level == abilityMaxLevel && textMap.getText(ability.SkillName) == abilityName)
	if (!abilityMin || !abilityMax) {
		console.warn(`Could not find ability "${abilityName}"`)
		return currentParams.desc
	}
	return replaceUnderlinedEE(textMap.getText(abilityMax?.SkillDesc, abilityMin!.ParamList.map((param, i) => [param.Value, abilityMax!.ParamList[i].Value!])).replaceAll('\n', '<br />'), abilityMax?.ExtraEffectIDList!)
})