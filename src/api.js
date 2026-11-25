// Broadcast Browser's control API, over HTTP, with every request signed with the API token (the app's
// src/http.js has the other half): the token itself never crosses the network, and a request someone
// overhears can't be sent again. Each request carries:
//
//   X-BB-Time       now, in milliseconds since 1970 (allowing for how far this computer's clock is
//                   from the app's Mac: learned from X-BB-Time on a 401)
//   X-BB-Nonce      a one-off random value
//   X-BB-Signature  hex HMAC-SHA256, keyed with the token, of "BB1", the method, the path and query,
//                   X-BB-Time, X-BB-Nonce and the body's SHA-256 in hex, one per line

import { createHash, createHmac, randomBytes } from 'node:crypto'

const TIMEOUT_MS = 4000

/** What a request signs: the same lines as the app's signedText (src/http.js). */
export function signedText(method, path, time, nonce, body) {
	const bodyHash = createHash('sha256')
		.update(body ?? '')
		.digest('hex')
	return ['BB1', method.toUpperCase(), path, String(time), nonce, bodyHash].join('\n')
}

/** An error from the app (its message), or about reaching it. `status`: the HTTP status, if there was an answer. */
export class ApiError extends Error {
	constructor(message, status = null) {
		super(message)
		this.status = status
	}
}

export class Api {
	/**
	 * @param {{ host: string, port: number, token: string }} o token: '' to send none (the app's api-token off)
	 */
	constructor({ host, port, token }) {
		this.base = `http://${host.includes(':') && !host.startsWith('[') ? `[${host}]` : host}:${port}`
		this.token = token
		/** How far the app's clock is ahead of this one's, in ms. */
		this.clockOffset = 0
	}

	/** The query string for args: { url: 'x', take: true } → ?url=x&take=true (undefined and '' left out). */
	static query(args = {}) {
		const q = new URLSearchParams()
		for (const [k, v] of Object.entries(args)) if (v !== undefined && v !== null && v !== '') q.set(k, String(v))
		const s = q.toString()
		return s ? `?${s}` : ''
	}

	/** GET /<command>?<args>: the app's answer ({ ok: true, ... }), or throws an ApiError. */
	async get(command, args) {
		return this.request('GET', `/${command}${Api.query(args)}`)
	}

	/**
	 * GET /<command>?<args> for a PNG (the app's /tab-picture): the picture, base64, or null if the
	 * app has none (404). Throws an ApiError otherwise.
	 */
	async png(command, args) {
		try {
			return await this.request('GET', `/${command}${Api.query(args)}`, undefined, false, true)
		} catch (e) {
			if (e instanceof ApiError && e.status === 404) return null
			throw e
		}
	}

	async request(method, path, body, retried = false, wantPng = false) {
		const headers = {}
		const data = body === undefined ? '' : JSON.stringify(body)
		if (body !== undefined) headers['content-type'] = 'application/json'
		if (this.token) {
			const time = String(Date.now() + this.clockOffset)
			const nonce = randomBytes(18).toString('base64url')
			headers['x-bb-time'] = time
			headers['x-bb-nonce'] = nonce
			headers['x-bb-signature'] = createHmac('sha256', this.token)
				.update(signedText(method, path, time, nonce, data))
				.digest('hex')
		}
		let res
		try {
			res = await fetch(this.base + path, {
				method,
				headers,
				body: method === 'GET' ? undefined : data,
				signal: AbortSignal.timeout(TIMEOUT_MS),
			})
		} catch (e) {
			const why = e?.name === 'TimeoutError' ? 'no answer' : (e?.cause?.code ?? e?.message ?? String(e))
			throw new ApiError(`can't reach Broadcast Browser at ${this.base} (${why})`)
		}
		if (wantPng && res.ok && res.headers.get('content-type')?.startsWith('image/png'))
			return Buffer.from(await res.arrayBuffer()).toString('base64')
		let answer = null
		try {
			answer = await res.json()
		} catch {
			// (Not JSON: said below.)
		}
		if (res.status === 401) {
			// (Our clock is off from the app's: allow for it, and try once more.)
			const theirs = Number(res.headers.get('x-bb-time'))
			const error = answer?.error ?? ''
			if (this.token && !retried && Number.isFinite(theirs) && /time/i.test(error)) {
				this.clockOffset = theirs - Date.now()
				return this.request(method, path, body, true, wantPng)
			}
			throw new ApiError(
				this.token
					? `Broadcast Browser refused the API token (${error || '401'}). Copy it again: in the app, File → Copy API Token`
					: 'Broadcast Browser needs its API token: in the app, File → Copy API Token, then paste it into this connection',
				401,
			)
		}
		if (!answer || typeof answer !== 'object')
			throw new ApiError(
				`Broadcast Browser answered ${res.status}, not JSON (is ${this.base} the control API?)`,
				res.status,
			)
		if (!answer.ok) throw new ApiError(answer.error ?? `Broadcast Browser answered ${res.status}`, res.status)
		return answer
	}
}
