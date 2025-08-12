@echo off

echo Running dump_all_consumables...
node --inspect --enable-source-maps src/scripts/dump_all_consumables

echo Running dump_all_items...
node --inspect --enable-source-maps src/scripts/dump_all_items

echo Running dump_all_readables...
node --inspect --enable-source-maps src/scripts/dump_all_readables

echo Running dump_all_shops...
node --inspect --enable-source-maps src/scripts/dump_all_shops

echo Running dump_extra_effects...
node --inspect --enable-source-maps src/scripts/dump_extra_effects

echo Running dump_all_tutorials...
node --inspect --enable-source-maps src/scripts/dump_all_tutorials

echo Running dump_audience_dice...
node --inspect --enable-source-maps src/scripts/dump_audience_dice

echo Running dump_curios...
node --inspect --enable-source-maps src/scripts/dump_curios

echo Running dump_equations...
node --inspect --enable-source-maps src/scripts/dump_equations

echo Running dump_loading_screens...
node --inspect --enable-source-maps src/scripts/dump_loading_screens

echo Running dump_messages...
node --inspect --enable-source-maps src/scripts/dump_messages

echo Running dump_relics...
node --inspect --enable-source-maps src/scripts/dump_relics

echo Running dump_scepters...
node --inspect --enable-source-maps src/scripts/dump_scepters

echo Running dump_su_stages...
node --inspect --enable-source-maps src/scripts/dump_su_stages

echo Running dump_und_secrets...
node --inspect --enable-source-maps src/scripts/dump_und_secrets

@REM echo Running dump_viac...
@REM node --inspect --enable-source-maps src/scripts/dump_viac

echo Running dump_weekly_du...
node --inspect --enable-source-maps src/scripts/dump_weekly_du

echo Running dump_odes...
node --inspect --enable-source-maps src/scripts/dump_odes

echo Running dump_boons...
node --inspect --enable-source-maps src/scripts/dump_boons

echo Running dump_occurrences...
pause
node --inspect --enable-source-maps src/scripts/dump_occurrences

echo Running dump_talksentences...
pause
node --inspect --enable-source-maps src/scripts/dump_talksentences

@REM echo Running dump_value_hashes...
@REM pause
@REM node --inspect --enable-source-maps src/scripts/dump_value_hashes

echo Running dump_vo_names...
node --inspect --enable-source-maps src/scripts/vo/dump_vo_names

echo Running dump_sound_events...
pause
node --inspect --enable-source-maps src/scripts/vo/dump_sound_events

echo Running dump_missions...
pause
node --inspect --enable-source-maps src/scripts/dump_missions --no-dialogue

echo All done!