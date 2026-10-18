# dsh-quote-to-composer

[中文](README.md) | English

> Select any text inside DSH, click **Quote**, and it becomes a tiny inline
> reference chip in the composer. Type your follow-up question and send both
> together — perfect for "what does this line mean?" style prompts.

![A small dark "Quote" pill appears next to the pointer after selecting text](docs/screenshot-pill.png)

![The mini reference chip in the composer; hover to see the full quoted text](docs/screenshot-chip.png)

## What it does

- **Quote a selection**: select text in an assistant reply, code block, table or
  sidebar preview, release the mouse, and a dark pill labelled `引用` (Quote)
  appears below-right of the pointer. Click it.
- **Quote a whole reply**: every assistant message gains a "quote this reply"
  action next to copy / good / bad.
- **Compact chip, not a wall of text**: the composer shows a 21px grey pill with
  a quote glyph and the word `引用`, sitting on the same line as your text.
- **Hover to read it**: hovering the chip opens a dark card with the full quoted
  content (line breaks and code preserved).
- **Sent as a quote card**: the sent message renders the quoted part as a card,
  and the model receives a standard Markdown quote block:

  ```
  > each quoted line
  ```

- **Keyboard**: `Ctrl+Shift+Q` (on macOS too — `Cmd+Shift+Q` is log out).
- Adapts to light/dark themes; a draft's chip survives a page reload, and hover
  still works afterwards.
- Pure front-end plugin, no native dependencies — **works on Windows, macOS and
  Linux**.

## Download

Both platform packages contain **exactly the same plugin code**; only the bundled
install notes differ.

