/// <reference types="./web-nfc.d.ts">

import { once, promiseWithResolvers } from '../utils.js';

const log = console.log.bind(console);

const scanBtn = document.getElementById('scan')!;
const writeBtn = document.getElementById('write')!;
const scans = document.getElementById('scans')!;
let cardTemplate: HTMLTemplateElement | null = null;

const HEART = '\u2665';
const DIAMOND = '\u2666';
const SPADE = '\u2660';
const CLUB = '\u2663';
const JOKER = '\u{1F0CF}';
const randomCard = () => {
	const suit = [HEART, DIAMOND, SPADE, CLUB][Math.trunc(Math.random() * 4)];
	/** @type {string | number} */
	let rank = `${Math.trunc(Math.random() * 15)}`;
	if (+rank >= 11) {
		rank = { '11': 'J', '12': 'Q', '13': 'K', '14': 'A' }[rank] ?? rank;
	}
	return `${rank} ${suit}`;
};

class ReadingError extends Error {}

const decoder = new TextDecoder('utf-8', { fatal: true });

class NFC {
	public controller;
	private reader: NDEFReader;
	private listeners;
	private readEvents: Event[] = [];
	private waitingReaders: { resolve: (value: NDEFReadingEvent) => void; reject: (reason?: any) => void }[] = [];
	public errored = null;
	private pendingWrite: boolean = false;

	constructor() {
		this.controller = new AbortController();
		this.reader = new NDEFReader();
		this.listeners = { reading: this.onReading.bind(this), readingerror: this.onReadingError.bind(this) };
		this.reader.addEventListener('reading', this.listeners.reading);
		this.reader.addEventListener('readingerror', this.listeners.readingerror);
	}

	static async create() {
		const nfc = new this();
		await nfc.reader.scan({ signal: nfc.controller.signal });
		return nfc;
	}

	onReading(event: NDEFReadingEvent) {
		if (this.waitingReaders.length) this.waitingReaders.shift()?.resolve(event);
		else this.readEvents.push(event);

		const li = document.createElement('li');
		const cardText = decoder.decode(event.message.records[0].data);
		this.showCard(cardText);
		li.innerText = `R [${new Date().toLocaleTimeString()}] - ${cardText} - ${event.serialNumber}`;
		scans?.appendChild(li);
	}

	onReadingError(cause: Event) {
		this.controller.abort(new ReadingError('read failed!', { cause }));
	}

	async write() {
		writeBtn?.setAttribute('disabled', 'true');
		/** @type {NDEFWriteOptions} */
		const options = {
			overwrite: true,
			signal: undefined,
		};

		const record: NDEFRecordInit = {
			recordType: 'text',
			mediaType: undefined,
			id: 'neal',
			encoding: 'utf-8',
			lang: 'en-US',
			data: randomCard(),
		};

		const message = {
			records: [record],
		};

		let read: NDEFReadingEvent;
		try {
			this.pendingWrite = true;
			read = await once(this.reader, 'reading');
			log(read);
			await this.reader.write(message, options);
		} finally {
			this.pendingWrite = false;
		}

		log(`wrote to tag!`);
		writeBtn?.removeAttribute('disabled');

		const li = document.createElement('li');
		li.innerText = `W [${new Date().toLocaleTimeString()}] - ${record.data} - ${read.serialNumber}`;
		scans?.appendChild(li);
	}

	[Symbol.dispose]() {
		this.reader.removeEventListener('reading', this.listeners.reading as any);
		this.reader.removeEventListener('readingerror', this.listeners.readingerror);
	}

	async *[Symbol.asyncIterator]() {
		do {
			if (this.readEvents.length !== 0) {
				yield this.readEvents.shift();
			}

			if (this.readEvents.length === 0) {
				const { promise, ...rest } = promiseWithResolvers<NDEFReadingEvent>();
				this.waitingReaders.push(rest);
				yield await promise;
			}
		} while (this.errored == null);
	}

	showCard(this: void, text: string) {
		cardTemplate ??= document.getElementById('card-template') as HTMLTemplateElement;
		const card = cardTemplate.content.cloneNode(true) as DocumentFragment;
		card.querySelector('h2')!.textContent = text;
		document.body.appendChild(card);
		setTimeout(() => {
			const cards = Array.from(document.querySelectorAll('.playingcard'));
			for (const card of cards) card.classList.add('is-deleting');
			setTimeout(() => {
				for (const card of cards) card.remove();
			}, 500);
		}, 3000);
	}
}

let enabled = false;
let nfc: NFC | null = null;
let writeListener: EventListener | null = null;
scanBtn?.addEventListener('click', async () => {
	if (enabled) {
		enabled = !enabled;

		nfc?.controller.abort(new Error('off'));
		nfc = null;
		scanBtn?.classList.remove('pulse');
		if (scanBtn) scanBtn.innerText = 'Start scan \u{1f4f4}';

		if (writeListener) writeBtn.removeEventListener('click', writeListener);
		writeListener = null;
	} else {
		enabled = !enabled;

		nfc = await NFC.create();

		writeBtn.addEventListener('click', (writeListener = nfc?.write.bind(nfc)));

		if (scanBtn) scanBtn.innerText = 'NFC is on \u{1F4E1}';
		scanBtn?.classList.add('pulse');

		for await (const event of nfc) {
			log(event);
		}
	}
});
