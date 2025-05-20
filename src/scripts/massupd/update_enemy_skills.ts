import { replaceUnderlinedEE } from '../../ExtraEffect.js';
import { getExcelFile } from '../../files/GameFile.js';
import { InternalMonsterSkill } from '../../files/Stage.js';
import { Enemy } from '../../Stage.js';
import { textMap } from '../../TextMap.js';
import { AWB } from '../../util/AWB.js';
import { client, retryIfRatelimit } from '../../util/Bot.js';

const enemyPages = await client.getPagesInCategory('Enemies')

const enemies = Enemy.loadAll()
const monsterSkills = await getExcelFile<InternalMonsterSkill>('MonsterSkillConfig.json', 'SkillID')

for (const enemyPage of enemyPages) {
	const enemy = enemies.find(enemy => enemy.name == enemyPage.replace(' (Boss)', ''))
	if (!enemy) {
		console.warn(`Unknown enemy "${enemyPage}"`)
		continue
	}
	
	await retryIfRatelimit(() => client.edit(enemyPage, async (rev) => {
		let content = rev.content
		const pageWikitext = new client.Wikitext(content)
		
		const skillTemplates = pageWikitext.parseTemplates({ namePredicate: n => n == 'Enemy Skills' })
		if (!skillTemplates || !skillTemplates.length) {
			console.warn(`Could not find skill template(s) on "${enemyPage}"`)
			return null as any
		}
		
		const enemySkillData = enemy.skill_list.map(skillId => monsterSkills[skillId])
		
		let leftoverSkills = enemySkillData.filter(skill => {
			let name = textMap.getText(skill.SkillName)
			if (!name) return false
			
			return !skillTemplates.find(template => template.parameters.find(param => typeof(param.name) == 'string' && param.name.startsWith('name') && param.value == name))
		})
		
		for (const skillTemplate of skillTemplates) {
			let templateContent = skillTemplate.wikitext
			for (const param of skillTemplate.parameters) {
				if (typeof(param.name) == 'number' || !param.name.startsWith('name')) continue
				
				let skillNum = Number(param.name.replace('name', '')) || 0
				
				let skill = enemySkillData.find(skill => textMap.getText(skill.SkillName) == param.value)
				
				if (!skill) {
					// console.log(`nothing matching ${param.value} name`)
					if (leftoverSkills.length == 1) {
						skill = leftoverSkills[0]
					} else {
						skill = leftoverSkills.find(skill => skill.SkillTriggerKey == `Skill${skillNum}`)
						if (!skill) {
							console.warn(`Could not find matching skill for "${param.value}" out of ${leftoverSkills.length} left over: ${leftoverSkills.map(s => textMap.getText(s.SkillName)).join('; ')}`)
							continue
						}
					}
				}
				
				let newDesc = replaceUnderlinedEE(textMap.getText(skill.SkillDesc, skill.ParamList), skill.ExtraEffectIDList).replaceAll('\n', '<br />')
				
				let descParam = skillTemplate.getParam(`desc${skillNum}`)
				
				let transformedCurrentDesc = descParam.value.replaceAll(/\s*'*\(.+?\)'*/g, '').replaceAll(/<ref.*?>.+?<\/ref>/gi, '')
				
				if (newDesc.replaceAll(/\s*'*\(.+?\)'*/g, '') == transformedCurrentDesc) {
					// console.log(`No changes to "${param.value}" in "${enemyPage}"`)
					continue
				}
				
				if (newDesc.replaceAll(/\s*'*\(.+?\)'*/g, '') == replaceUnderlinedEE(transformedCurrentDesc, skill.ExtraEffectIDList)) {
					newDesc = replaceUnderlinedEE(descParam.value, skill.ExtraEffectIDList)
				}
				
				let newParamWikitext = descParam.wikitext
					.replace(/=.+$/s, `= ${newDesc}${skill.ParamList.length ? ` [${skill.ParamList.map(v => v.Value).join(', ')}]` : ''}\n`)
					
				templateContent = templateContent.replace(descParam.wikitext, newParamWikitext)
				// console.log(descParam.wikitext, newParamWikitext)
			}
			
			if (templateContent != skillTemplate.wikitext) {
				content = content.replace(skillTemplate.wikitext, templateContent)
			}
		}
		
		if (rev.content == content) return null as any
		
		content = await AWB.viewDiff(rev.content, content)
		
		return { text: content, summary: 'updating desc' }
	}))
}