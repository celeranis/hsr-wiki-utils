import { writeFile } from 'fs/promises';
import { ChangeHistory } from '../ChangeHistory.js';
import { Dictionary, VERSION_LIST } from '../Shared.js';
import { PlaneEvent, Stage, StageConfig } from '../Stage.js';
import { teardown } from '../util/JSONParser.js';

const stageIds = Object.values(StageConfig)
	.filter(stageData => stageData.StageType == 'VerseSimulation')
	.map(data => data.StageID)

const output: string[] = []
const addedDate: Dictionary<[string]> = {}

for (const version of VERSION_LIST) {
	console.log(version)
	const versionStages: string[] = []
	
	for (const stageId of stageIds) {
		const [versionAdded] = addedDate[stageId] ?? await ChangeHistory.stage.findAdded(stageId)
		addedDate[stageId] = [versionAdded]
		if (versionAdded != version) continue
		if (!Object.values(PlaneEvent).find(event => event.StageID == stageId && event.WorldLevel == 6)) continue
		
		const stage = new Stage(stageId)
		versionStages.push(
			`<pre>\nStage ID = ${stage.id}\nStage Abilities = ${stage.stage_abilities.join(', ')}\nStage Data = ${Object.entries(stage.params).map(([k, v]) => `${k} = ${v}`).join(', ')}\nVersion = ${version}\n</pre>`,
			stage.asEnemyLists().join('\n'),
			'',
		)
	}
	
	if (versionStages.length > 0) {
		output.push(
			`==${version}==`,
			...versionStages
		)
	}
}

await writeFile('./output/su-stages.wikitext', output.join('\n'))

teardown()