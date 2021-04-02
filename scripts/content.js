import path from 'path'
import { readFile, writeFile, readdir, copyFile, mkdir } from 'fs/promises'

const cwd = process.cwd()

try {
	await mkdir(path.join('public', 'images'), { recursive: true })
} catch {}

await copyFile('src/favicon.ico', 'public/favicon.ico')
await copyFile('src/index.html', 'public/index.html')
await copyFile('src/index.js', 'public/index.js')
await copyFile('src/index.css', 'public/index.css')

const images = await readdir('content/images')
for (const image of images) {
	await copyFile(`content/images/${image}`, `public/images/${image}`)
}

const posts = await readdir('content/posts')

const html5 = (content) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Document</title>
    <link rel="stylesheet" href="index.css" />
	<script async defer type="module" src="index.js"></script>
</head>
<body>
    <h1><a href="/">Neal</a></h1>
    ${content}
</body>
</html>`

await writeFile(
	path.join('public', 'blog.html'),
	html5(
		`<img height="48" width="48" src="images/blog.png" />
        <h2>Blog</h2>
        <nav style="flex-direction: column;justify-content: space-around;">
            ${posts.map((p) => `<a href="${p}">${p}</a>`).join('\n')}
        </nav>`
	)
)

for (const post of posts) {
	const contents = await readFile(path.join('content', 'posts', post))
	await writeFile(path.join('public', post), html5(contents))
}
