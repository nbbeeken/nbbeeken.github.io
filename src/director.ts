import { toast } from './utils';

const reader = new NDEFReader();
const scanBtn = document.getElementById('lock')!;

//@ts-ignore
navigator.permissions.query({ name: 'nfc' }).then(async (nfcPermissionStatus) => {
	if (nfcPermissionStatus.state === 'granted') {
		await startScanning();
	} else {
		scanBtn.onclick = startScanning;
	}
});

async function startScanning() {
	toast('seeking: \uD83D\uDD11');
	scanBtn.innerText = '\uD83D\uDD11';
	reader.addEventListener('reading', async (event) => {
		scanBtn.hidden = true;
		const [record] = event.message.records;
		if (record.recordType !== 'text') return;
		const string = new TextDecoder('utf-8').decode(new Uint8Array(record.data!.buffer));
		const { key } = JSON.parse(string);
		const imgData = await decrypt(key, usImgURL);
		makeImage(imgData);
	});
	reader.addEventListener('readingerror', (cause) => {
		toast(cause);
	});
	scanBtn?.classList.add('pulse');
	const p = reader.scan();
	await p;
}

const usImgURL = new URL('./images/us.jpg', import.meta.url);

async function decrypt(keyBase64: string, imageURL: URL): Promise<ArrayBuffer> {
	const keyBuffer = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0)).buffer;

	const response = await fetch(imageURL);

	if (!response.ok) {
		toast('No response: ' + response.status);
		throw new Error('bad response!');
	}

	const encryptedData = await response.arrayBuffer();

	const iv = encryptedData.slice(0, 12); // AES-GCM standard IV size is 12 bytes
	const cipherText = encryptedData.slice(12);

	const key = await crypto.subtle.importKey('raw', keyBuffer, { name: 'AES-GCM' }, false, ['decrypt']);

	const decryptedData = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherText);

	return decryptedData;
}

function makeImage(decryptedData: ArrayBuffer) {
	const blob = new Blob([decryptedData], { type: 'image/jpeg' });
	const imageUrl = URL.createObjectURL(blob);
	const img = document.createElement('img');
	img.src = imageUrl;
	img.alt = 'Decrypted Image';
	img.style.maxWidth = '100%';
	document.body.appendChild(img);
}
