// The actions: one per thing the control API does (Broadcast Browser's README, "Control API").
// Pages load into the preview; Take puts the preview on air. "target: program" acts on the page on air.

const TARGET = {
	type: 'dropdown',
	id: 'target',
	label: 'Page',
	default: 'preview',
	choices: [
		{ id: 'preview', label: 'Preview' },
		{ id: 'program', label: 'Program (on air)' },
	],
}

const TAKE = {
	type: 'checkbox',
	id: 'take',
	label: 'Put it on air once it has loaded',
	default: false,
}

const ON_OFF_TOGGLE = (id, label, def = 'toggle') => ({
	type: 'dropdown',
	id,
	label,
	default: def,
	choices: [
		{ id: 'toggle', label: 'Toggle' },
		{ id: 'true', label: 'On' },
		{ id: 'false', label: 'Off' },
	],
})

/** A checkbox as the API wants it: true, or left out. */
const flag = (v) => (v ? 'true' : undefined)

export const LOOK_SWITCHES = [
	{ id: 'autoTake', label: 'Auto take' },
	{ id: 'hold', label: 'Hold while loading' },
	{ id: 'muted', label: 'Sound on air muted' },
	{ id: 'scrollbars', label: 'Scrollbars' },
	{ id: 'adblock', label: 'Block ads and trackers' },
	{ id: 'annoyances', label: 'Hide cookie banners and pop-ups' },
]

export const OUTPUTS = [
	{ id: 'ndi', label: 'NDI' },
	{ id: 'sdi', label: 'SDI (DeckLink)' },
	{ id: 'syphon', label: 'Syphon' },
]

