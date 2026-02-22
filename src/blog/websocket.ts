type Field = {
	readonly name: string;
	/** Full description — used for title attribute and field-info bar */
	readonly label: string;
	/** Short form shown inside the cell. Defaults to label if omitted. */
	readonly shortLabel?: string;
	/** 1-based row index, not counting the header row */
	readonly row: number;
	/** 1-based bit column, inclusive */
	readonly startBit: number;
	/** 1-based bit column, inclusive */
	readonly endBit: number;
};

type BranchField = {
	readonly name: string;
	readonly label: string;
	/** Proportional byte-width unit (1 unit ≈ 1 byte) */
	readonly bytes: number;
};

type BranchCase = {
	readonly label: string;
	readonly note: string;
	readonly fields: readonly BranchField[];
};

type MaskDir = {
	readonly label: string;
	readonly note: string;
	readonly fields: readonly { name: string; label: string; flex: number }[];
};

// RFC 6455 §5.2 — Base Framing Protocol
const FRAME_FIELDS: readonly Field[] = [
	{ name: 'fin',          label: 'FIN — final fragment bit',          shortLabel: 'FIN',  row: 1, startBit: 1,  endBit: 1  },
	{ name: 'rsv',          label: 'RSV1 — reserved (extension use)',   shortLabel: 'R1',   row: 1, startBit: 2,  endBit: 2  },
	{ name: 'rsv',          label: 'RSV2 — reserved (extension use)',   shortLabel: 'R2',   row: 1, startBit: 3,  endBit: 3  },
	{ name: 'rsv',          label: 'RSV3 — reserved (extension use)',   shortLabel: 'R3',   row: 1, startBit: 4,  endBit: 4  },
	{ name: 'opcode',       label: 'opcode (4 bits)',                                       row: 1, startBit: 5,  endBit: 8  },
	{ name: 'mask-bit',     label: 'MASK — payload is masked',          shortLabel: 'MASK', row: 1, startBit: 9,  endBit: 9  },
	{ name: 'payload-len',  label: 'payload len (7 bits)',               shortLabel: 'payload len', row: 1, startBit: 10, endBit: 16 },
	{ name: 'ext-payload',  label: 'extended payload len (16 bits)',     shortLabel: 'ext payload len', row: 1, startBit: 17, endBit: 32 },
	{ name: 'ext-payload',  label: 'extended payload len, cont. (32 bits)', shortLabel: 'ext payload len cont.', row: 2, startBit: 1, endBit: 32 },
	{ name: 'masking-key',  label: 'masking key (32 bits)',                                 row: 3, startBit: 1,  endBit: 32 },
	{ name: 'payload-data', label: 'payload data',                                          row: 4, startBit: 1,  endBit: 32 },
];

// Three payload length cases — each row sums to 16 byte-units for consistent width
const BRANCH_CASES: readonly BranchCase[] = [
	{
		label: 'len 0–125',
		note: 'Length fits in 7 bits — no extended field.',
		fields: [
			{ name: 'masking-key',  label: 'masking key (4 B)',  bytes: 4  },
			{ name: 'payload-data', label: 'payload data →',     bytes: 12 },
		],
	},
	{
		label: 'len = 126',
		note: '2-byte unsigned integer follows.',
		fields: [
			{ name: 'ext-payload',  label: 'ext. len (2 B)',     bytes: 2  },
			{ name: 'masking-key',  label: 'masking key (4 B)',  bytes: 4  },
			{ name: 'payload-data', label: 'payload data →',     bytes: 10 },
		],
	},
	{
		label: 'len = 127',
		note: '8-byte unsigned integer follows.',
		fields: [
			{ name: 'ext-payload',  label: 'ext. len (8 B)',     bytes: 8  },
			{ name: 'masking-key',  label: 'masking key (4 B)',  bytes: 4  },
			{ name: 'payload-data', label: 'payload data →',     bytes: 4  },
		],
	},
];

const MASKING_DIRECTIONS: readonly MaskDir[] = [
	{
		label: 'client → server',
		note: 'MASK must be 1 — masking key is present',
		fields: [
			{ name: 'mask-bit',     label: 'MASK=1',             flex: 2 },
			{ name: 'masking-key',  label: 'masking key (4 B)',  flex: 4 },
			{ name: 'payload-data', label: 'payload',            flex: 6 },
		],
	},
	{
		label: 'server → client',
		note: 'MASK must be 0 — no masking key',
		fields: [
			{ name: 'mask-bit-zero', label: 'MASK=0',                      flex: 2  },
			{ name: 'payload-data',  label: 'payload (no masking key)',     flex: 10 },
		],
	},
];

buildDiagram();
buildNavButtons();

function buildDiagram(): void {
	buildMainFrame();
	buildBranchCases();
	buildMaskingDirection();
}

