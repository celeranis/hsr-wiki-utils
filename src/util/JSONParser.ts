import { Worker } from 'worker_threads'

let workers: [Worker, number][] = []
const MAX_WORKERS = 25
const DEBUG_MAX = false

export function parseJson<T>(data: string | Buffer, mode?: 'nobig' | 'big' | 'preprocess'): Promise<T> {
	return new Promise((resolve, reject) => {
		let firstCount = workers[0]?.[1]
		let workerIndex = workers.findIndex(([, activeCount]) => activeCount < firstCount)
		let parserWorker: Worker
		
		if (workerIndex == -1 && workers.length >= MAX_WORKERS) {
			workerIndex = 0
			if (DEBUG_MAX) {
				console.trace('Active JSONParser worker count exceeds maximum')
			}
		}
		
		if (workerIndex != -1) {
			parserWorker = workers[workerIndex][0]
			workers[workerIndex][1] += 1
		} else {
			parserWorker = new Worker('./src/util/JSONParser-Worker.js')
			workerIndex = workers.push([parserWorker, 1]) - 1
		}
		
		parserWorker.setMaxListeners(workers[workerIndex][1])
		
		let id = (Date.now() + Math.random()).toString()
		
		const messageHandler = async (msg: any) => {
			if (msg.id != id) return
			workers[workerIndex][1] -= 1
			parserWorker.removeListener('message', messageHandler)
			parserWorker.setMaxListeners(workers[workerIndex][1])
			if (msg.type == 'data') {
				resolve(msg.data)
			} else if (msg.type == 'error') {
				reject(msg.error)
			} else {
				console.warn('Got message of unknown type from parser worker:', data)
			}
		}
		
		parserWorker.on('message', messageHandler)
		
		parserWorker.postMessage({ type: 'parse', data: data.toString(), mode, id })
	})
}

export function teardown() {
	workers.forEach(([worker]) => worker.terminate())
}