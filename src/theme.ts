import { forElementBySelector } from './utils';

async function setupThemeSwitch() {
	const themeSwitch = await forElementBySelector<HTMLInputElement>('#theme-switch');
	const currentTheme = localStorage.getItem('theme');

	if (matchMedia('(prefers-color-scheme: dark)').matches || currentTheme === 'dark') {
		themeSwitch.checked = true;
		document.documentElement.setAttribute('data-theme', 'dark');
		localStorage.setItem('theme', 'dark');
	}

	const themeChange = () => {
		if (themeSwitch.checked) {
			document.documentElement.setAttribute('data-theme', 'dark');
			localStorage.setItem('theme', 'dark');
		} else {
			document.documentElement.setAttribute('data-theme', 'light');
			localStorage.setItem('theme', 'light');
		}
	};

	themeSwitch?.addEventListener('change', themeChange);
}

async function main() {
	await setupThemeSwitch();
}

main().then(undefined, console.error);
