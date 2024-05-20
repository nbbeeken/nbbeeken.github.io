export function promiseWithResolvers<T>(): {
	resolve: (value: T) => void;
	reject: (reason?: any) => void;
	promise: Promise<T>;
} {
	let resolve, reject;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	if (resolve == null) throw new Error('Promise constructor did not run synchronously');
	if (reject == null) throw new Error('Promise constructor did not run synchronously');
	return { resolve, reject, promise };
}

/** Turns an event emission into a promise. */
export async function once<T>(ee: EventTarget, event: string, options?: { signal?: AbortSignal }): Promise<T> {
	const { resolve, reject, promise } = promiseWithResolvers<T>();

	ee.addEventListener(event, resolve as any);

	/** @type {(() => void) | null} */
	let onAbort = null;

	options?.signal?.addEventListener('abort', (onAbort = () => reject(options?.signal?.reason)), { once: true });

	try {
		return await promise;
	} finally {
		ee.removeEventListener(event, resolve as any);
		if (onAbort != null) options?.signal?.removeEventListener('abort', onAbort);
	}
}
