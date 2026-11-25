// The module's logic, without Companion: its actions, feedbacks, variables and presets, made against
// a stand-in for the connection (and a status like the app's), and the request signing.
// `npm test` (node --test).

import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { test } from 'node:test'
import BroadcastBrowserInstance from '../src/main.js'
import { signedText } from '../src/api.js'
import { variableValues } from '../src/variables.js'

const STATUS = {
	air: { state: 'live', frozen: false, black: false, holding: false },
	preview: { url: 'https://scores.example.com/', title: 'Scores', loading: true, zoom: 1.5 },
	program: { url: 'https://news.example.com/live', title: 'News', loading: false, zoom: 1 },
	tabs: [
		{ n: 1, id: 't1', url: 'https://news.example.com/live', title: 'News', state: 'program' },
		{ n: 2, id: 't2', url: 'https://scores.example.com/', title: 'Scores', state: 'preview' },
		{ n: 3, id: 't3', url: 'https://weather.example.com', title: '', state: 'open' },
	],
	look: { autoTake: false, hold: true, muted: true, scrollbars: false, adblock: true, annoyances: false },
	favorites: [
		{ n: 1, id: 'fa', name: 'News', url: 'https://news.example.com/live/' },
		{ n: 2, id: 'fb', name: 'Scores', url: 'https://scores.example.com' },
		{ n: 3, id: 'fc', name: 'Radar', url: 'https://radar.example.com' },
	],
	output: {
		outputs: { ndi: true, sdi: true, syphon: false },
		ndi: true,
		error: null,
		name: 'MAC (Broadcast Browser)',
		connections: 2,
		tally: { program: true, preview: false },
		decklink: { on: false, error: 'no DeckLink device' },
		syphon: { on: false, error: null },
	},
	errors: [
		{ at: '2026-11-25T12:00:00Z', message: 'first' },
		{ at: '2026-11-25T12:01:00Z', message: 'last one' },
	],
}

/** The module's instance, without Companion: its definitions and its commands caught. */
function connection(status = STATUS) {
	const self = Object.create(BroadcastBrowserInstance.prototype)
	// (label: a getter on the real one, from Companion: the connection's name.)
	Object.defineProperty(self, 'label', { value: 'bb' })
	Object.assign(self, {
		status,
		connected: true,
		sent: [],
		logs: [],
		run: async (command, args = {}) =>
			self.sent.push([command, Object.fromEntries(Object.entries(args).filter(([, v]) => v !== undefined))]),
		log: (level, m) => self.logs.push([level, m]),
		setActionDefinitions: (d) => (self.actions = d),
		setFeedbackDefinitions: (d) => (self.feedbacks = d),
		setPresetDefinitions: (structure, presets) => Object.assign(self, { structure, presets }),
		setVariableDefinitions: (d) => (self.variables = d),
	})
	self.updateDefinitions()
	self.updateVariableDefinitions()
	return self
}

/** An option's default, as Companion would fill it in. */
const defaults = (def) =>
	Object.fromEntries(def.options.filter((o) => o.type !== 'static-text').map((o) => [o.id, o.default]))

test('signing: the text and HMAC are as the app expects', () => {
	const text = signedText('get', '/go?url=a', 1700000000000, 'nonce-nonce-nonce', '')
	assert.equal(
		text,
		'BB1\nGET\n/go?url=a\n1700000000000\nnonce-nonce-nonce\ne3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
	)
	// (A fixed vector: if this changes, the app's src/http.js must change with it.)
	assert.equal(createHmac('sha256', 'k'.repeat(32)).update(text).digest('hex').length, 64)
})

test('every action runs with its defaults, and sends what the API expects', async () => {
	const self = connection()
	for (const [id, def] of Object.entries(self.actions)) {
		assert.ok(def.name, `${id}: a name`)
		await def.callback({ options: defaults(def) })
	}
	const sent = Object.fromEntries(self.sent.map(([c, a], i) => [`${i}:${c}`, a]))
	const find = (c) => self.sent.find(([command]) => command === c)?.[1]
	assert.deepEqual(find('go'), { url: 'https://example.com' })
	assert.deepEqual(find('favorite'), { id: 'fa' })
	assert.deepEqual(find('take'), {})
	assert.deepEqual(find('freeze'), {})
	assert.deepEqual(find('reload'), { target: 'preview' })
	assert.deepEqual(find('scroll'), { screens: 1, target: 'preview' })
	assert.deepEqual(find('zoom'), { target: 'preview', by: 1 })
	assert.deepEqual(find('tab'), { n: 1 })
	assert.deepEqual(find('tab-next'), { by: '1' })
	assert.deepEqual(find('tab-new'), { url: '' })
	assert.deepEqual(find('tab-close'), {})
	assert.deepEqual(find('look'), { autoTake: 'toggle' })
	assert.deepEqual(find('outputs'), { ndi: 'toggle' })
	assert.deepEqual(find('status'), {})
	assert.ok(Object.keys(sent).length >= 20)
})