function buildNavButtons(): void {
	const steps = Array.from(document.querySelectorAll<HTMLElement>('.step'));
	for (let i = 0; i < steps.length - 1; i++) {
		const step = steps[i];
		const nextStep = steps[i + 1];

		const nav = document.createElement('div');
		nav.className = 'step-nav';

		const btn = document.createElement('button');
		btn.className = 'step-nav-btn';
		btn.setAttribute('aria-label', 'Next section');
		btn.innerHTML =
			'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>';

		btn.addEventListener('click', () => {
			nextStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});

		nav.appendChild(btn);
		step.appendChild(nav);
	}
}

function buildMainFrame(): void {
	const container = document.getElementById('ws-frame');
	if (container == null) return;

	// Bit-number header row
	const header = document.createElement('div');
	header.className = 'bit-header';
	for (let i = 0; i < 32; i++) {
		const cell = document.createElement('span');
		cell.className = 'bit-number';
		if (i % 8 === 0) cell.classList.add('byte-start');
		cell.textContent = String(i);
		header.appendChild(cell);
	}
	container.appendChild(header);

	// Field cells
	for (const field of FRAME_FIELDS) {
		const cell = document.createElement('div');
		cell.className = `field field-${field.name}`;
		cell.title = field.label;

		cell.style.gridColumn = `${field.startBit} / ${field.endBit + 1}`;
		cell.style.gridRow = String(field.row + 1);

		if (field.startBit > 1 && (field.startBit - 1) % 8 === 0) {
			cell.classList.add('byte-boundary');
		}
		if (field.startBit === 1 && field.endBit === 32) {
			cell.classList.add('full-row');
		}
		if (field.startBit === field.endBit) {
			cell.classList.add('single-bit');
		}

		const label = document.createElement('span');
		label.className = 'field-label';
		label.textContent = field.shortLabel ?? field.label;
		cell.appendChild(label);

		cell.addEventListener('mouseenter', () => showFieldInfo(field.label));
		cell.addEventListener('mouseleave', hideFieldInfo);

		container.appendChild(cell);
	}
}

function buildBranchCases(): void {
	const container = document.getElementById('branch-cases');
	if (container == null) return;

	for (const bc of BRANCH_CASES) {
		const caseEl = document.createElement('div');
		caseEl.className = 'branch-case';

		const header = document.createElement('div');
		header.className = 'branch-case-header';

		const labelEl = document.createElement('span');
		labelEl.className = 'branch-case-label';
		labelEl.textContent = bc.label;

		const noteEl = document.createElement('span');
		noteEl.className = 'branch-case-note';
		noteEl.textContent = bc.note;

		header.appendChild(labelEl);
		header.appendChild(noteEl);

		const rowEl = document.createElement('div');
		rowEl.className = 'branch-case-row';

		for (const f of bc.fields) {
			const seg = document.createElement('div');
			seg.className = `branch-seg branch-seg-${f.name}`;
			seg.style.flexGrow = String(f.bytes);
			seg.style.flexBasis = '0';
			const segLabel = document.createElement('span');
			segLabel.textContent = f.label;
			seg.appendChild(segLabel);
			rowEl.appendChild(seg);
		}

		caseEl.appendChild(header);
		caseEl.appendChild(rowEl);
		container.appendChild(caseEl);
	}
}

function buildMaskingDirection(): void {
	const container = document.getElementById('masking-direction');
	if (container == null) return;

	for (const dir of MASKING_DIRECTIONS) {
		const dirEl = document.createElement('div');
		dirEl.className = 'mask-dir';

		const header = document.createElement('div');
		header.className = 'mask-dir-header';

		const labelEl = document.createElement('span');
		labelEl.className = 'mask-dir-label';
		labelEl.textContent = dir.label;

		const noteEl = document.createElement('span');
		noteEl.className = 'mask-dir-note';
		noteEl.textContent = dir.note;

		header.appendChild(labelEl);
		header.appendChild(noteEl);

		const rowEl = document.createElement('div');
		rowEl.className = 'mask-dir-row';

		for (const f of dir.fields) {
			const seg = document.createElement('div');
			seg.className = `mask-seg mask-seg-${f.name}`;
			seg.style.flexGrow = String(f.flex);
			seg.style.flexBasis = '0';
			seg.textContent = f.label;
			rowEl.appendChild(seg);
		}

		dirEl.appendChild(header);
		dirEl.appendChild(rowEl);
		container.appendChild(dirEl);
	}
}

// --- Field info bar ---

let hideInfoTimer: ReturnType<typeof setTimeout> | null = null;

function showFieldInfo(label: string): void {
	if (hideInfoTimer != null) {
		clearTimeout(hideInfoTimer);
		hideInfoTimer = null;
	}
	const el = document.getElementById('field-info');
	if (el == null) return;
	el.textContent = label;
	el.classList.add('field-info-active');
}

function hideFieldInfo(): void {
	hideInfoTimer = setTimeout(() => {
		const el = document.getElementById('field-info');
		el?.classList.remove('field-info-active');
	}, 120);
}
