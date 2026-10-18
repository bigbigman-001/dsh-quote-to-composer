# dsh-quote-to-composer

[中文](README.md) | English

Select any text inside DeepSeek Harness — assistant replies, code blocks, tables, the
right-side preview, the sidebar — and quote it straight into the current session's
composer. Then type your follow-up and send both together.

![A quote pill appears next to the pointer after selecting text](docs/screenshot-pill.png)

![The composer holds a tiny quote chip; hovering it shows the full quoted text](docs/screenshot-chip.png)

## What it does

1. **Quote a selection.** Select text with the mouse and release — a small dark
   **Quote** pill appears just below-right of the pointer. Click it (it flips to the
   other side near the screen edge). Keyboard users can press `Ctrl+Shift+Q`
   (`Ctrl` on every platform on purpose: `Cmd+Shift+Q` logs out of macOS).
2. **Quote a whole reply.** Each finished assistant message gets a *Quote this reply*
   action next to copy / good / bad.
3. Either way the composer receives a **tiny rounded chip** — 21px tall, 12px type,
   a quote glyph and the word “Quote” — sitting inline with your text. **Hover the
   chip to read the full quoted content** in a dark card. Type your question, send.

In the sent message the quote renders as a quote card, and the model receives it as a
Markdown blockquote:

```
> the quoted lines
```

## Install

```sh
dsh plugin --profile desktop add github:bigbigman-001/dsh-quote-to-composer
```

Refresh the page afterwards — no restart needed.

## Publishing

- Zero-to-listed walkthrough (GitHub account, empty repo, push, `dsh-plugin` topic,
  24-hour wait, PR): [docs/PUBLISH.md](docs/PUBLISH.md) (Chinese).
- One-shot push helper (writes `repository`/`homepage`/`bugs`, `git init`, commit, push):

  ```powershell
  powershell -ExecutionPolicy Bypass -File .\scripts\publish.ps1 -GitHubUser bigbigman-001
  ```

- Store entry template: [docs/awesome-dsh-plugin-entry.yml](docs/awesome-dsh-plugin-entry.yml)
- Store screenshots: [screenshots.json](screenshots.json) → `docs/screenshot-*.png`

## How it works

- Four mount points, each registered defensively so one failure cannot take the rest down:
  - `conversation.input.dock` — a headless `Capture` that publishes the session's
    `inputActions` and mirrors `useInput().occurrences` / `.detectText`;
  - `conversation.chat.assistant-actions` — the *Quote this reply* action;
  - `conversation.user.text.node` + a `uiConversation.userText` rule — renders the
    sent `> …` paragraph as a quote card;
  - `inputTriggers.registerSource()` — the `source: 'quote'` serialization owner, without
    which the composer cannot turn the chip back into prompt text.
- Insertion goes through
  `inputTriggers.sessionOf(session.ctx).execute({ insert: reference }, span)` →
  session event `slash/input-insert-reference` → `shell.insertReference()`, producing a
  `ReferenceChipNode` whose label is “Quote” and whose `clipboardText` is the full
  `> …` block (plus a blank line, so a follow-up typed right behind the chip can never be
  swallowed by the lazy-continuation rule of Markdown).
- The chip is restyled with CSS over `[data-composer-chip="quote"]`; the hover card is a
  self-built `.dqc-tip` fed only from `occurrences` (never from the DOM), so it survives a
  reload and can never show the wrong quote. The shipped `title="引用"` is removed on
  hover so the native tooltip does not stack on top of the card.
- Nothing is written to disk and no network request is made: this is a pure view
  interaction plus one serializer registration.

## Verified

Real page, v0.9.0: pill placement and edge flipping; chip metrics (21px / 999px radius /
12px); hover card content and dismissal; two quotes in one draft keep their own content;
chip and hover survive a reload; end-to-end send renders the quote card and the model
answers from the quoted text; `@` picker shows no empty group; no console warnings;
`node --check` clean.

## License

MIT