| Platform | Download | Notes |
| --- | --- | --- |
| Windows | [dsh-quote-to-composer-0.9.2-windows.zip](https://github.com/bigbigman-001/dsh-quote-to-composer/releases/latest/download/dsh-quote-to-composer-0.9.2-windows.zip) | read `INSTALL-windows.md` inside |
| macOS | [dsh-quote-to-composer-0.9.2-macos.zip](https://github.com/bigbigman-001/dsh-quote-to-composer/releases/latest/download/dsh-quote-to-composer-0.9.2-macos.zip) | read `INSTALL-macOS.md` inside |
| Any | [dsh-quote-to-composer-0.9.2.tgz](https://github.com/bigbigman-001/dsh-quote-to-composer/releases/latest/download/dsh-quote-to-composer-0.9.2.tgz) | npm package, for people who prefer tarballs |

You can also install straight from DSH without downloading anything.

## Install

### Option A (recommended): install inside DSH

1. Open DSH and click **插件** (Plugins) in the left sidebar
2. Click **添加插件** (Add plugin)
3. Enter:

   ```
   github:bigbigman-001/dsh-quote-to-composer
   ```

   Tick the "mainland China mirror" checkbox in that dialog if GitHub is slow.
4. Click **安装** (Install), then reload the page

### Option B: unzip a package

1. Download the zip for your platform and unzip it to get a `dsh-quote-to-composer` folder
2. Open **插件 → 添加插件**
3. Enter the absolute path of that folder:
   - Windows: `D:\plugins\dsh-quote-to-composer`
   - macOS: `/Users/you/plugins/dsh-quote-to-composer`
4. **安装** → reload

### Option C: command line

```sh
dsh plugin --profile desktop add github:bigbigman-001/dsh-quote-to-composer
```

> Windows and macOS use identical steps: the plugin is front-end code only.
> On macOS the shortcut is still **Ctrl+Shift+Q**, not `Cmd+Shift+Q` (that logs out).

## Usage

1. Select some text with the mouse, release → click the `引用` pill (or press
   `Ctrl+Shift+Q`; or use "quote this reply" under an assistant message)
2. A grey `引用` chip appears in the composer — hover it to confirm the content
3. Type your question and send as usual

The sent message shows the quoted part as a card, and the model sees a `> …`
quote block, so it knows exactly what you are asking about.

> The pill only appears when you actually selected text with the mouse outside
> the composer. Clicking elsewhere, scrolling or pressing `Esc` dismisses it.

## Uninstall / update

- Uninstall: DSH → 插件 → installed plugins → `dsh-quote-to-composer` → uninstall
- Update: run the install again (or point at the new folder / `github:` spec)

## FAQ

| Symptom | Cause / fix |
| --- | --- |
| No pill after selecting | The selection is inside the composer (intentionally ignored), or nothing was really selected |
| `Ctrl+Shift+Q` does nothing | Focus is not on the page, or the shortcut collides with another app |
| A chip is stuck in the composer | Click into the composer, `Ctrl+A` then `Delete` |
| Hover card is empty | The draft was modified externally; delete the chip and quote again |
| The model seems to miss the quote | Check the sent bubble for the quote card; if it is missing, quote again |
| Chip styling looks off | Requires a reasonably new Chromium (Electron / Chrome 105+); older engines fall back to a solid colour |

## Compatibility

- Loaded as `window.__ModuleLoader__.load(...)` — a browser module, no Windows/macOS-specific APIs
- Uses only standard browser features: `getSelection`, `Range`, CSS `color-mix()` (with a solid fallback)
- Font stack includes `-apple-system` / `PingFang SC`; the icon uses both `-webkit-mask` and `mask`

## For developers

### Layout

```
client.js           all front-end logic (the host half, index.js, is intentionally empty)
index.js            export function apply() {} — deliberately empty
cordis.patch.yml    mount declaration
locale/{zh,en}.json UI strings
icon.svg            store icon
screenshots.json    store screenshot manifest
docs/               screenshots, install guides, publishing walkthrough
scripts/publish.ps1 one-shot publish helper (for the maintainer)
```

### How it works

- Four mount points, each isolated with try/catch so one failure cannot break the rest:
  - `conversation.input.dock` — a headless `Capture` that publishes the session's
    `inputActions` to a module-level `live`, and mirrors `useInput().occurrences`
    into `liveOccurrences` (that is how a chip restored from a reload still shows
    its hover card);
  - `conversation.chat.assistant-actions` — the "quote this reply" button;
  - `conversation.user.text.node` plus a `uiConversation.userText` rule named `quote` —
    renders the sent `> …` paragraphs as a quote card;
  - `inputTriggers.registerSource(QUOTE_SOURCE)` — the serializer owner for `source: 'quote'`.
- Insertion goes through `inputTriggers.sessionOf(session.ctx).execute({ insert: reference }, span)`
  → the session event `slash/input-insert-reference` → `shell.insertReference()`,
  producing a `ReferenceChipNode` whose `label` is `引用` and whose `clipboardText`
  is the full `> …` block (that is exactly what the model receives). If insertion
  fails, it falls back to plain text insertion.
- The chip does not use DSH's default chip styling: CSS overrides
  `[data-composer-chip="quote"]` (grey background, fully rounded, 21px tall, 12px
  font) and draws its own quote glyph with `::before` + a mask data URI.
- The hover card `.dqc-tip` is driven by delegated `mouseover`/`mouseout` and takes
  its content only from `occurrences` entries whose `source === 'quote'`, aligned by
  chip order with the `> ` prefix stripped. No quoted text is cached in the DOM,
  which avoids mis-labelling when several chips are inserted.
- Sending requires a codec for `source: 'quote'`, otherwise DSH fails the send with
  `slash: no serializer for reference source "quote"` — hence `QUOTE_SOURCE`.
- The prompt text is `> each line` plus one **blank line**. The blank line lives in
  the chip's `clipboardText` rather than being inserted afterwards (an extra
  `insertText` would fight the insertion offsets and leave stray blank lines when
  quoting twice), and it prevents a following question from being swallowed into
  the quote block by Markdown lazy continuation.

## Verified

- Checked item by item on a real page: pill placement and edge flipping; chip
  metrics (`height: 21px`); hover card content; two chips quoting different text
  without mixing; chip restored from a draft after reload with working hover; dark
  theme colours; end-to-end "quote a sentence + ask a follow-up" (the sent bubble
  renders a quote card and the model answers about the quoted text); no plugin
  warnings in the console.
- The user-text rendering rule passes 8/8 unit cases.
- 0.9.0 / 0.9.1 / 0.9.2 changed packaging and docs only.

## License

[MIT](LICENSE)
