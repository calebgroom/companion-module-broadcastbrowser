// The variables: what's on air and in the preview, the tabs and the favorites, the outputs, and the
// app's last message. $(<connection>:program_title), and so on.

/** Tabs and favorites with variables of their own (tab_1_title…, favorite_1_name…). */
export const TAB_VARIABLES = 9
export const FAVORITE_VARIABLES = 20

export function updateVariableDefinitions(self) {
	const defs = {
		connected: { name: 'Connected to the app (true or false)' },
		air_state: { name: 'On air: live, loading, frozen or black' },
		program_title: { name: 'The page on air: its title' },
		program_url: { name: 'The page on air: its address' },
		program_loading: { name: 'The page on air is loading (true or false)' },
		program_zoom: { name: 'The page on air: its zoom, in percent' },
		preview_title: { name: 'The preview: its title' },
		preview_url: { name: 'The preview: its address' },
		preview_loading: { name: 'The preview is loading (true or false)' },
		preview_zoom: { name: 'The preview: its zoom, in percent' },
		tab_count: { name: 'How many tabs are open' },
		favorite_count: { name: 'How many favorites there are' },
		outputs: { name: 'The program’s outputs on (NDI, SDI, Syphon), or off' },
		ndi_name: { name: 'The program’s NDI source name' },
		ndi_receivers: { name: 'How many receivers the program’s NDI source has' },
		preview_outputs: { name: 'The preview’s outputs on (NDI, SDI, Syphon), or off' },
		preview_ndi_name: { name: 'The preview’s NDI source name' },
		preview_ndi_receivers: { name: 'How many receivers the preview’s NDI source has' },
		last_message: { name: 'The app’s last message' },
	}
	for (let n = 1; n <= TAB_VARIABLES; n++) {
		defs[`tab_${n}_title`] = { name: `Tab ${n}: its title` }
		defs[`tab_${n}_state`] = { name: `Tab ${n}: program, preview, open, or empty (no such tab)` }
	}
	for (let n = 1; n <= FAVORITE_VARIABLES; n++) defs[`favorite_${n}_name`] = { name: `Favorite ${n}: its name` }
	self.setVariableDefinitions(defs)
}

/** The variables' values now, from the app's status (main.js). */
export function variableValues(self) {
	const s = self.status
	const on = self.connected && !!s
	const page = (p) => ({
		title: on ? (p?.title ?? '') : '',
		url: on ? (p?.url ?? '') : '',
		loading: on && !!p?.loading,
		zoom: on && p?.zoom ? Math.round(p.zoom * 100) : '',
	})
	const program = page(s?.program)
	const preview = page(s?.preview)
	const tabs = on ? (s.tabs ?? []) : []
	const favs = on ? (s.favorites ?? []) : []
	const out = s?.output
	const outputsOn = on ? OUTPUT_NAMES.filter(([k]) => out?.outputs?.[k]).map(([, name]) => name) : []
	const pout = s?.previewOutput
	const previewOn = on && pout ? OUTPUT_NAMES.filter(([k]) => pout.outputs?.[k]).map(([, name]) => name) : []
	const values = {
		connected: !!self.connected,
		air_state: on ? (s.air?.state ?? '') : '',
		program_title: program.title,
		program_url: program.url,
		program_loading: program.loading,
		program_zoom: program.zoom,
		preview_title: preview.title,
		preview_url: preview.url,
		preview_loading: preview.loading,
		preview_zoom: preview.zoom,
		tab_count: tabs.length,
		favorite_count: favs.length,
		outputs: on ? outputsOn.join(', ') || 'off' : '',
		ndi_name: on ? (out?.name ?? '') : '',
		ndi_receivers: on ? (out?.connections ?? 0) : 0,
		// (The preview feed's: none from an app before 0.2.0.)
		preview_outputs: on && pout ? previewOn.join(', ') || 'off' : '',
		preview_ndi_name: on && pout ? (pout.name ?? '') : '',
		preview_ndi_receivers: on && pout ? (pout.connections ?? 0) : 0,
		last_message: on ? (s.errors?.at(-1)?.message ?? '') : '',
	}
	for (let n = 1; n <= TAB_VARIABLES; n++) {
		const t = tabs[n - 1]
		values[`tab_${n}_title`] = t ? t.title || t.url || 'New tab' : ''
		values[`tab_${n}_state`] = t ? t.state : 'empty'
	}
	for (let n = 1; n <= FAVORITE_VARIABLES; n++) values[`favorite_${n}_name`] = favs[n - 1]?.name ?? ''
	return values
}

const OUTPUT_NAMES = [
	['ndi', 'NDI'],
	['sdi', 'SDI'],
	['syphon', 'Syphon'],
]
