# Security

**Please don't open a public issue for a security problem.** Report it privately: [Report a vulnerability](https://github.com/calebgroom/companion-module-broadcastbrowser/security/advisories/new) (the repository's **Security** tab → **Report a vulnerability**).

This module talks to [Broadcast Browser](https://github.com/calebgroom/broadcastbrowser)'s control API, signing every request with the app's API token so the token itself never crosses the network. In scope: anything that exposes the token, lets a request be forged, replayed or altered, or makes the module act on something other than the Broadcast Browser it's set up for. For problems in the app itself, see its [security policy](https://github.com/calebgroom/broadcastbrowser/blob/main/SECURITY.md).

Include the module's version, how to reproduce the problem, and what it lets someone do. Expect an acknowledgement within a week; only the latest release gets fixes.
