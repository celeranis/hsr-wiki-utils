import { existsSync, readFileSync, writeFileSync } from 'fs';
import { TextMap } from '../TextMap.js';
const VERSION_COMMITS = {
    '1.0': '4a36e628f9f34e6221b167b6ae0235a2f3934330',
    '1.1': '1ab86f99405026f6c9b1be98661a584e1a38a0df',
    '1.2': '900fa36177ffd66e7d70d2c21276c5bc0662212d',
    '1.3': 'aa811519a5de772bf4055e8ea8b9254f90b7746c',
    '1.4': '6acdba35cbf80adc100dbde528b1c271f50dcb9d',
    '1.5': '59d64be43a1da285cf22ba9be5ed90ef2b23f857',
};
const FILENAMES = {
    'SpriteOutput/Rogue/RandomEvent/Horizon/RoguePicEventDLC_01.png': 'Trailblaze Secret 1.png',
    'SpriteOutput/Rogue/RandomEvent/Horizon/RoguePicEventDLC_02.png': 'Trailblaze Secret 2.png',
    'SpriteOutput/Rogue/RandomEvent/Horizon/RoguePicEventDLC_03.png': 'Trailblaze Secret 3.png',
    'SpriteOutput/Rogue/RandomEvent/Horizon/RoguePicEventDLC_04.png': 'Trailblaze Secret 4.png',
    'SpriteOutput/Rogue/RandomEvent/Horizon/RoguePicEventDLC_05.png': 'Trailblaze Secret 5.png',
    'SpriteOutput/Rogue/RandomEvent/Horizon/RoguePicEventDLC_06.png': 'Trailblaze Secret 6.png',
};
const version = '1.5';
const textMap = new TextMap(version);
const substories = JSON.parse(readFileSync(`./versions/${version}/RogueDLCSubStory.json`).toString());
const eventNamesJson = JSON.parse(readFileSync(`./versions/${version}/RogueTalkNameConfig.json`).toString());
const eventNpcsJson = JSON.parse(readFileSync(`./versions/${version}/RogueNPCDialogue.json`).toString());
const eventInfoJson = JSON.parse(readFileSync(`./versions/${version}/DialogueEvent.json`).toString());
const eventDisplayJson = existsSync(`./versions/${version}/DialogueEventDisplay.json`) ? JSON.parse(readFileSync(`./versions/${version}/DialogueEventDisplay.json`).toString()) : {};
const talkSentences = JSON.parse(readFileSync(`./versions/${version}/TalkSentenceConfig.json`).toString());
const eventNames = new Map();
const eventText = new Map();
const eventOptions = new Map();
function getSentence(sentenceId) {
    const sentence = talkSentences[sentenceId];
    if (!sentence)
        console.log(sentenceId, sentence);
    return `'''${textMap.getText(sentence.TextmapTalkSentenceName)}:''' ${textMap.getText(sentence.TalkSentenceText)}`;
}
function findType(type, dialog) {
    return dialog.find(task => task.$type == type);
}
function findCustomString(customString, sequences) {
    return sequences.find(sequence => findType('RPG.GameCore.WaitCustomString', sequence.TaskList)?.CustomString?.Value == customString)?.TaskList;
}
function pathIcon(pathName) {
    if (pathName == 'TheHunt')
        pathName = 'The Hunt';
    return `{{Icon/Dark|Path ${pathName} Small.png|20}}`;
}
const finalOutput = [];
finalOutput.push('==Simulated Universe: Swarm Disaster==');
for (const [ssid, substory] of Object.entries(substories)) {
    const storyOutput = [];
    const dialog = await fetch(`https://raw.githubusercontent.com/Dimbreath/StarRailData/${VERSION_COMMITS[version]}/${substory.LevelGraphPath}`).then(res => res.json());
    // console.log(dialog)
    const startingSequence = dialog.OnStartSequece[0];
    const npcId = findType('RPG.GameCore.ShowRogueTalkBg', startingSequence.TaskList)?.TalkBgID;
    if (!npcId) {
        console.trace(dialog);
        continue;
    }
    const npc = eventNamesJson[npcId.toString()];
    if (!npc) {
        console.trace(startingSequence.TaskList);
        continue;
    }
    const eventName = textMap.getText(npc.Name);
    storyOutput.push(`===${eventName}===`, `[[File:${FILENAMES[substory.ImgPath]}|thumb|right|175px]]`, '{{Dialogue_Start}}');
    function addText(tasks, indent) {
        for (const task of tasks) {
            if (task.$type == 'RPG.GameCore.PlayAndWaitRogueSimpleTalk') {
                storyOutput.push(...task.SimpleTalkList.map(talk => ':'.repeat(indent) + getSentence(talk.TalkSentenceID)));
            }
            else if (task.$type == 'RPG.GameCore.PlayRogueOptionTalk') {
                storyOutput.push(':'.repeat(indent) + '{{DIcon|Arrow}} Select');
                let allSame = undefined;
                for (const option of task.OptionList) {
                    const ievent = eventInfoJson[option.DialogueEventID];
                    const devent = eventDisplayJson[ievent.EventDisplayID];
                    storyOutput.push(`${':'.repeat(indent + 1)}${ievent.AeonOption ? pathIcon(ievent.AeonOption) : '{{DIcon|Star}}'} ${textMap.getText(devent.EventTitle)} &mdash; ${textMap.getText(devent.EventDesc)}`);
                    if (option.TriggerCustomString) {
                        const branch = findCustomString(option.TriggerCustomString, dialog.OnStartSequece);
                        if (branch) {
                            if (task.OptionList.find(opt => opt.TriggerCustomString != option.TriggerCustomString)) {
                                addText(branch, indent + 2);
                            }
                            else {
                                allSame = branch;
                            }
                        }
                    }
                }
                if (allSame)
                    addText(allSame, indent);
            }
            else if (task.$type == 'RPG.GameCore.TriggerCustomString') {
                const branch = findCustomString(task.CustomString.Value, dialog.OnStartSequece);
                if (branch) {
                    const existing = dialog.OnStartSequece.toReversed().find(seq => seq.TaskList == tasks || seq.TaskList.find(otask => otask.$type == 'RPG.GameCore.TriggerCustomString' && otask.CustomString.Value == task.CustomString.Value))?.TaskList;
                    console.log(existing);
                    if (existing == tasks) {
                        addText(branch, 1);
                    }
                }
            }
        }
    }
    addText(startingSequence.TaskList, 1);
    storyOutput.push('{{Dialogue_End}}');
    finalOutput.push(storyOutput.join('\n'));
}
writeFileSync('./output/trailblaze_secrets.txt', finalOutput.join('\n\n'));
