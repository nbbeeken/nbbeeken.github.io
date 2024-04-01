
async function once(ee, event, options) {
  const { resolve, promise } = Promise.withResolvers();

  ee.addEventListener(event, resolve);

  const onAbort = () => {
    return reject(options?.signal?.reason)
  }

  options?.signal?.addEventListener('abort', reject, { once: true })

  try {
    return await promise;
  } finally {
    options?.signal?.removeEventListener('abort', onAbort)
  }
}

function log(...args) {
  if (log.LOGGING === true) return console.log(...args);
}
log.LOGGING = false;

const scanBtn = document.getElementById('scan');
const writeBtn = document.getElementById('write');
/** @type {HTMLUListElement} */
const scans = document.getElementById('scans');

const HEART = '\u2665'
const DIAMOND = '\u2666'
const SPADE = '\u2660'
const CLUB = '\u2663'
const JOKER = '\u{1F0CF}'
const randomCard = () => {
  const suit = [HEART, DIAMOND, SPADE, CLUB][Math.trunc(Math.random() * 4)];
  let rank = Math.trunc(Math.random() * 15);
  if (rank >= 11) {
    rank = {
      [11]: 'J',
      [12]: 'Q',
      [13]: 'K',
      [14]: 'A',
    }[rank]
  }
  return `${rank} ${suit}`;
}

class NFC {
  #currentScan;
  /** @type {AbortController} */
  #scanCtr;
  /** @type {NDEFReader} */
  nfc;

  constructor() {
    this.nfc = new NDEFReader()
    this.nfc.addEventListener('reading', this.onReading.bind(this));
    this.nfc.addEventListener('readingerror', this.onReadingError.bind(this));
  }

  onReading(event) {
    if (this.pendingWrite) return;

    log('reading event', event)
    const li = document.createElement('li');
    const r = event.message.records[0]
    const rPlain = {
      recordType: r.record,
      mediaType: r.media,
      id: r.id,
      data: new TextDecoder(r.encoding).decode(r.data.buffer),
      encoding: r.encoding,
      lang: r.lang,
    }
    li.innerText = `R [${(new Date()).toLocaleTimeString()}] - ${rPlain.data} - ${event.serialNumber}`
    scans.appendChild(li)
  }

  onReadingError(event) {
    this.#scanCtr.abort(new Error('read failed!'))
    log('reading error event', event)
  }

  async scan() {
    if (this.#currentScan == null) {
      this.#scanCtr?.abort(new Error('interrupting previous scan... should never happen'))
      this.#scanCtr = new AbortController()
      this.#currentScan = this.nfc.scan({ signal: this.#scanCtr.signal });
      await this.#currentScan;
      scanBtn.innerText = 'Stop scan \u{1F4E1}'
      scanBtn.classList.add('pulse');
      log('kicked off scan!')
    } else {
      this.#scanCtr.abort(new Error('stop the scan!'));
      this.#currentScan = null;
      scanBtn.innerText = 'Start scan \u{1F4F4}'
      scanBtn.classList.remove('pulse')
      log('killed scan!')
    }
  }

  async write() {
    writeBtn.setAttribute('disabled', 'true');
    /** @type {NDEFWriteOptions} */
    const options = {
      overwrite: true,
      signal: undefined,
    };

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
      records: [record]
    }

    let read;
    try {
      if (this.#currentScan == null) await this.scan();
      this.pendingWrite = true;
      read = await once(this.nfc, 'reading');
      log(read)
      await this.nfc.write(message, options)
    } finally {
      this.pendingWrite = false;
    }


    log(`wrote to tag!`)
    writeBtn.removeAttribute('disabled');

    const li = document.createElement('li');
    li.innerText = `W [${(new Date()).toLocaleTimeString()}] - ${record.data} - ${read.serialNumber}`
    scans.appendChild(li)
  }
}

const nfc = new NFC()
scanBtn?.addEventListener('click', nfc.scan.bind(nfc))
writeBtn?.addEventListener('click', nfc.write.bind(nfc))
