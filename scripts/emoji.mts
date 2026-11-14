const random = () => Number(crypto.getRandomValues(new BigUint64Array(1))[0] >> 11n) / 2**53;
let c;
do c = String.fromCodePoint((0x1f000 + random() * 0x1000) | 0);
while (!c.match(/\p{Emoji}/u));
process.stdout.write(c);
