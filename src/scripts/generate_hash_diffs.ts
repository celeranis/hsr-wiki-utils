import JSONbig from 'json-bigint';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import config from '../../config.json' with { "type": "json" };

const JSONB = JSONbig({ useNativeBigInt: true })

const IGNORE = [
	'RogueTalkNameColor.json'
]

if (!config.local_roots['3.0'] || !config.local_roots['3.1'] || !existsSync(config.local_roots['3.0']) || !existsSync(config.local_roots['3.1'])) {
	throw new Error(`This script requires valid local_roots defined in config.json for versions 3.0 and 3.1.`)
}

let collissions: string[] = []

const allFilesOld = readdirSync(config.local_roots['3.0'], { recursive: true, withFileTypes: true })
// const allFilesNew = await readdir(config.local_roots['3.1'], { recursive: true, withFileTypes: true })

const HASH_MAP: Record<string, number> = {}

function traverseObjectPair(obj0: object, obj1: object) {
	for (let [key, val0] of Object.entries(obj0)) {
		let val1 = obj1[key]
		if (!val0 || !val1) continue
		
		if (typeof(val0) == 'object' && typeof(val1) == 'object' && 'Hash' in val0 && 'Hash' in val1) {
			val0 = val0.Hash
			val1 = val1.Hash
		}
		
		if (typeof(val0) == 'number' && typeof(val1) == 'bigint') {
			let val1String = val1.toString()
			if (HASH_MAP[val1String] && HASH_MAP[val1String] != val0) {
				let coll = `Collission between ${val1String} → ${HASH_MAP[val1String]} and ${val0}`
				console.warn(coll)
				collissions.push(coll)
			}
			HASH_MAP[val1String] = val0
		} else if (typeof(val0) == 'object' && typeof(val1) == 'object') {
			traverseObjectPair(val0, val1)
		}
	}
}

function getMostCommonFirstKey(array: object[], ignore: string[] = []) {
	let counts: Record<string, number> = {}
	for (const obj of array) {
		for (const [key, val] of Object.entries(obj)) {
			if (!ignore.includes(key) && typeof(val) != 'object') {
				counts[key] = (counts[key] ?? 0) + 1
				break
			}
		}
	}
	let highest = 0
	let highestKey: string | undefined = undefined
	for (const [key, count] of Object.entries(counts)) {
		if (count > highest) {
			highest = count
			highestKey = key
		}
	}
	return highestKey
}

function excelArrayToTree(excel: object[]) {
	let firstKeys: string[] = []
	let hasDupe = true
	const tree = {}
	do {
		let nextKey = getMostCommonFirstKey(excel, firstKeys)
		if (!nextKey) {
			throw new TypeError('Failed to generate excel tree')
		}
		firstKeys.push(nextKey)
		
		hasDupe = false
		const pathSet = new Set<string>()
		for (const obj of excel) {
			const path = firstKeys.map(k => String(obj[k])).join('||')
			if (pathSet.has(path)) {
				hasDupe = true
				break
			} else {
				pathSet.add(path)
			}
		}
	} while (hasDupe)
	
	for (const obj of excel) {
		let currentBranch = tree
		for (const [i, key] of firstKeys.entries()) {
			if (i != firstKeys.length - 1) {
				currentBranch = (currentBranch[String(obj[key])] ??= {})
			} else {
				currentBranch[String(obj[key])] = obj
			}
		}
	}
	
	return tree
}

console.log('Starting...')

for (const [i, fileOld] of allFilesOld.entries()) {
	if (fileOld.parentPath.includes('TextMap') || !fileOld.isFile() || !fileOld.name.endsWith('.json') || IGNORE.includes(fileOld.name)) continue
	
	const pathOld  = `${fileOld.parentPath}/${fileOld.name}`
	const relative = path.relative(config.local_roots['3.0'], pathOld)
	const pathNew = `${config.local_roots['3.1']}/${relative}`

	console.log(`[${i}/${allFilesOld.length}] Starting ${relative}`)
	
	if (!existsSync(pathNew)) continue
	
	const jsonOld = readFileSync(pathOld).toString()
	const jsonNew = readFileSync(pathNew).toString()
	
	if (jsonOld == jsonNew || !jsonOld || !jsonNew) continue
	
	let dataOld = JSONB.parse(jsonOld)
	let dataNew = JSONB.parse(jsonNew)
	
	if (typeof(dataOld) != 'object' || typeof(dataNew) != 'object') continue
	
	if (relative.includes('ExcelOutput')) {
		dataOld = excelArrayToTree(dataOld)
		dataNew = excelArrayToTree(dataNew)
	}
	
	traverseObjectPair(dataOld, dataNew)
}

writeFileSync('./output/hash_diffs.json', JSONB.stringify(HASH_MAP))

collissions.forEach(coll => console.warn(coll))