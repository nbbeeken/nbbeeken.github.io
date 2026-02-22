import { forElementBySelector, relativeDateDiff } from './utils.mjs';

const rtf = new Intl.RelativeTimeFormat('en', {
	localeMatcher: 'best fit',
	numeric: 'always',
	style: 'long',
});

forElementBySelector<HTMLSpanElement>('#time-at-mongodb').then(([span]) => {
	const today = new Date();
	const startDate = new Date(2020, 0, 27, 0, 0, 0, 0);
	const distance = today.getFullYear() - startDate.getFullYear();

	span.innerText = rtf.format(-distance, 'year');
});

forElementBySelector<HTMLTimeElement>('time').then((times) => {
	for (const time of times) {
		const dateInTime = new Date(time.innerText);
		const { difference, unit } = relativeDateDiff(new Date(), dateInTime);
		time.setAttribute('title', rtf.format(Math.trunc(difference), unit));
	}
});
