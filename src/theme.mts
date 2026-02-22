import { forElementBySelector } from './utils.mjs';

forElementBySelector<HTMLInputElement>('#theme-switch').then(([themeSwitch]) => {
	const currentTheme = localStorage.getItem('theme');

	// Dark is the default. If user has 'light' stored, set checkbox and attribute.
	if (currentTheme === 'light') {
		themeSwitch.checked = true;
		document.documentElement.setAttribute('data-theme', 'light');
	}

	const themeChange = () => {
		if (themeSwitch.checked) {
			// User toggled to light
			document.documentElement.setAttribute('data-theme', 'light');
			localStorage.setItem('theme', 'light');
		} else {
			// User toggled back to dark (the default)
			document.documentElement.removeAttribute('data-theme');
			localStorage.removeItem('theme');
		}
	};

	themeSwitch.addEventListener('change', themeChange);
});
