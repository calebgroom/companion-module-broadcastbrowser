// Broadcast Browser, for Bitfocus Companion (4.3 and later): the app's control API (its README,
// "Control API") as actions, feedbacks, variables and presets. Every request is signed with the
// app's API token (src/api.js), so the token never crosses the network. The app's status is asked
// for every so often (the poll interval), and after every action, for the feedbacks and variables.

import { InstanceBase, InstanceStatus, Regex } from '@companion-module/base'
import { Api, ApiError } from './api.js'
import { updateActions } from './actions.js'
import { updateFeedbacks } from './feedbacks.js'
import { updatePresets } from './presets.js'
import { updateVariableDefinitions, variableValues } from './variables.js'
import { UpgradeScripts } from './upgrades.js'

export { UpgradeScripts }

const DEFAULT_PORT = 8793

export default class BroadcastBrowserInstance extends InstanceBase {
	/** The app's status as last heard (its /status), or null. */
	status = null
	/** Reached the app the last time we asked. */
	connected = false
	api = null
	pollTimer = null
	pollStopped = true
	lastError = ''
	/** What the favorites' and tabs' choices were made from: made again when it changes. */
	listsKey = ''
	/** The connection's status as last told to Companion (told again only when it changes). */
	shownStatus = ''
	/**
	 * The tabs' pictures, for their buttons: by place and size ("3:72x40"), { key, tabId, png64 }.
	 * The key holds the tab's picture version (its status's picture): a new one is fetched when it changes.
	 */
	pictures = new Map()
	/** The pictures being fetched (their keys). */
	fetching = new Set()

	/** The connection's status in Companion, if it has changed. */
	setStatus(status, message = null) {
		const key = `${status}\n${message ?? ''}`
		if (key === this.shownStatus) return
		this.shownStatus = key
		this.updateStatus(status, message)
	}

	async init(config, _isFirstInit, secrets) {
		this.config = config
		this.secrets = secrets ?? {}
		this.updateVariableDefinitions()
		this.updateDefinitions()
		this.start()
	}

	async destroy() {
		this.stop()
	}

