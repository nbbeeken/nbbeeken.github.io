let c;
do
  c=String.fromCodePoint(0x1f000+Math.random()*0x1000|0);
while(!c.match(/\p{Emoji}/u));

console.log('\n', c, '\n');