export function updateActions(self) {
	const run = (command, args) => self.run(command, args)
	self.setActionDefinitions({
		// ---- Pages
		go: {
			name: 'Go to an address',
			description: 'Load an address into the preview (as the address bar: words are a Google search)',
			options: [
				{
					type: 'textinput',
					id: 'url',
					label: 'Address',
					default: 'https://example.com',
					minLength: 1,
					useVariables: true,
				},
				TAKE,
				{ type: 'checkbox', id: 'newTab', label: 'In a new tab', default: false },
			],
			callback: ({ options: o }) =>
				run('go', { url: String(o.url ?? '').trim(), take: flag(o.take), newTab: flag(o.newTab) }),
		},
		favorite: {
			name: 'Favorite',
			description: 'A favorite into the preview, in its own tab (or the tab already open on it)',
			options: [
				{
					type: 'dropdown',
					id: 'favorite',
					label: 'Favorite (or type its number or name)',
					default: self.favoriteChoices()[0].id,
					choices: self.favoriteChoices(),
					allowCustom: true,
				},
				TAKE,
			],
			callback: ({ options: o }) => run('favorite', { ...self.favoriteArgs(o.favorite), take: flag(o.take) }),
		},
		home: {
			name: 'Home',
			description: 'The home page into the preview, as a favorite',
			options: [TAKE],
			callback: ({ options: o }) => run('home', { take: flag(o.take) }),
		},

		// ---- On air
		take: {
			name: 'Take',
			description:
				'The preview on air, and the page that was on air into the preview. A page still loading is cut to once it has loaded',
			options: [{ type: 'checkbox', id: 'now', label: 'Now, even if the page is still loading', default: false }],
			callback: ({ options: o }) => run('take', { now: flag(o.now) }),
		},
		live: {
			name: 'Live',
			description: 'The page on air, as it is: not held, frozen or black',
			options: [],
			callback: () => run('live'),
		},
		freeze: {
			name: 'Freeze',
			description: 'Hold the picture on air as it is',
			options: [ON_OFF_TOGGLE('on', 'Freeze')],
			callback: ({ options: o }) => run('freeze', { on: o.on === 'toggle' ? undefined : o.on }),
		},
		black: {
			name: 'Black',
			description: 'Black on air',
			options: [ON_OFF_TOGGLE('on', 'Black')],
			callback: ({ options: o }) => run('black', { on: o.on === 'toggle' ? undefined : o.on }),
		},

		// ---- The page
		navigate: {
			name: 'Back, forward, reload, stop',
			options: [
				{
					type: 'dropdown',
					id: 'command',
					label: 'Do',
					default: 'reload',
					choices: [
						{ id: 'back', label: 'Back' },
						{ id: 'forward', label: 'Forward' },
						{ id: 'reload', label: 'Reload' },
						{ id: 'reload-hard', label: 'Reload, not from the cache' },
						{ id: 'stop', label: 'Stop loading' },
					],
				},
				TARGET,
			],
			callback: ({ options: o }) =>
				o.command === 'reload-hard'
					? run('reload', { hard: 'true', target: o.target })
					: run(o.command, { target: o.target }),
		},
		scroll: {
			name: 'Scroll',
			description:
				'Scroll the page by screens (a screen: the page’s height, less a little to keep your place); negative: up',
			options: [
				{ type: 'number', id: 'screens', label: 'Screens', default: 1, min: -20, max: 20, step: 0.25 },
				TARGET,
				{ type: 'checkbox', id: 'smooth', label: 'Smoothly', default: true },
			],
			callback: ({ options: o }) =>
				run('scroll', { screens: o.screens, target: o.target, smooth: o.smooth ? undefined : 'false' }),
		},
		top: {
			name: 'Scroll to the top',
			options: [TARGET, { type: 'checkbox', id: 'smooth', label: 'Smoothly', default: true }],
			callback: ({ options: o }) => run('top', { target: o.target, smooth: o.smooth ? undefined : 'false' }),
		},
		zoom: {
			name: 'Zoom',
			description:
				'The page’s zoom. The preview can’t be zoomed while it’s the same site as the page on air (they share their zoom)',
			options: [
				{
					type: 'dropdown',
					id: 'do',
					label: 'Zoom',
					default: 'in',
					// (The percent field shows by this: so it's a plain choice, not an expression.)
					disableAutoExpression: true,
					choices: [
						{ id: 'in', label: 'In' },
						{ id: 'out', label: 'Out' },
						{ id: 'reset', label: 'Reset (100%)' },
						{ id: 'factor', label: 'To a percentage' },
					],
				},
				{
					type: 'number',
					id: 'factor',
					label: 'Percent',
					default: 150,
					min: 25,
					max: 500,
					isVisibleExpression: '$(options:do) == "factor"',
				},
				TARGET,
			],
			callback: ({ options: o }) =>
				run('zoom', {
					target: o.target,
					...(o.do === 'reset'
						? { reset: 'true' }
						: o.do === 'factor'
							? { factor: o.factor }
							: { by: o.do === 'out' ? -1 : 1 }),
				}),
		},

		// ---- Tabs
		tab: {
			name: 'Tab',
			description: 'A tab into the preview, just as it was (tabs are numbered from the left, from 1)',
			options: [{ type: 'number', id: 'n', label: 'Tab', default: 1, min: 1, max: 99, asInteger: true }, TAKE],
			callback: ({ options: o }) => run('tab', { n: o.n, take: flag(o.take) }),
		},
		tab_step: {
			name: 'Next or previous tab',
			description: 'The next or previous tab into the preview (past the one on air)',
			options: [
				{
					type: 'dropdown',
					id: 'by',
					label: 'Which',
					default: '1',
					choices: [
						{ id: '1', label: 'Next' },
						{ id: '-1', label: 'Previous' },
					],
				},
			],
			callback: ({ options: o }) => run('tab-next', { by: o.by }),
		},
		tab_new: {
			name: 'New tab',
			description: 'A new tab in the preview: blank, or with an address',
			options: [
				{ type: 'textinput', id: 'url', label: 'Address (empty: a blank tab)', default: '', useVariables: true },
				TAKE,
			],
			callback: ({ options: o }) => {
				const url = String(o.url ?? '').trim()
				return run('tab-new', { url, take: url ? flag(o.take) : undefined })
			},
		},
		tab_close: {
			name: 'Close a tab',
			description: 'Close the preview’s tab, or a tab by its number (never the one on air)',
			options: [
				{ type: 'number', id: 'n', label: 'Tab (0: the preview’s)', default: 0, min: 0, max: 99, asInteger: true },
			],
			callback: ({ options: o }) => run('tab-close', { n: Number(o.n) > 0 ? o.n : undefined }),
		},
		tab_reopen: {
			name: 'Reopen the closed tab',
			description: 'The tab closed last, open again where it was scrolled to',
			options: [TAKE],
			callback: ({ options: o }) => run('tab-reopen', { take: flag(o.take) }),
		},

		// ---- Settings and outputs
		look: {
			name: 'Switch a setting',
			description: 'Auto take, hold while loading, sound, scrollbars, ad blocking',
			options: [
				{ type: 'dropdown', id: 'setting', label: 'Setting', default: 'autoTake', choices: LOOK_SWITCHES },
				ON_OFF_TOGGLE('value', 'Switch'),
			],
			callback: ({ options: o }) => run('look', { [o.setting]: o.value }),
		},
		adblock_allow: {
			name: 'Ad blocking on a site',
			description: 'Leave a page’s site alone (ads not blocked there), or block it again',
			options: [
				TARGET,
				{
					type: 'dropdown',
					id: 'on',
					label: 'Its site',
					default: 'toggle',
					choices: [
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'true', label: 'Allowed (ads not blocked)' },
						{ id: 'false', label: 'Blocked again' },
					],
				},
			],
			callback: ({ options: o }) =>
				run('adblock-allow', { target: o.target, on: o.on === 'toggle' ? undefined : o.on }),
		},
		output: {
			name: 'Output on or off',
			options: [
				{ type: 'dropdown', id: 'output', label: 'Output', default: 'ndi', choices: OUTPUTS },
				ON_OFF_TOGGLE('value', 'Switch'),
			],
			callback: ({ options: o }) => run('outputs', { [o.output]: o.value }),
		},
		output_mode: {
			name: 'Outputs: NDI and SDI together',
			description: 'NDI and SDI both, one, or neither (off switches Syphon off too)',
			options: [
				{
					type: 'dropdown',
					id: 'mode',
					label: 'Outputs',
					default: 'both',
					choices: [
						{ id: 'both', label: 'NDI and SDI' },
						{ id: 'ndi', label: 'NDI only' },
						{ id: 'sdi', label: 'SDI only' },
						{ id: 'off', label: 'Off (all)' },
					],
				},
			],
			callback: ({ options: o }) => run('outputs', { mode: o.mode }),
		},

		// ---- Anything else
		command: {
			name: 'Any API command',
			description:
				'Any command from the app’s README ("Control API"), with its arguments as a query string: e.g. tab-move and n=3&to=1',
			options: [
				{ type: 'textinput', id: 'command', label: 'Command', default: 'status', minLength: 1, useVariables: true },
				{ type: 'textinput', id: 'args', label: 'Arguments (a=1&b=2)', default: '', useVariables: true },
			],
			callback: ({ options: o }) => {
				const command = String(o.command ?? '')
					.trim()
					.replace(/^\/+/, '')
				if (!/^[a-z][a-z0-9-]*$/i.test(command))
					return self.log('warn', `Any API command: "${command}" isn't a command`)
				return run(command, Object.fromEntries(new URLSearchParams(String(o.args ?? '').replace(/^\?/, ''))))
			},
		},
	})
}
