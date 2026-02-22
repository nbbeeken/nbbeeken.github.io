const indicator = document.createElement('div');
indicator.textContent = 'Print preview (P to exit)';
indicator.style.cssText =
	'position:fixed;bottom:1rem;right:1rem;background:#333;color:#fff;padding:0.3em 0.7em;font-size:0.8rem;border-radius:4px;opacity:0.85;pointer-events:none';
indicator.hidden = true;
document.body.appendChild(indicator);

let printPreview = false;
const flipped: CSSMediaRule[] = [];

document.addEventListener('keydown', (e) => {
	if (e.key !== 'p' || e.ctrlKey || e.metaKey) return;
	if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

	printPreview = !printPreview;

	if (printPreview) {
		for (const sheet of document.styleSheets) {
			for (const rule of sheet.cssRules) {
				if (rule instanceof CSSMediaRule && rule.media.mediaText === 'print') {
					rule.media.deleteMedium('print');
					rule.media.appendMedium('screen');
					flipped.push(rule);
				}
			}
		}
	} else {
		for (const rule of flipped) {
			rule.media.deleteMedium('screen');
			rule.media.appendMedium('print');
		}
		flipped.length = 0;
	}

	indicator.hidden = !printPreview;
});
