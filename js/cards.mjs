import { log } from 'js/logger.mjs'
import { once, promiseWithResolvers } from 'js/utils.mjs'

const scanBtn = document.getElementById('scan')
const writeBtn = document.getElementById('write')
const scans = document.getElementById('scans')

const HEART = '\u2665'
const DIAMOND = '\u2666'
const SPADE = '\u2660'
const CLUB = '\u2663'
const JOKER = '\u{1F0CF}'
const randomCard = () => {
	const suit = [HEART, DIAMOND, SPADE, CLUB][Math.trunc(Math.random() * 4)]
	let rank = Math.trunc(Math.random() * 15)
	if (rank >= 11) {
		rank = {
			[11]: 'J',
			[12]: 'Q',
			[13]: 'K',
			[14]: 'A',
		}[rank]
	}
	return `${rank} ${suit}`
}

class ReadingError extends Error {}

class NFC {
	/** @private */
	controller
	/** @private */
	reader
	/** @private */
	listeners
	/** @private */
	readEvents = []
	/** @private */
	waitingReaders = []
	/** @public */
	errored = null

	constructor() {
		this.controller = new AbortController()
		this.reader = new NDEFReader()
		this.listeners = { reading: this.onReading.bind(this), readingerror: this.onReadingError.bind(this) }
		this.reader.addEventListener('reading', this.listeners.reading)
		this.reader.addEventListener('readingerror', this.listeners.readingerror)
	}

	static async create() {
		const nfc = new this()
		await nfc.reader.scan({ signal: nfc.controller.signal })
		return nfc
	}

	onReading(event) {
		if (this.waitingReaders.length) this.waitingReaders.shift().resolve(event)
		else this.readEvents.push(event)
	}

	onReadingError(cause) {
		this.controller.abort(new ReadingError('read failed!', { cause }))
	}

	async write() {
		writeBtn.setAttribute('disabled', 'true')
		/** @type {NDEFWriteOptions} */
		const options = {
			overwrite: true,
			signal: undefined,
		}

		/** @type {NDEFRecordInit} */
		const record = {
			recordType: 'text',
			mediaType: undefined,
			id: 'neal',
			encoding: 'utf-8',
			lang: 'en-US',
			data: randomCard(),
		}

		const message = {
			records: [record],
		}

		let read
		try {
			if (this.#currentScan == null) await this.scan()
			this.pendingWrite = true
			read = await once(this.nfc, 'reading')
			log(read)
			await this.nfc.write(message, options)
		} finally {
			this.pendingWrite = false
		}

		log(`wrote to tag!`)
		writeBtn.removeAttribute('disabled')

		const li = document.createElement('li')
		li.innerText = `W [${new Date().toLocaleTimeString()}] - ${record.data} - ${read.serialNumber}`
		scans.appendChild(li)
	}

	[Symbol.dispose]() {
		this.reader.removeEventListener('reading', this.listeners.reading)
		this.reader.removeEventListener('readingerror', this.listeners.readingerror)
	}

	async *[Symbol.asyncIterator]() {
		do {
			if (this.readEvents.length !== 0) {
				yield this.readEvents.shift()
			}

			if (this.readEvents.length === 0) {
				const { promise, ...rest } = promiseWithResolvers()
				this.waitingReaders.push(rest)
				yield await promise
			}
		} while (this.errored == null)
	}
}

const nfc = await NFC.create()

for await (const event of nfc) {
	log(event)
}

scanBtn?.addEventListener('click', nfc.scan.bind(nfc))
writeBtn?.addEventListener('click', nfc.write.bind(nfc))
