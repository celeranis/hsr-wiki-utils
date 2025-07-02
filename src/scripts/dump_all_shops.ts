import { writeFile } from 'fs/promises';
import { ChangeHistory } from '../ChangeHistory.js';
import { Item } from '../Item.js';
import { MappingInfo } from '../maps/MapingInfo.js';
import { Mission } from '../Mission.js';
import { sanitizeString, Version, VERSION_LIST, wikiTitle } from '../Shared.js';
import { Shop, ShopGood } from '../Shop.js';
import { TextMap } from '../TextMap.js';
import { pageInfoHeader } from '../util/General.js';
import { teardown } from '../util/JSONParser.js';
import { Template } from '../util/Template.js';

const iconMap = {
	Materials: 'Icon Shop Materials.png',
	LightCon: 'Icon Shop Light Cone Manifest.png',
	ChallengeStory: 'Icon Shop Jokes Come True.png',
	Drawcard01: 'Icon Shop Embers Exchange.png',
	Drawcard02: 'Icon Shop Starlight Exchange.png',
	World00Icon: 'Icon Shop World.png',
	World01Icon: 'Icon Shop World.png',
	World02Icon: 'Icon Shop World.png',
}

const mappingInfo = MappingInfo.loadAll()

const ShopVersions: [Version, Shop[]][] = []
for (const version of VERSION_LIST) {
	ShopVersions.push([version, await Shop.loadFromVersion(version)])
}
// await writeFile('./tmp/help.json', JSON.stringify(ShopVersions, null, '\t'))

function refreshDisplay(good: ShopGood, short?: boolean) {
	switch (good.refresh) {
		case 'DAILY':
			return short ? 'd' : 'daily'
		case 'WEEK':
			return short ? 'w' : 'weekly'
		case 'MONTH':
			return short ? 'm' : 'monthly'
		case 'CYCLE':
			return `${short ? 'E' : 'e'}very ${good.cycle_days} days`
		case undefined:
			return 'never'
		default:
			return `Unknown<!--${good.refresh}-->`
	}
}

