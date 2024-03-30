import path from 'path';
import fs from 'fs';
import child_process from 'child_process';
import process from 'process';
import vnu from 'vnu-jar';

const blogFiles = fs.readdirSync('blog').filter(f => f.endsWith('.html')).map(f => path.join('blog', f))
const htmlFiles = ['index.html', 'resume.html', ...blogFiles]

try {
    child_process.execFileSync('java', ['-jar', `"${vnu}"`, ...htmlFiles], { shell: true, stdio: 'inherit', encoding: 'utf8' });
    process.exitCode = 0;
} catch (error) {
    process.exitCode = 1;
}
