import fs from 'node:fs';

const keyBuffer = Buffer.from(fs.readFileSync('./secrets/key.txt', 'utf8').trim(), 'base64');

const key = await crypto.subtle.importKey('raw', keyBuffer, { name: 'AES-GCM' }, false, ['decrypt', 'encrypt']);

let encoded = fs.readFileSync(process.argv[2]);

const iv = crypto.getRandomValues(new Uint8Array(12));

const cipherText = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

const fd = fs.openSync(process.argv[3], 'w');
fs.writeFileSync(fd, iv);
fs.writeFileSync(fd, new Uint8Array(cipherText));
fs.closeSync(fd);
