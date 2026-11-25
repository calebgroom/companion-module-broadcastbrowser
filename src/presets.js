// The presets: ready-made buttons, made again when the favorites change (one per favorite).
// Red: on air; green: in the preview (or on); amber: loading, or something wrong.

import { AMBER, BLACK, GREEN, RED, WHITE } from './feedbacks.js'
import { combineRgb } from '@companion-module/base'
import { TAB_VARIABLES } from './variables.js'

const GREY = combineRgb(40, 40, 40)
const BLUE = combineRgb(0, 80, 200)

const button = (text, actionId, options = {}, feedbacks = [], bgcolor = GREY, size = '18') => ({
	type: 'simple',
	name: text.replace(/\\n/g, ' ').replace(/\$\([^)]*\)/g, '…'),
	style: { text, size, color: WHITE, bgcolor },
	steps: [{ down: [{ actionId, options }], up: [] }],
	feedbacks,
})

const PROGRAM_RED = (feedbackId, options) => ({
	feedbackId,
	options: { ...options, state: 'program' },
	style: { bgcolor: RED, color: WHITE },
})
const PREVIEW_GREEN = (feedbackId, options) => ({
	feedbackId,
	options: { ...options, state: 'preview' },
	style: { bgcolor: GREEN, color: WHITE },
})

