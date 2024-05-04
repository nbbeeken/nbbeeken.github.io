export function log(...args) {
	if (log.LOGGING === true) return console.log(...args)
}
log.LOGGING = false
