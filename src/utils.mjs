/**
 * @template T - type
 * @returns {{resolve: (value: T) => void; reject: (reason?: any) => void; promise: Promise<T>}}
 */
export function promiseWithResolvers() {
	let resolve, reject
	const promise = new Promise((res, rej) => {
		resolve = res
		reject = rej
	})
	return { resolve, reject, promise }
}

export async function once(ee, event, options) {
	const { resolve, reject, promise } = promiseWithResolvers()

	ee.addEventListener(event, resolve)

	const onAbort = () => {
		return reject(options?.signal?.reason)
	}

	options?.signal?.addEventListener('abort', reject, { once: true })

	try {
		return await promise
	} finally {
		options?.signal?.removeEventListener('abort', onAbort)
	}
}
