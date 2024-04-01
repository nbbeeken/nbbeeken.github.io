import path from 'path';
import fs from 'fs';
import child_process from 'child_process';
import process from 'process';
import vnu from 'vnu-jar';

const blogFiles = fs.readdirSync('blog').filter(f => f.endsWith('.html')).map(f => path.join('blog', f))
const htmlFiles = ['index.html', 'resume.html', ...blogFiles]

const output = child_process.execFileSync('java', [
    '-jar',
    `"${vnu}"`,
    '--format', 'json',
    '--stdout',
    '--exit-zero-always',
    ...htmlFiles
], { shell: true, stdio: ['pipe'], encoding: 'utf8' });

const { messages } = JSON.parse(output);

for (const message of messages) {
    process.exitCode = 1;

    const root = 'nbbeeken.github.io/'
    const fileName = message.url.slice(message.url.indexOf(root) + root.length)

    const locationIndicators = []
    const firstLine = (message.firstLine ?? message.lastLine) + 1
    locationIndicators.push(firstLine);
    if (firstLine !== message.lastLine + 1) locationIndicators.push(message.lastLine + 1);
    const location = `:${locationIndicators.join(':')}`

    console.log(`${fileName}${location} - ${message.message}`)
}