	async configUpdated(config, secrets) {
		this.config = config
		this.secrets = secrets ?? {}
		this.stop()
		this.status = null
		this.connected = false
		this.listsKey = ''
		this.pictures.clear()
		this.updateDefinitions()
		// (Nothing known about the app now: the buttons and variables say so until it answers.)
		this.setVariableValues(variableValues(this))
		this.checkAllFeedbacks()
		this.start()
	}

	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: '',
				value:
					'Companion on the same Mac as Broadcast Browser: 127.0.0.1. On another computer: in Broadcast Browser, <b>File → Control API → Listen On</b>, choose All Networks or the network Companion is on (at first it listens on its own Mac only); <b>Copy Control API Address</b> there shows the address. <b>Copy API Token</b> copies the token to paste below. Requests are signed with the token: it never crosses the network.',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Address of the Mac running Broadcast Browser',
				width: 8,
				default: '127.0.0.1',
				minLength: 1,
				regex: '/^[A-Za-z0-9.:\\-\\[\\]]+$/',
			},
			{
				type: 'number',
				id: 'port',
				label: 'Port',
				width: 4,
				default: DEFAULT_PORT,
				min: 1,
				max: 65535,
				asInteger: true,
				regex: Regex.PORT,
			},
			{
				type: 'secret-text',
				id: 'token',
				label: 'API token',
				width: 12,
				tooltip:
					'In Broadcast Browser: File → Control API → Copy API Token. Leave it empty only if the app has api-token off.',
			},
			{
				type: 'dropdown',
				id: 'poll',
				label: 'Check the app every',
				width: 6,
				default: 500,
				choices: [
					{ id: 250, label: '0.25 seconds' },
					{ id: 500, label: '0.5 seconds' },
					{ id: 1000, label: '1 second' },
					{ id: 2000, label: '2 seconds' },
				],
				tooltip: 'How quickly the buttons follow changes made in the app itself (an action updates them at once)',
			},
		]
	}

	// ---- Talking to the app ------------------------------------------------------------------------

	start() {
		const host = String(this.config?.host ?? '').trim()
		if (!host) {
			this.setStatus(InstanceStatus.BadConfig, 'No address')
			return
		}
		this.api = new Api({
			host,
			port: Number(this.config.port) || DEFAULT_PORT,
			token: String(this.secrets?.token ?? '').trim(),
		})
		this.setStatus(InstanceStatus.Connecting)
		this.pollStopped = false
		this.poll()
	}

	stop() {
		this.pollStopped = true
		clearTimeout(this.pollTimer)
		this.pollTimer = null
	}

	async poll() {
		if (this.pollStopped) return
		try {
			const answer = await this.api.get('status')
			this.onStatus(answer.status)
		} catch (e) {
			this.onFailure(e)
		}
		if (this.pollStopped) return
		clearTimeout(this.pollTimer)
		this.pollTimer = setTimeout(() => this.poll(), Number(this.config?.poll) || 500)
	}

	/**
	 * Runs a command (the API's /<command>?<args>). The app answers with its status (all but the
	 * lists), which the buttons follow at once. A refusal is logged (the app's reason).
	 */
	async run(command, args = {}) {
		if (!this.api) return
		try {
			const answer = await this.api.get(command, args)
			if (answer.status) this.onStatus(answer.status)
		} catch (e) {
			if (e instanceof ApiError && e.status === 400) this.log('warn', `${command}: ${e.message}`)
			else this.onFailure(e)
		}
	}

	/**
	 * A feed's outputs command (the API's /outputs). The preview's only to an app that has a preview
	 * feed (status.previewOutput: Broadcast Browser 0.2.0 and later): an older one would take it
	 * for the program's, and switch an output that's on air.
	 */
	async runOutputs(feed, args) {
		if ((feed ?? 'program') !== 'preview') return this.run('outputs', args)
		if (!this.status?.previewOutput) {
			this.log('warn', 'Preview outputs need Broadcast Browser 0.2.0 or later: update the app (nothing was switched)')
			return
		}
		return this.run('outputs', { feed: 'preview', ...args })
	}

	onStatus(status) {
		if (!status) return
		this.status = status
		if (!this.connected) {
			this.connected = true
			this.log('info', `connected to Broadcast Browser at ${this.api.base}`)
		}
		this.lastError = ''
		this.setStatus(InstanceStatus.Ok)
		// (Favorites or tabs changed: the dropdowns and presets made from them, again.)
		const key = JSON.stringify([(status.favorites ?? []).map((f) => [f.id, f.name]), (status.tabs ?? []).length])
		if (key !== this.listsKey) {
			this.listsKey = key
			this.updateDefinitions()
		}
		this.setVariableValues(variableValues(this))
		this.checkAllFeedbacks()
	}

	onFailure(e) {
		const message = e?.message ?? String(e)
		const auth = e instanceof ApiError && e.status === 401
		const wasConnected = this.connected
		this.connected = false
		this.setStatus(auth ? InstanceStatus.AuthenticationFailure : InstanceStatus.ConnectionFailure, message)
		if (message !== this.lastError || wasConnected) this.log(auth ? 'error' : 'warn', message)
		this.lastError = message
		if (wasConnected) {
			this.setVariableValues(variableValues(this))
			this.checkAllFeedbacks()
		}
	}

	// ---- Definitions -------------------------------------------------------------------------------

	updateDefinitions() {
		updateActions(this)
		updateFeedbacks(this)
		updatePresets(this)
	}

	updateVariableDefinitions() {
		updateVariableDefinitions(this)
	}

	/** The favorites, as dropdown choices (by id, so a button keeps its favorite when they're reordered). */
	favoriteChoices() {
		const favs = this.status?.favorites ?? []
		return favs.length
			? favs.map((f) => ({ id: f.id, label: `${f.n}. ${f.name}` }))
			: [{ id: '1', label: '1 (not connected yet)' }]
	}

	/**
	 * What to send for a favorite as an action's option has it: its id if it's one of the app's,
	 * otherwise a number is its place (n) and anything else part of its name. (A dropdown that
	 * allows typing: "3" or "scores" work too.)
	 */
	favoriteArgs(value) {
		const v = String(value ?? '').trim()
		if ((this.status?.favorites ?? []).some((f) => f.id === v)) return { id: v }
		if (/^\d+$/.test(v)) return { n: v }
		return { name: v }
	}

	/** The favorite an option names (as favoriteArgs), from the app's status: or undefined. */
	findFavorite(value) {
		const favs = this.status?.favorites ?? []
		const a = this.favoriteArgs(value)
		if (a.id) return favs.find((f) => f.id === a.id)
		if (a.n) return favs.find((f) => f.n === Number(a.n))
		const name = a.name.toLowerCase()
		return favs.find((f) => f.name.toLowerCase() === name) ?? favs.find((f) => f.name.toLowerCase().includes(name))
	}

	/**
	 * The picture of the tab at place n, as a base64 PNG fitting width × height, for its button: the
	 * one we have, if it's of the tab there now (or undefined). A new one is fetched, in the
	 * background, when the app has one newer than ours; its feedback is checked again once it's here.
	 */
	tabPicture(n, width, height) {
		const tab = this.connected ? this.status?.tabs?.[n - 1] : undefined
		if (!tab?.picture) return undefined
		const slot = `${n}:${width}x${height}`
		const key = `${tab.id}:${tab.picture}:${width}x${height}`
		const have = this.pictures.get(slot)
		if (have?.key !== key && !this.fetching.has(key) && this.api) {
			this.fetching.add(key)
			const api = this.api
			api
				.png('tab-picture', { id: tab.id, width, height })
				.then((png64) => {
					// (Not from a connection since replaced: configUpdated.)
					if (api !== this.api) return
					if (png64) this.pictures.set(slot, { key, tabId: tab.id, png64 })
					else this.pictures.delete(slot)
					this.checkFeedbacks('tab_picture')
				})
				.catch((e) => this.log('debug', `tab ${n}'s picture: ${e.message}`))
				.finally(() => this.fetching.delete(key))
		}
		// (Not a picture of the tab that was here before: the tabs have moved.)
		return have?.tabId === tab.id ? have.png64 : undefined
	}

	/** The tab a favorite is open in (as the app finds it: the same address, give or take a last /), or undefined. */
	favoriteTab(fav) {
		if (!fav) return undefined
		const strip = (u) => String(u ?? '').replace(/\/$/, '')
		return (this.status?.tabs ?? []).find((t) => t.url && strip(t.url) === strip(fav.url))
	}
}
