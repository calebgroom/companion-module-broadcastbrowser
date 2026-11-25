// The feedbacks: a button lit by what's on air, what's in the preview, a favorite's or a tab's
// state, the outputs and the settings. All from the app's status (main.js asks for it).

import { combineRgb } from '@companion-module/base'
import { LOOK_SWITCHES, OUTPUTS } from './actions.js'

export const RED = combineRgb(204, 0, 0)
export const GREEN = combineRgb(0, 153, 51)
export const AMBER = combineRgb(230, 140, 0)
export const WHITE = combineRgb(255, 255, 255)
export const BLACK = combineRgb(0, 0, 0)

const STATE_CHOICES = [
	{ id: 'program', label: 'On air (program)' },
	{ id: 'preview', label: 'In the preview' },
	{ id: 'open', label: 'Open (in any tab)' },
]

/** A tab's state against the option: program, preview, or open (any). */
const tabIs = (tab, want) => !!tab && (want === 'open' || tab.state === want)

export function updateFeedbacks(self) {
	const s = () => self.status
	self.setFeedbackDefinitions({
		air: {
			type: 'boolean',
			name: 'What’s on air',
			description: 'Live (the page as it is), loading (held while a page loads), frozen or black',
			defaultStyle: { bgcolor: RED, color: WHITE },
			options: [
				{
					type: 'dropdown',
					id: 'state',
					label: 'On air is',
					default: 'black',
					choices: [
						{ id: 'live', label: 'Live' },
						{ id: 'loading', label: 'Held, loading' },
						{ id: 'frozen', label: 'Frozen' },
						{ id: 'black', label: 'Black' },
					],
				},
			],
			callback: ({ options: o }) => self.connected && s()?.air?.state === o.state,
		},
		favorite: {
			type: 'boolean',
			name: 'Favorite: on air, in the preview, or open',
			description:
				'A tab is open on the favorite’s address (the address it went to: a site that sends it elsewhere won’t match)',
			defaultStyle: { bgcolor: RED, color: WHITE },
			options: [
				{
					type: 'dropdown',
					id: 'favorite',
					label: 'Favorite (or type its number or name)',
					default: self.favoriteChoices()[0].id,
					choices: self.favoriteChoices(),
					allowCustom: true,
				},
				{ type: 'dropdown', id: 'state', label: 'Is', default: 'program', choices: STATE_CHOICES },
			],
			callback: ({ options: o }) => self.connected && tabIs(self.favoriteTab(self.findFavorite(o.favorite)), o.state),
		},
		tab: {
			type: 'boolean',
			name: 'Tab: on air, in the preview, or open',
			defaultStyle: { bgcolor: RED, color: WHITE },
			options: [
				{ type: 'number', id: 'n', label: 'Tab', default: 1, min: 1, max: 99, asInteger: true },
				{ type: 'dropdown', id: 'state', label: 'Is', default: 'program', choices: STATE_CHOICES },
			],
			callback: ({ options: o }) =>
				self.connected &&
				tabIs(
					(s()?.tabs ?? []).find((t) => t.n === Number(o.n)),
					o.state,
				),
		},
		loading: {
			type: 'boolean',
			name: 'Page loading',
			defaultStyle: { bgcolor: AMBER, color: BLACK },
			options: [
				{
					type: 'dropdown',
					id: 'target',
					label: 'Page',
					default: 'preview',
					choices: [
						{ id: 'preview', label: 'Preview' },
						{ id: 'program', label: 'Program (on air)' },
					],
				},
			],
			callback: ({ options: o }) => self.connected && !!s()?.[o.target]?.loading,
		},
		output: {
			type: 'boolean',
			name: 'Output on',
			description: 'An output switched on. "Not working": switched on, but it couldn’t start (the app says why)',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [
				{ type: 'dropdown', id: 'output', label: 'Output', default: 'ndi', choices: OUTPUTS },
				{
					type: 'dropdown',
					id: 'state',
					label: 'Is',
					default: 'on',
					choices: [
						{ id: 'on', label: 'Switched on' },
						{ id: 'working', label: 'On and working' },
						{ id: 'failed', label: 'On, but not working' },
					],
				},
			],
			callback: ({ options: o }) => {
				const out = s()?.output
				if (!self.connected || !out?.outputs?.[o.output]) return false
				// (Running, with nothing wrong: SDI's device can stop taking frames while it's on.)
				const working =
					o.output === 'ndi'
						? !!out.ndi && !out.error
						: o.output === 'sdi'
							? !!out.decklink?.on && !out.decklink?.error
							: !!out.syphon?.on && !out.syphon?.error
				return o.state === 'on' || (o.state === 'working') === working
			},
		},
		ndi_tally: {
			type: 'boolean',
			name: 'NDI tally',
			description: 'A switcher receiving the NDI source has it on program (or preview)',
			defaultStyle: { bgcolor: RED, color: WHITE },
			options: [
				{
					type: 'dropdown',
					id: 'tally',
					label: 'On',
					default: 'program',
					choices: [
						{ id: 'program', label: 'Program' },
						{ id: 'preview', label: 'Preview' },
					],
				},
			],
			callback: ({ options: o }) => self.connected && !!s()?.output?.tally?.[o.tally],
		},
		setting: {
			type: 'boolean',
			name: 'Setting on',
			description: 'Auto take, hold while loading, sound muted, scrollbars, ad blocking',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [{ type: 'dropdown', id: 'setting', label: 'Setting', default: 'autoTake', choices: LOOK_SWITCHES }],
			callback: ({ options: o }) => self.connected && !!s()?.look?.[o.setting],
		},
		connected: {
			type: 'boolean',
			name: 'Not connected',
			description: 'The app can’t be reached, or refuses the API token',
			defaultStyle: { bgcolor: AMBER, color: BLACK },
			options: [],
			callback: () => !self.connected,
		},
	})
}
