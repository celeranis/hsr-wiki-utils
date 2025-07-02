import { Worker } from 'worker_threads'

let workers: [Worker, boolean][] = []

export function parseJson<T>(data: string | Buffer, mode?: 'nobig' | 'big' | 'preprocess'): Promise<T> {
	return new Promise((resolve, reject) => {
		let workerIndex = workers.findIndex(([, active]) => !active)
		let parserWorker: Worker
		if (workerIndex != -1) {
			parserWorker = workers[workerIndex][0]
			workers[workerIndex][1] = true
		} else {
			parserWorker = new Worker('./src/util/JSONParser-Worker.js')
			workerIndex = workers.push([parserWorker, true]) - 1
		}
		
		parserWorker.once('message', async msg => {
			workers[workerIndex][1] = false
			if (msg.type == 'data') {
				resolve(msg.data)
			} else if (msg.type == 'error') {
				reject(msg.error)
			} else {
				console.warn('Got message of unknown type from parser worker:', data)
			}
		})
		
		parserWorker.postMessage({ type: 'parse', data: data.toString(), mode })
	})
}

export function teardown() {
	workers.forEach(([worker]) => worker.terminate())
}