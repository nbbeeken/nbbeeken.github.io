import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '../../src');
const PORT = process.env.PORT ?? 8080;

const MIME = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.webp': 'image/webp',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon',
	'.woff2': 'font/woff2',
	'.woff': 'font/woff2',
	'.json': 'application/json',
};

const server = createServer(async (req, res) => {
	let pathname = new URL(req.url, 'http://localhost').pathname;
	if (pathname.endsWith('/')) pathname += 'index.html';

	const filePath = join(ROOT, pathname);
	try {
		const data = await readFile(filePath);
		res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
		res.end(data);
	} catch {
		res.writeHead(404, { 'Content-Type': 'text/plain' });
		res.end('404 Not Found');
	}
});

server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
