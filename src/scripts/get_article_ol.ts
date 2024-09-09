import { program } from 'commander';

program.argument('<articleId>')

const articleId = program.parse().args[0]

const result = await (await fetch(`https://bbs-api-os.hoyolab.com/community/post/wapi/getPostFull?post_id=${articleId}&read=1&scene=1`)).json()

const langs = result.data.post.post.multi_language_info.lang_subject

console.log(`
{{Other Languages
|en   = ${langs['en-us']}
|zhs  = ${langs['zh-cn']}
|zht  = ${langs['zh-tw']}
|ja   = ${langs['ja-jp']}
|ko   = ${langs['ko-kr']}
|es   = ${langs['es-es']}
|fr   = ${langs['fr-fr']}
|ru   = ${langs['ru-ru']}
|th   = ${langs['th-th']}
|vi   = ${langs['vi-vn']}
|de   = ${langs['de-de']}
|id   = ${langs['id-id']}
|pt   = ${langs['pt-pt']}
}}
`)