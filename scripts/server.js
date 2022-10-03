//@ts-check
import { readFile } from 'fs/promises'
import http from 'http'
import path from 'path'
import { on } from 'events'

const server = http.createServer()
server.listen(8080, 'localhost', 128, () => console.log('Listening on http://localhost:8080'))

const DEFAULT_MIME = 'text/plain'

const MIME_TYPE = new Map([
	['js', 'application/javascript'],
	['wasm', 'application/wasm'],
	['css', 'text/css'],
	['map', 'application/json'],
	['json', 'application/json'],
	['html', 'application/xhtml+xml'],
	['woff2', 'font/woff2'],
])

async function main() {
	for await (const [request, response] of on(server, 'request')) {
		const url = new URL(request.url, `http://${request.headers.host}`)

		console.log(request.method, url.pathname)

		try {
			if (url.pathname === '/') {
				response.setHeader('content-type', MIME_TYPE.get('html'))
				response.end(await readFile('index.html'), 'utf8')
				continue
			} else {
				const fileData = await readFile(url.pathname.slice(1))

				// Get the extension
				const fileParts = url.pathname.split('.')
				const fileExtension = fileParts[fileParts.length - 1]

				response.setHeader('content-type', MIME_TYPE.get(fileExtension) ?? DEFAULT_MIME)
				response.end(fileData)
			}
		} catch (error) {
			response.statusCode = 500
			response.end(`Bad Request: ${error}`, 'utf8')
		}
	}
}

main()
	.then(() => console.log('end'))
	.catch((e) => console.log(e))
	.finally(() => server.close())