test('actions: options that change what is sent', async () => {
	const self = connection()
	const a = self.actions
	await a.go.callback({ options: { url: '  big ten standings ', take: true, newTab: true } })
	await a.favorite.callback({ options: { favorite: '3', take: true } })
	await a.favorite.callback({ options: { favorite: 'radar', take: false } })
	await a.black.callback({ options: { on: 'true' } })
	await a.navigate.callback({ options: { command: 'reload-hard', target: 'program' } })
	await a.zoom.callback({ options: { do: 'factor', factor: 150, target: 'program' } })
	await a.zoom.callback({ options: { do: 'reset', target: 'preview' } })
	await a.scroll.callback({ options: { screens: -0.5, target: 'program', smooth: false } })
	await a.tab_close.callback({ options: { n: 4 } })
	await a.tab_new.callback({ options: { url: 'x.com', take: true } })
	await a.command.callback({ options: { command: '/tab-move', args: '?n=3&to=1' } })
	await a.command.callback({ options: { command: '../../etc', args: '' } })
	assert.deepEqual(self.sent, [
		['go', { url: 'big ten standings', take: 'true', newTab: 'true' }],
		['favorite', { n: '3', take: 'true' }],
		['favorite', { name: 'radar' }],
		['black', { on: 'true' }],
		['reload', { hard: 'true', target: 'program' }],
		['zoom', { target: 'program', factor: 150 }],
		['zoom', { target: 'preview', reset: 'true' }],
		['scroll', { screens: -0.5, target: 'program', smooth: 'false' }],
		['tab-close', { n: 4 }],
		['tab-new', { url: 'x.com', take: 'true' }],
		['tab-move', { n: '3', to: '1' }],
	])
	assert.match(self.logs.at(-1)[1], /isn't a command/)
})

test('feedbacks follow the status', () => {
	const self = connection()
	const f = (id, options) => self.feedbacks[id].callback({ options })
	assert.equal(f('air', { state: 'live' }), true)
	assert.equal(f('air', { state: 'black' }), false)
	// (A favorite's address with or without its last /, as the app matches it.)
	assert.equal(f('favorite', { favorite: 'fa', state: 'program' }), true)
	assert.equal(f('favorite', { favorite: 'fb', state: 'preview' }), true)
	assert.equal(f('favorite', { favorite: 'fb', state: 'program' }), false)
	assert.equal(f('favorite', { favorite: '2', state: 'open' }), true)
	assert.equal(f('favorite', { favorite: 'Radar', state: 'open' }), false)
	assert.equal(f('tab', { n: 1, state: 'program' }), true)
	assert.equal(f('tab', { n: 3, state: 'open' }), true)
	assert.equal(f('tab', { n: 4, state: 'open' }), false)
	assert.equal(f('loading', { target: 'preview' }), true)
	assert.equal(f('loading', { target: 'program' }), false)
	assert.equal(f('output', { output: 'ndi', state: 'working' }), true)
	assert.equal(f('output', { output: 'sdi', state: 'on' }), true)
	assert.equal(f('output', { output: 'sdi', state: 'working' }), false)
	assert.equal(f('output', { output: 'sdi', state: 'failed' }), true)
	assert.equal(f('output', { output: 'syphon', state: 'on' }), false)
	assert.equal(f('ndi_tally', { tally: 'program' }), true)
	assert.equal(f('setting', { setting: 'adblock' }), true)
	assert.equal(f('setting', { setting: 'autoTake' }), false)
	assert.equal(f('connected', {}), false)
	self.connected = false
	assert.equal(f('air', { state: 'live' }), false, 'nothing lit when not connected')
	assert.equal(f('tab', { n: 1, state: 'program' }), false)
	assert.equal(f('connected', {}), true)
})

test('variables: values for every definition', () => {
	const self = connection()
	const v = variableValues(self)
	assert.deepEqual(Object.keys(v).sort(), Object.keys(self.variables).sort())
	assert.equal(v.air_state, 'live')
	assert.equal(v.program_title, 'News')
	assert.equal(v.preview_zoom, 150)
	assert.equal(v.tab_3_title, 'https://weather.example.com')
	assert.equal(v.tab_2_state, 'preview')
	assert.equal(v.tab_4_state, 'empty')
	assert.equal(v.favorite_3_name, 'Radar')
	assert.equal(v.favorite_4_name, '')
	assert.equal(v.outputs, 'NDI, SDI')
	assert.equal(v.last_message, 'last one')
	self.connected = false
	const off = variableValues(self)
	assert.equal(off.air_state, '')
	assert.equal(off.tab_1_state, 'empty')
	assert.equal(off.connected, false)
})

test('presets: every action, feedback and option they use exists', () => {
	const self = connection()
	const ids = new Set(Object.keys(self.presets))
	for (const section of self.structure)
		for (const id of section.definitions) assert.ok(ids.has(id), `${section.id}: ${id} defined`)
	assert.equal(self.structure.find((s) => s.id === 'favorites').definitions.length, 3)
	for (const [id, p] of Object.entries(self.presets)) {
		assert.equal(p.type, 'simple', id)
		for (const step of p.steps)
			for (const a of step.down) {
				const def = self.actions[a.actionId]
				assert.ok(def, `${id}: action ${a.actionId}`)
				const known = new Set(def.options.map((o) => o.id))
				for (const k of Object.keys(a.options)) assert.ok(known.has(k), `${id}: ${a.actionId} has no option ${k}`)
			}
		for (const fb of p.feedbacks) {
			const def = self.feedbacks[fb.feedbackId]
			assert.ok(def, `${id}: feedback ${fb.feedbackId}`)
			const known = new Set(def.options.map((o) => o.id))
			for (const k of Object.keys(fb.options)) assert.ok(known.has(k), `${id}: ${fb.feedbackId} has no option ${k}`)
		}
	}
	assert.equal(self.presets.tab_2.style.text, '2\\n$(bb:tab_2_title)')
})

test('before the app is reached: definitions still made', () => {
	const self = connection(null)
	assert.equal(self.actions.favorite.options[0].choices.length, 1)
	assert.deepEqual(self.structure.find((s) => s.id === 'favorites').definitions, [])
	assert.equal(variableValues(self).tab_count, 0)
})
