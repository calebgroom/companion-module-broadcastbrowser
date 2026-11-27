## Broadcast Browser

Controls [Broadcast Browser](https://github.com/calebgroom/broadcastbrowser), a Mac app that shows web pages as a 1920×1080 NDI®, SDI and Syphon source, with a preview and a program like a vision mixer: pages load into the **preview**, and **Take** puts them on air.

### Setting up

1. **Companion on the same Mac as Broadcast Browser:** the address is `127.0.0.1`, port `8793` (the defaults here). **On another computer:** in Broadcast Browser, **File → Control API → Listen On**, choose **All Networks** or the network Companion is on (at first, the app listens on its own Mac only). Then **File → Control API → Copy Control API Address**: the address and port to enter here are at its start (`http://10.0.0.5:8793/…`: address `10.0.0.5`, port `8793`).
2. **File → Control API → Copy API Token**, and paste it into **API token**.

Every request is signed with the token, so the token itself never crosses the network, and a request someone overhears can't be sent again. If the app makes a new token (**File → Control API → New API Token…**), paste the new one here. If this computer's clock is off from the Mac's, the module allows for it by itself.

### Actions

- **Go to an address**, **Favorite**, **Home**: a page into the preview (tick _Put it on air once it has loaded_ to go straight to air). Words instead of an address are a Google search. A favorite is picked by name; you can also type its number or part of its name.
- **Go to an address** can also load into a particular tab (**In tab**: its number, or text in its address or title, such as `cca.umptrax.com`), wherever that tab is: one in the background stays there, and **the tab on air changes on air**, held on the picture before while the page loads if Hold While Loading is on. One button per page, all pointed at the same tab, switches what that tab shows. Needs Broadcast Browser 0.3.0 or later.
- **Take** (the preview on air, the page on air into the preview), **Live**, **Freeze**, **Black**.
- **Tab** (by its place, from 1), **Next or previous tab**, **New tab**, **Close a tab**, **Reopen the closed tab**.
- **Back, forward, reload, stop**, **Scroll**, **Scroll to the top**, **Zoom**: on the preview, or on the page on air.
- **Switch a setting** (auto take, hold while loading, sound, scrollbars, ad blocking), **Ad blocking on a site**, **Output on or off** and **Outputs: NDI and SDI together** (for the program, what's on air, or the preview: each has its own NDI, SDI and Syphon outputs; the preview's need Broadcast Browser 0.2.0 or later, and with an older app the module switches nothing and logs why), **Sign out** (of the preview's site, the site on air, or every site: an end-of-show button).
- **Any API command**: anything else in the app's control API, by name, with its arguments.

### Feedbacks

What's on air (live, loading, frozen, black); a favorite or a tab on air, in the preview, or open (and a tab place with no tab); a tab's picture (its page, as on its card in the app); a page loading; a feed's output on, working, or on but not working; a feed's NDI tally; a setting on; and _Not connected_.

### Variables

`air_state`, `program_title`, `program_url`, `preview_title`, `preview_url`, their `_loading` and `_zoom`; `tab_1_title` to `tab_9_title` and `tab_1_state` to `tab_9_state`; `favorite_1_name` to `favorite_20_name`; `tab_count`, `favorite_count`, `outputs`, `ndi_name`, `ndi_receivers` (the program's), `preview_outputs`, `preview_ndi_name`, `preview_ndi_receivers` (the preview's), `last_message`, `connected`.

### Tab buttons

Drag the **Tabs** presets into a row: button 1 is always the first tab in the app, button 2 the second, and so on, as the app's Cmd+1–9. Each shows its tab's page and title, red when it's on air and green when it's in the preview, and follows the app as tabs open, close and move. With fewer tabs open than buttons, the rest show their number, dimmed. The pictures are as new as the app's cards (every 5 seconds, unless the app's **thumbs** setting says otherwise).

### Presets

On air (Take, Black, Freeze, Live, Home), one button per favorite, tabs 1–9 (each tab's picture and title; a place with no tab shows its number, dimmed), page controls, outputs (a row for the program, PGM, and one for the preview, PVW) and settings. Red: on air; green: in the preview, or on; amber: loading, or something wrong.

NDI® is a registered trademark of Vizrt NDI AB.