export function updatePresets(self) {
	const v = (name) => `$(${self.label}:${name})`
	const presets = {}
	const add = (id, def) => {
		presets[id] = def
		return id
	}
	const page = { target: 'preview' }
	const onAir = { target: 'program' }

	const air = [
		add(
			'take',
			button(
				'TAKE',
				'take',
				{ now: false },
				[
					{ feedbackId: 'air', options: { state: 'loading' }, style: { bgcolor: AMBER, color: BLACK } },
					{ feedbackId: 'loading', options: page, style: { bgcolor: AMBER, color: BLACK } },
				],
				RED,
				'24',
			),
		),
		add(
			'black',
			button(
				'BLACK',
				'black',
				{ on: 'toggle' },
				[{ feedbackId: 'air', options: { state: 'black' }, style: { bgcolor: RED, color: WHITE } }],
				GREY,
				'18',
			),
		),
		add(
			'freeze',
			button(
				'FREEZE',
				'freeze',
				{ on: 'toggle' },
				[{ feedbackId: 'air', options: { state: 'frozen' }, style: { bgcolor: BLUE, color: WHITE } }],
				GREY,
				'18',
			),
		),
		add(
			'live',
			button(
				'LIVE',
				'live',
				{},
				[{ feedbackId: 'air', options: { state: 'live' }, style: { bgcolor: GREEN, color: WHITE } }],
				GREY,
				'18',
			),
		),
		add('home', button('HOME', 'home', { take: false }, [], GREY, '18')),
		add('on_air_title', button(`ON AIR\\n${v('program_title')}`, 'live', {}, [], combineRgb(80, 0, 0), '7')),
		add(
			'not_connected',
			button(
				'Broadcast\\nBrowser',
				'live',
				{},
				[{ feedbackId: 'connected', options: {}, style: { bgcolor: AMBER, color: BLACK, text: 'NOT\\nCONNECTED' } }],
				GREY,
				'14',
			),
		),
	]

	const favorites = (self.status?.favorites ?? []).map((f) =>
		add(
			`favorite_${f.id}`,
			button(
				f.name,
				'favorite',
				{ favorite: f.id, take: false },
				[PROGRAM_RED('favorite', { favorite: f.id }), PREVIEW_GREEN('favorite', { favorite: f.id })],
				GREY,
				'auto',
			),
		),
	)

	const tabs = []
	for (let n = 1; n <= TAB_VARIABLES; n++)
		tabs.push(
			add(
				`tab_${n}`,
				button(
					`${n}\\n${v(`tab_${n}_title`)}`,
					'tab',
					{ n, take: false },
					[PROGRAM_RED('tab', { n }), PREVIEW_GREEN('tab', { n })],
					GREY,
					'7',
				),
			),
		)
	tabs.push(
		add('tab_prev', button('◀ TAB', 'tab_step', { by: '-1' })),
		add('tab_next', button('TAB ▶', 'tab_step', { by: '1' })),
		add('tab_new', button('NEW\\nTAB', 'tab_new', { url: '', take: false })),
		add('tab_close', button('CLOSE\\nTAB', 'tab_close', { n: 0 })),
		add('tab_reopen', button('REOPEN\\nTAB', 'tab_reopen', { take: false })),
	)

	const pages = [
		add('back', button('◀ BACK', 'navigate', { command: 'back', ...page })),
		add('forward', button('FWD ▶', 'navigate', { command: 'forward', ...page })),
		add(
			'reload',
			button('RELOAD', 'navigate', { command: 'reload', ...page }, [
				{ feedbackId: 'loading', options: page, style: { bgcolor: AMBER, color: BLACK } },
			]),
		),
		add(
			'scroll_down_air',
			button('ON AIR\\nSCROLL ▼', 'scroll', { screens: 1, smooth: true, ...onAir }, [], combineRgb(80, 0, 0), '14'),
		),
		add(
			'scroll_up_air',
			button('ON AIR\\nSCROLL ▲', 'scroll', { screens: -1, smooth: true, ...onAir }, [], combineRgb(80, 0, 0), '14'),
		),
		add('top_air', button('ON AIR\\nTOP', 'top', { smooth: true, ...onAir }, [], combineRgb(80, 0, 0), '14')),
		add('scroll_down', button('SCROLL ▼', 'scroll', { screens: 1, smooth: true, ...page })),
		add('scroll_up', button('SCROLL ▲', 'scroll', { screens: -1, smooth: true, ...page })),
		add('zoom_in', button('ZOOM +', 'zoom', { do: 'in', factor: 150, ...page })),
		add('zoom_out', button('ZOOM −', 'zoom', { do: 'out', factor: 150, ...page })),
		add(
			'zoom_reset',
			button(`ZOOM\\n${v('preview_zoom')}%`, 'zoom', { do: 'reset', factor: 150, ...page }, [], GREY, '14'),
		),
	]

	const outputs = [
		['ndi', 'NDI'],
		['sdi', 'SDI'],
		['syphon', 'SYPHON'],
	].map(([id, label]) =>
		add(
			`output_${id}`,
			button(label, 'output', { output: id, value: 'toggle' }, [
				{ feedbackId: 'output', options: { output: id, state: 'working' }, style: { bgcolor: GREEN, color: WHITE } },
				{ feedbackId: 'output', options: { output: id, state: 'failed' }, style: { bgcolor: AMBER, color: BLACK } },
			]),
		),
	)
	outputs.push(
		add(
			'ndi_tally',
			button(
				`NDI\\n${v('ndi_receivers')} rx`,
				'output',
				{ output: 'ndi', value: 'toggle' },
				[
					{ feedbackId: 'ndi_tally', options: { tally: 'preview' }, style: { bgcolor: GREEN, color: WHITE } },
					{ feedbackId: 'ndi_tally', options: { tally: 'program' }, style: { bgcolor: RED, color: WHITE } },
				],
				GREY,
				'14',
			),
		),
	)

	const settings = [
		['autoTake', 'AUTO\\nTAKE'],
		['hold', 'HOLD\\nLOADING'],
		['muted', 'MUTE'],
		['adblock', 'BLOCK\\nADS'],
		['annoyances', 'HIDE\\nBANNERS'],
	].map(([id, label]) =>
		add(
			`setting_${id}`,
			button(
				label,
				'look',
				{ setting: id, value: 'toggle' },
				[{ feedbackId: 'setting', options: { setting: id }, style: { bgcolor: GREEN, color: WHITE } }],
				GREY,
				'14',
			),
		),
	)

	self.setPresetDefinitions(
		[
			{ id: 'air', name: 'On air', description: 'Take the preview to air; black, freeze, live', definitions: air },
			{
				id: 'favorites',
				name: 'Favorites',
				description: favorites.length
					? 'Each favorite into the preview (red: on air; green: in the preview)'
					: 'One button per favorite, once the module has reached the app',
				definitions: favorites,
			},
			{
				id: 'tabs',
				name: 'Tabs',
				description: 'Tabs 1–9 into the preview, by their place (red: on air; green: in the preview)',
				definitions: tabs,
			},
			{ id: 'pages', name: 'Pages', description: 'The preview’s page, or the page on air', definitions: pages },
			{
				id: 'outputs',
				name: 'Outputs',
				description: 'Green: working; amber: on, but not working',
				definitions: outputs,
			},
			{ id: 'settings', name: 'Settings', description: 'Green: on', definitions: settings },
		],
		presets,
	)
}
