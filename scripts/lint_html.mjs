import path from 'path';
import fs from 'fs';
import child_process from 'child_process';
import process from 'process';
import vnu from 'vnu-jar';

const blogFiles = fs
	.readdirSync('src/blog')
	.filter((f) => f.endsWith('.html'))
	.map((f) => path.join('src', 'blog', f));
const htmlFiles = [path.join('src', 'index.html'), path.join('src', 'resume.html'), ...blogFiles];

const commandArguments = ['-jar', `"${vnu}"`, '--format', 'json', '--stdout', '--exit-zero-always', ...htmlFiles]
const output = child_process.execFileSync(
	'java',
	commandArguments,
	{ shell: true, stdio: ['pipe'], encoding: 'utf8' },
);

const ignore = 'Trailing slash on void elements'.toLowerCase();

const { messages } = JSON.parse(output);

for (const message of messages) {
	if (message.message.toLowerCase().includes(ignore)) continue;

	process.exitCode = 1;

	const root = 'nbbeeken.github.io/';
	const fileName = message.url.slice(message.url.indexOf(root) + root.length);

	const locationIndicators = [];
	const firstLine = (message.firstLine ?? message.lastLine) + 1;
	locationIndicators.push(firstLine);
	if (firstLine !== message.lastLine + 1) locationIndicators.push(message.lastLine + 1);
	const location = `:${locationIndicators.join(':')}`;

	console.log(`${fileName}${location} - ${message.message}`);
}
