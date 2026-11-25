## Broadcast Browser

Controls [Broadcast Browser](https://github.com/calebgroom/broadcastbrowser), a Mac app that shows web pages as a 1920×1080 NDI®, SDI and Syphon source, with a preview and a program like a vision mixer: pages load into the **preview**, and **Take** puts them on air.

### Setting up

1. In Broadcast Browser, **File → Copy Control API Address**: the address and port to enter here are at its start (`http://10.0.0.5:8793/…`: address `10.0.0.5`, port `8793`). If Companion runs on the same Mac, the address is `127.0.0.1`.
2. **File → Copy API Token**, and paste it into **API token**.

Every request is signed with the token, so the token itself never crosses the network, and a request someone overhears can't be sent again. If the app makes a new token (**File → New API Token…**), paste the new one here. If this computer's clock is off from the Mac's, the module allows for it by itself.

### Actions

- **Go to an address**, **Favorite**, **Home**: a page into the preview (tick _Put it on air once it has loaded_ to go straight to air). Words instead of an address are a Google search. A favorite is picked by name; you can also type its number or part of its name.
- **Take** (the preview on air, the page on air into the preview), **Live**, **Freeze**, **Black**.
- **Tab** (by its place, from 1), **Next or previous tab**, **New tab**, **Close a tab**, **Reopen the closed tab**.
- **Back, forward, reload, stop**, **Scroll**, **Scroll to the top**, **Zoom**: on the preview, or on the page on air.
- **Switch a setting** (auto take, hold while loading, sound, scrollbars, ad blocking), **Ad blocking on a site**, **Output on or off**, **Outputs: NDI and SDI together**.
- **Any API command**: anything else in the app's control API, by name, with its arguments.

### Feedbacks

What's on air (live, loading, frozen, black); a favorite or a tab on air, in the preview, or open; a page loading; an output on, working, or on but not working; NDI tally; a setting on; and _Not connected_.

### Variables

`air_state`, `program_title`, `program_url`, `preview_title`, `preview_url`, their `_loading` and `_zoom`; `tab_1_title` to `tab_9_title` and `tab_1_state` to `tab_9_state`; `favorite_1_name` to `favorite_20_name`; `tab_count`, `favorite_count`, `outputs`, `ndi_name`, `ndi_receivers`, `last_message`, `connected`.

### Presets

On air (Take, Black, Freeze, Live, Home), one button per favorite, tabs 1–9 (showing each tab's title), page controls, outputs and settings. Red: on air; green: in the preview, or on; amber: loading, or something wrong.

NDI® is a registered trademark of Vizrt NDI AB.
