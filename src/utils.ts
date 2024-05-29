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
	return { promise, resolve, reject };
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

export function forElementBySelector<T extends HTMLElement>(selector: string, amount = 1): Promise<T[]> {
	const { promise, resolve } = promiseWithResolvers<T[]>();

	let observer: MutationObserver | undefined;

	const resolver = () => {
		const element = Array.from(document.querySelectorAll<T>(selector));
		if (element.length >= amount) {
			observer?.disconnect();
			resolve(element);
			return true;
		}
		return false;
	};

	if (resolver()) return promise;
	observer = new MutationObserver(resolver);
	observer.observe(document.body, { childList: true, subtree: true });
	return promise;
}

export function relativeDateDiff(date1: Date, date2: Date) {
	const units = [
		{ unit: 'year', value: 365 * 24 * 60 * 60 },
		{ unit: 'month', value: 30 * 24 * 60 * 60 },
		{ unit: 'week', value: 7 * 24 * 60 * 60 },
		{ unit: 'day', value: 24 * 60 * 60 },
		{ unit: 'hour', value: 60 * 60 },
		{ unit: 'minute', value: 60 },
		{ unit: 'second', value: 1 },
	] as const;

	const diffInSeconds = (Number(date2) - Number(date1)) / 1000;

	for (const { unit, value } of units) {
		if (Math.abs(diffInSeconds) >= value) return { unit, difference: diffInSeconds / value };
	}

	throw new Error('unable to find unit');
}
