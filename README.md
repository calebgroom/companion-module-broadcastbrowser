# Broadcast Browser for Bitfocus Companion

A [Bitfocus Companion](https://bitfocus.io/companion) module for [Broadcast Browser](https://github.com/calebgroom/broadcastbrowser), the Mac app that shows web pages as a 1920×1080 NDI®, SDI and Syphon source, with a preview, a program and a take. For Companion **4.3 and later** (module API 2.0).

What it does, for Companion's users: [companion/HELP.md](companion/HELP.md), which Companion shows as the module's help.

## Installing it in Companion

1. `yarn install`, then `yarn package`: it makes `broadcastbrowser-<version>.tgz`. (Or download the `.tgz` from a [release](https://github.com/calebgroom/companion-module-broadcastbrowser/releases).)
2. In Companion, **Modules → Import module package**, and pick that file.
3. **Connections → Add connection → Broadcast Browser**: the Mac's address, port `8793`, and the API token (in Broadcast Browser, **File → Copy API Token**).

## How it talks to the app

Over the app's control API (its README, "Control API"), with every request **signed** with the API token (`src/api.js`; the app's `src/http.js` has the other half): an HMAC-SHA256 of the request, its time and a one-off nonce, keyed with the token. So the token never crosses the network, and a request someone overhears can't be sent again (the app takes each nonce once, and nothing more than a minute from its clock). If the two clocks are further apart than that, the app's `401` says what time it has, and the module allows for the difference by itself.

The module asks for the app's status (`/status`) every half second (**Check the app every**), and after each action, for the feedbacks and variables.

## Developing

It uses **yarn** (4, through Corepack: `corepack enable` once), as Bitfocus's module checks require: not npm or pnpm (no `package-lock.json` or `pnpm-lock.yaml`).

- `yarn install`. `.yarnrc.yml` is Bitfocus's template's: no install scripts, and no package published less than 3 days ago (except Companion's own).
- `yarn test`: the actions, feedbacks, variables and presets against a status like the app's, without Companion (`test/module.test.js`).
- `yarn format`: Prettier, with Companion's settings. `yarn check` checks it without changing anything.
- To run it from source in Companion: set Companion's **developer modules folder** (in its settings) to a folder holding this one; Companion loads it, and restarts it when a file changes.

## Releasing

1. The new version in `package.json` (the manifest's is filled in when it's packaged), committed and pushed. Every push runs Bitfocus's module checks (`.github/workflows/companion-module-checks.yaml`): yarn, the manifest, the build, and that the module loads.
2. A GitHub release with the tag `v<version>` (`v0.2.0` for 0.2.0: the checks refuse a tag that doesn't match `package.json`). Publishing it builds the package and attaches it to the release (`.github/workflows/release.yaml`).
3. For Companion's module store: submit it through Bitfocus's developer portal, as their guide to releasing a module describes (https://companion.free/for-developers/module-development/).

The files:

- `src/main.js`: the connection (config, polling the app, the status).
- `src/api.js`: the signed requests.
- `src/actions.js`, `src/feedbacks.js`, `src/variables.js`, `src/presets.js`: what Companion shows.
- `src/upgrades.js`: upgrade scripts, for buttons made with an older version (none yet).
- `companion/manifest.json`, `companion/HELP.md`: what Companion reads about the module.

## License

MIT (`LICENSE`), © 2026 Caleb Groom. NDI® is a registered trademark of Vizrt NDI AB. Bitfocus Companion is a project of Bitfocus AS; this module isn't affiliated with or endorsed by it.