for (const shop of await Shop.loadAll()) {
	const items = shop.getItems()
	
	if (!items.length) {
		console.warn(`${shop.name} appears to be empty, skipping...`)
		continue
	}
	
	const currencyMap = {}
	let showRefresh = false
	let showNotes = false
	let mainCurrency: (number | null) = null
	for (const item of items) {
		if (item.refresh) {
			showRefresh = true
		}
		if (item.condition_types) {
			showNotes = true
		}
		currencyMap[item.currency_id] = (currencyMap[item.currency_id] ?? 0) + 1
		if (item.currency_id != mainCurrency && (!mainCurrency || currencyMap[item.currency_id] > currencyMap[mainCurrency])) {
			mainCurrency = item.currency_id
		}
	}
	
	const mainCurrencyItem = Item.fromId(mainCurrency!)!
	
	const mapping = mappingInfo.find(entry => entry.name == shop.name)
	
	const internalIcon = shop.icon.match(/.+\/(.+?)\.png$/)?.[1]?.replace(/^Shop(.+)Icon/, '$1') ?? 'Unknown'
	const icon = iconMap[internalIcon] ?? `Icon Shop ${internalIcon}.png`
	
	const output: string[] = []
	
	const infobox = new Template('Location Infobox', {
		title: `{{Icon/White|${icon}}} ${shop.secondary_name}`,
		image: `Shop ${shop.name}.png`,
		type: 'Shop',
		world: '<!--to be added-->',
		region: '',
		area: '<!--to be added-->',
		subarea: ''
	})
	
	output.push(
		`<%-- [PAGE_INFO]`,
		`PageTitle=#${wikiTitle(shop.name, 'location')}#`,
		`[END_PAGE_INFO] --%>`,
		'{{Stub}}',
		infobox.block(8),
		`{{Description|${mapping?.desc ?? '{{tx}}'}}}`,
		`'''${shop.name}''' is a [[Shop]] located in <!--area--> on <!--world-->.`,
		'<!--',
		'It is operated by [[<shopkeeper>]].',
		'-->',
		'__TOC__',
		'',
		'==Inventory==',
		`{{Shop|shop=${shop.name}|currency=${mainCurrencyItem.name}${showRefresh ? '|refresh=1' : ''}${showNotes ? '|note=1' : ''}|total=1`
	)
	
	for (const item of items) {
		// console.log(item)
		const itemTitle = wikiTitle(item.item!.name, 'item', item.item_id)
		const args = [itemTitle]
		
		if (item.per_purchase && item.per_purchase != 1) {
			args.push(`x{{=}}${item.per_purchase}`)
		}
		
		if (itemTitle != item.item!.name) {
			args.push(`text{{=}}${item.item!.name}`)
		}
		
		args.push(item.price)
		
		if (item.discounted_price) {
			args.push(`discount{{=}}${item.discounted_price}`)
		}
		
		args.push(item.stock ?? 'inf')
		
		if (item.currency_id && item.currency_id != mainCurrency) {
			args.push(`currency{{=}}${Item.fromId(item.currency_id)?.name}`)
		}
		
		if (item.refresh) {
			args.push(`refresh{{=}}${refreshDisplay(item, true)}`)
		}
		
		if (item.condition_types) {
			const notes: string[] = []
			for (const [i, type] of item.condition_types.entries()) {
				if (!type) continue
				const args = item.condition_args![i]!
				switch (type) {
					case 'HasNoRefreshGoods':
						notes.push('after purchasing all limited items')
						break
					case 'Level':
						if (args[0] > 1) {
							notes.push(`at [[Trailblaze Level]] ${args[0]}`)
						}
						break
					case 'MainMission':
						const mission = Mission.fromId(args[0])
						notes.push(`after completing ${mission.link()}`)
						break
					case 'PreGoods':
						const preItem = items.find(item => item.goods_id == args[0])
						notes.push(`after purchasing all limited ${preItem?.item?.name ?? item.item!.name} stock`)
						break
					case 'ItemNum':
						if (args[0]) {
							notes.push(`if not yet owned`)
						} else {
							notes.push(`if less than ${args[0]} owned`)
						}
						break
					case 'EquipmentRankUpNum':
						notes.push(`if the associated Light Cone has not reached Superimposition V`)
						break
					case 'AvatarNum':
						notes.push(`if the character has not yet reached Eidolon Lv. 6`)
						break
					case 'FinishQuest':
						if (args[0] == 2200502) { // hardcoded for now
							notes.push(`after obtaining a {{Item|Silver Companion Spirit}} for the first time`)
							break
						}
					default:
						notes.push(`{{cx}}<!--${type}, ${args}-->`)
						break
				}
			}
			
			args.push(`note{{=}}Unlocks ${notes.join(', ')}`)
		}
		
		output.push(`|${args.join(' ;; ')}`)
	}
	
	output.push(
		'}}',
		'<!--',
		'==Location==',
		'{{Map Embed|<map name>|<marker id>}}',
		'--><!--',
		'==Achievements==',
		`{{Achievements by Category Table|topic=${shop.name}}}`,
		'-->',
		'==Other Languages==',
		await TextMap.generateOL(shop.name_hash),
		'',
		'==Change History==',
		`{{Change History|${(await ChangeHistory.shops.findAdded(shop.id))?.[0]}}}`
	)
	
	await writeFile(`./output/shops/${sanitizeString(shop.name)}-${shop.id}.wikitext`, output.join('\n'))
	
	const chOutput: string[] = []
	let lastShop: Shop | undefined = undefined
	let lastItems: ShopGood[] | undefined = undefined
	for (const [version, shops] of ShopVersions) {
		const thisShop = shops.find(oshop => oshop.id == shop.id)
		if (!thisShop || !thisShop.name) {
			if (shop.name == "Herta's Store") {
				console.log(version, thisShop?.id, thisShop?.name, thisShop?.name_hash)
			}
			continue
		}

		const oldItems = thisShop.getItems()
		
		if (oldItems.length == 0) continue
		
		if (!lastShop || !lastItems) {
			chOutput.unshift(`[[Version ${version}]]\n* ${thisShop.name} was released.`)
			lastShop = thisShop
			lastItems = oldItems
			continue
		}
		
		const entry: string[] = [`[[Version ${version}]]`]
		const added: ShopGood[] = []
		const removed: ShopGood[] = []
		const changed: string[] = []
		
		if (thisShop.name != lastShop.name) {
			changed.push(`* ${lastShop.name} was renamed to '''${thisShop.name}'''.`)
		}
		
		for (const item of oldItems) {
			const lastItem = lastItems.find(oitem => oitem.goods_id == item.goods_id)
			if (!lastItem) {
				added.push(item)
				continue
			}
			
			if (lastItem.stock != item.stock) {
				changed.push(`* Available ${item.item?.asItemTemplate()} stock was changed from ${lastItem.stock} to '''${item.stock}'''.`)
			}
			
			if (lastItem.refresh != item.refresh || lastItem.cycle_days != item.cycle_days) {
				if (!lastItem.refresh) {
					changed.push(`* ${item.item!.asItemTemplate()} stock now refreshes ${refreshDisplay(item)}.`)
				} else if (!item.refresh) {
					changed.push(`* ${item.item!.asItemTemplate()} stock no longer refreshes ${refreshDisplay(lastItem)}.`)
				} else {
					changed.push(`* ${item.item!.asItemTemplate()} stock refresh period was changed from ${refreshDisplay(lastItem)} to '''${refreshDisplay(item)}'''.`)
				}
			}
			
			if (lastItem.per_purchase != item.per_purchase) {
				changed.push(`* ${item.item!.asItemTemplate()} now grants '''${item.per_purchase}''' per purchase, from ${lastItem.per_purchase}.`)
			}
			
			if (lastItem.price != item.price) {
				changed.push(`* Changed the price of ${item.item?.asItemTemplate()} from ${lastItem.price} to '''${item.price}'''.`)
			}
		}
		
		for (const lastItem of lastItems) {
			const item = oldItems.find(oitem => oitem.goods_id == lastItem.goods_id)
			if (!item) {
				removed.push(lastItem)
				continue
			}
		}
		
		lastShop = thisShop
		lastItems = oldItems
		
		if (added.length == 0 && removed.length == 0 && changed.length == 0) continue
		
		if (added.length > 0) {
			let itemList = added
				.map(item => item.item?.asItemListEntry({ x: item.per_purchase }))
				.join('; ')
			
			if (itemList.endsWith('}')) itemList += ' '
				
			entry.push(`* Added items: {{Item List|${itemList.includes('=') ? '1=' : ''}${itemList}}}`)
		}
		
		if (removed.length > 0) {
			let itemList = removed
				.map(item => item.item?.asItemListEntry({ x: item.per_purchase, note: `Price: ${Item.fromId(item.currency_id)!.name}×${item.discounted_price ?? item.price}, Stock: ${item.stock ?? '∞'}${item.refresh ? `, Refresh: ${refreshDisplay(item)}` : ''}` }))
				.join('; ')

			if (itemList.endsWith('}')) itemList += ' '

			entry.push(`* Removed items: {{Item List|${itemList.includes('=') ? '1=' : ''}${itemList}}}`)
		}
		
		if (changed.length > 0) {
			entry.push(...changed)
		}
		
		chOutput.unshift(entry.join('\n'))
	}
	
	if (chOutput.length > 1) {
		const finalChOutput = `${pageInfoHeader(wikiTitle(shop.name, 'location') + '/Change History')}\n{{Change History/Header}}\n` + chOutput.join('\n----\n')
		await writeFile(`./output/shops/history/${sanitizeString(shop.name)}-${shop.id}.wikitext`, finalChOutput)
	}
}

teardown()