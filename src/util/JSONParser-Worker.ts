import JSONbig_package from 'json-bigint';
import { parentPort } from 'worker_threads';

const JSONbig = JSONbig_package({
	useNativeBigInt: true,
})

if (parentPort == null) {
	throw new Error('This module should be loaded as a worker.')
}

function preprocessFile(obj: any) {
	for (const [key, value] of Object.entries(obj)) {
		if (value && typeof value == 'object') {
			preprocessFile(value)
		} else if (key == 'Value' && typeof value == 'number') {
			// round suspected floating point errors to integers
			const decimal = value % 1
			if (decimal != 0 && (decimal < 0.001 || decimal > 0.999)) {
				obj[key] = Math.round(value)
			}
		}
	}
	return obj
}

parentPort.on('message', msg => {
	if (msg.type == 'parse') {
		try {
			let parsedData = (msg.mode == 'nobig' ? JSON : JSONbig).parse(msg.data);
			if (msg.mode == 'preprocess') {
				parsedData = preprocessFile(parsedData)
			}
			parentPort!.postMessage({ type: 'data', data: parsedData });
		} catch (error) {
			parentPort!.postMessage({ type: 'error', error });
		}
	}
})