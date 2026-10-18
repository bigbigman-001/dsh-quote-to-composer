/**
 * Quote to Composer — browser half.
 *
 * 把 DSH 里选中的文字 / 某条助手回复，变成输入框里的**原子引用芯片**
 * （和 @ 文件引用同一种 chip），再带一句追问一起发出去。
 *
 * 三个入口：
 *   1. 浮动胶囊 —— 在界面里选中任意文字，选区旁浮出「引用到输入框」，
 *      点击后把选区做成 chip 插到当前会话输入框。
 *   2. 助手回复动作行 —— 每条回复的复制/反馈按钮旁多一个「引用这条回复」，
 *      点击后把整条回复做成 chip 插到输入框。
 *   3. 用户气泡 —— 发出的消息里，芯片携带的 `> …` 引用块被渲染成引用卡片，
 *      而不是一排字面 `>`。
 *
 * 芯片的 `clipboardText` 就是提交给模型的正文（`> 每行`），因此引用对模型
 * 完全可见；芯片本身用 `ReferenceChipNode` 渲染，视觉上与 @ 引用一致。
 *
 * `Capture` 挂在 `conversation.input.dock` 上，把该会话的 `inputActions`
 * 发布到模块级 `live`：浮动胶囊与动作按钮共用这一份契约。
 */
window.__ModuleLoader__.load({
  id: 'dsh-quote-to-composer',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const DOCK_SLOT = 'conversation.input.dock';
    const DOCK_ID = 'quote-to-composer.capture';
    const ACTION_SLOT = 'conversation.chat.assistant-actions';
    const ACTION_ID = 'quote-to-composer.quote-message';
    const NODE_SLOT = 'conversation.user.text.node';
    const RULE_ID = 'quote';
    const SOURCE_NAME = 'quote';
    const NS = 'quoteToComposer';
    const STYLE_ID = 'dsh-quote-to-composer/style';

    const COPY = {
      zh: {
        chip: '引用',
        hint: '引用到输入框 · Ctrl+Shift+Q',
        message: '引用这条回复',
        done: '已引用',
        empty: '没有可引用的文字',
        failed: '输入框正忙，请稍后再试',
        unavailable: '输入框当前不可用',
      },
      en: {
        chip: 'Quote',
        hint: 'Quote to composer · Ctrl+Shift+Q',
        message: 'Quote this reply',
        done: 'Quoted',
        empty: 'Nothing to quote',
        failed: 'Composer is busy — try again',
        unavailable: 'Composer unavailable',
      },
    };

    const CSS = [
      /* floating selection pill — sits to the right of the pointer */
      '.dqc-chip{position:fixed;z-index:2147481000;display:inline-flex;align-items:center;gap:6px;',
      'height:28px;padding:0 12px 0 10px;margin:0;border:0;border-radius:999px;',
      'background:var(--dsw-alias-tooltip-bg,#2c2c2e);',
      'background:color-mix(in srgb,var(--dsw-alias-tooltip-bg,#2c2c2e) 92%,transparent);',
      'color:rgba(255,255,255,.96);',
      'font:500 12px/1 var(--dsw-font-family,-apple-system,"Segoe UI","PingFang SC",sans-serif);letter-spacing:.02em;',
      'white-space:nowrap;cursor:pointer;user-select:none;-webkit-user-select:none;',
      'box-shadow:0 1px 2px rgba(0,0,0,.20),0 8px 20px -6px rgba(0,0,0,.28);',
      'backdrop-filter:blur(8px) saturate(140%);-webkit-backdrop-filter:blur(8px) saturate(140%);',
      'transform-origin:0 50%;opacity:0;transform:translateX(-3px) scale(.92);',
      'transition:opacity 120ms ease,transform 160ms cubic-bezier(.22,1,.36,1),background 110ms ease;',
      'pointer-events:none}',
      '.dqc-chip[data-side=left]{transform-origin:100% 50%;transform:translateX(3px) scale(.92)}',
      '.dqc-chip[data-visible=true]{opacity:1;transform:none;pointer-events:auto}',
      '.dqc-chip:hover{background:var(--dsw-alias-tooltip-bg,#2c2c2e);',
      'background:color-mix(in srgb,var(--dsw-alias-tooltip-bg,#2c2c2e) 80%,#fff)}',
      '.dqc-chip:active{transform:scale(.97)}',
      '.dqc-chip:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid #8ab4ff;outline-offset:2px}',
      '.dqc-chip svg{width:14px;height:14px;flex:none;color:#8ab4ff;transform:translateY(.5px)}',
      '.dqc-chip-label{display:block}',
      '.dqc-chip[data-state=done]{background:var(--dsw-alias-state-success-primary,#22c55e);color:#fff}',
      '.dqc-chip[data-state=failed],.dqc-chip[data-state=empty],.dqc-chip[data-state=unavailable]{background:var(--dsw-alias-state-error-primary,#ec1313);color:#fff}',
      /* message action row button */
      '.dqc-action{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:0;',
      'border-radius:var(--dsw-radius-sm,8px);background:transparent;color:var(--dsw-alias-label-tertiary,currentColor);',
      'cursor:pointer;transition:background 90ms ease}',
      '.dqc-action:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.16))}',
      '.dqc-action:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#2f6feb);outline-offset:1px}',
      '.dqc-action svg{width:16px;height:16px;display:block}',
      '.dqc-action[data-state=done]{color:var(--dsw-alias-state-success-primary,#2f9e5f)}',
      '.dqc-action[data-state=failed]{color:var(--dsw-alias-state-error-primary,#ec1313)}',
      /* quoted block inside a sent user bubble */
      '.dqc-quote{display:block;margin:8px 0;padding:8px 12px;border-left:2px solid var(--dsw-alias-state-business-primary,#4176e6);',
      'border-radius:0 var(--dsw-radius-xs,4px) var(--dsw-radius-xs,4px) 0;background:var(--dsw-alias-markdown-placeholder,#f5f6f7);',
      'color:var(--dsw-alias-label-secondary,#61666b);font-size:.94em;line-height:1.55;',
      'white-space:pre-wrap;word-break:break-word}',
      '.dqc-quote-body{display:block}',
      /* composer quote chip: a compact grey "引用" bar, body-text sized */
      '[data-composer-chip="quote"]{display:inline-flex;align-items:center;margin:0 2px;vertical-align:baseline;cursor:default}',
      '[data-composer-chip="quote"]>span{display:inline-flex;align-items:center;gap:4px;height:21px;padding:0 9px 0 8px;',
      'border-radius:999px;background:var(--dsw-alias-markdown-placeholder,#f2f3f5);',
      'color:var(--dsw-alias-label-secondary,#61666b);',
      'font:500 12px/1 var(--dsw-font-family,-apple-system,"Segoe UI","PingFang SC",sans-serif);letter-spacing:.01em;',
      'transition:background 110ms ease,color 110ms ease}',
      '[data-composer-chip="quote"] svg{display:none}',
      `[data-composer-chip="quote"]>span::before{content:"";width:11px;height:11px;flex:none;background-color:currentColor;opacity:.6;`,
      `-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23000' d='M10 6C6.9 6 4.4 8.5 4.4 11.6c0 2.9 2.2 5.1 5 5.1.4 0 .8 0 1.2-.1-.6 1.7-2 3-3.8 3.5l.7 1.9c3.6-1 6.1-4.2 6.1-8.1V11c0-2.8-1.7-5-3.6-5Zm9.4 0c-3.1 0-5.6 2.5-5.6 5.6 0 2.9 2.2 5.1 5 5.1.4 0 .8 0 1.2-.1-.6 1.7-2 3-3.8 3.5l.7 1.9c3.6-1 6.1-4.2 6.1-8.1V11c0-2.8-1.7-5-3.6-5Z'/%3E%3C/svg%3E") center/contain no-repeat;`,
      `mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23000' d='M10 6C6.9 6 4.4 8.5 4.4 11.6c0 2.9 2.2 5.1 5 5.1.4 0 .8 0 1.2-.1-.6 1.7-2 3-3.8 3.5l.7 1.9c3.6-1 6.1-4.2 6.1-8.1V11c0-2.8-1.7-5-3.6-5Zm9.4 0c-3.1 0-5.6 2.5-5.6 5.6 0 2.9 2.2 5.1 5 5.1.4 0 .8 0 1.2-.1-.6 1.7-2 3-3.8 3.5l.7 1.9c3.6-1 6.1-4.2 6.1-8.1V11c0-2.8-1.7-5-3.6-5Z'/%3E%3C/svg%3E") center/contain no-repeat}`,
      '[data-composer-chip="quote"]:hover>span{background:var(--dsw-alias-bg-overlay,#e9ecf2);color:var(--dsw-alias-label-primary,#111)}',
      /* hover card carrying the quoted text */
      '.dqc-tip{position:fixed;z-index:2147481000;max-width:360px;max-height:240px;overflow:auto;padding:8px 10px;',
      'border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-tooltip-bg,#2c2c2e);',
      'color:var(--dsw-alias-tooltip-label,#fff);',
      'font:400 12px/1.55 var(--dsw-font-family,-apple-system,"Segoe UI","PingFang SC",sans-serif);',
      'white-space:pre-wrap;word-break:break-word;box-shadow:0 8px 24px rgba(0,0,0,.22);',
      'opacity:0;transform:translateY(2px);transition:opacity 110ms ease,transform 140ms ease;pointer-events:none}',
      '.dqc-tip[data-visible=true]{opacity:1;transform:none}',
    ].join('');

    let attachedStyle = false;

    function ensureStyle() {
      if (attachedStyle) return;
      attachedStyle = true;
      try {
        if (typeof document === 'undefined' || document.getElementById(STYLE_ID) !== null) return;
        const tag = document.createElement('style');
        tag.id = STYLE_ID;
        tag.textContent = CSS;
        document.head.appendChild(tag);
      } catch (error) { /* styling is best effort */ }
    }

    /* ------------------------------- copy ------------------------------- */

    let bound = null;

    function prefersZh() {
      try {
        const lang = (document.documentElement.getAttribute('lang') || (typeof navigator === 'object' && navigator.language) || '').toLowerCase();
        return lang.indexOf('zh') === 0;
      } catch (error) {
        return false;
      }
    }

    function t(key) {
      if (typeof bound === 'function') {
        try {
          const value = bound(key);
          if (typeof value === 'string' && value !== '' && value !== key) return value;
        } catch (error) { /* fall through to the local dictionary */ }
      }
      const dict = prefersZh() ? COPY.zh : COPY.en;
      const value = dict[key];
      return typeof value === 'string' ? value : (COPY.en[key] || key);
    }

    /* ----------------------------- services ----------------------------- */

    let rootCtx = null;

    function service(name) {
      try {
        const ctx = rootCtx;
        return ctx !== null && typeof ctx.get === 'function' ? ctx.get(name) : undefined;
      } catch (error) {
        return undefined;
      }
    }

    /** The session-scoped slash controller; it owns the reference-insert event. */
    function sessionController(sessionId) {
      if (typeof sessionId !== 'string' || sessionId === '') return null;
      try {
        const sessions = service('sessions');
        const triggers = service('inputTriggers');
        const binding = sessions && typeof sessions.binding === 'function'
          ? sessions.binding(sessionId)
          : undefined;
        const actx = binding && binding.ctx;
        if (!actx || !triggers || typeof triggers.sessionOf !== 'function') return null;
        return triggers.sessionOf(actx) || null;
      } catch (error) {
        return null;
      }
    }

    /* --------------------------- composer binding ----------------------- */

    /** Live composer binding of the mounted session, published by `Capture`. */
    let live = null;
    /** Reference occurrences of the live draft, used to recover chip text. */
    let liveOccurrences = null;
    /** Detect text of the live draft: the same coordinates as a captured span. */
    let liveDraft = '';

    function Capture(props) {
      const actions = props.inputActions;
      const sessionId = props.sessionId;
      const read = typeof props.useInput === 'function' ? props.useInput : null;
      const occurrences = read === null
        ? null
        : read((state) => (state && Array.isArray(state.occurrences) ? state.occurrences : null));
      const draft = read === null
        ? null
        : read((state) => (state && typeof state.detectText === 'string' ? state.detectText : null));
      React.useEffect(() => {
        liveOccurrences = occurrences || null;
      }, [occurrences]);
      React.useEffect(() => {
        liveDraft = typeof draft === 'string' ? draft : '';
      }, [draft]);
      React.useEffect(() => {
        if (!actions) return undefined;
        const entry = { actions, sessionId };
        live = entry;
        return () => {
          if (live === entry) live = null;
        };
      }, [actions, sessionId]);
      return null;
    }

    function composerEditor() {
      try {
        const nodes = document.querySelectorAll('[contenteditable="true"]');
        return nodes.length > 0 ? nodes[0] : null;
      } catch (error) {
        return null;
      }
    }

    /* ----------------------------- selection ---------------------------- */

    /**
     * The current usable selection: non-empty text, outside the composer.
     * Anything the user highlights inside DSH qualifies — a reply, a tool card,
     * a diff, the sidebar. The composer is excluded on purpose: quoting text the
     * user is already editing back into the same draft is never what they mean.
     */
    function selectedText() {
      try {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return '';
        const text = selection.toString();
        if (typeof text !== 'string' || text.trim() === '') return '';
        const anchor = selection.anchorNode;
        const element = anchor === null || anchor === undefined
          ? null
          : (anchor.nodeType === 1 ? anchor : anchor.parentElement);
        if (element !== null && element.closest('[contenteditable="true"]')) return '';
        return text;
      } catch (error) {
        return '';
      }
    }

    /* ------------------------------- icons ------------------------------ */

    const QUOTE_PATH = 'M10.9 3.4c-2.6 1.2-4 3.2-4 6 0 2.2 1.3 3.7 3.2 3.7 1.7 0 2.9-1.2 2.9-2.9 0-1.6-1.1-2.7-2.6-2.7-.2 0-.4 0-.6.1.3-1.1 1.1-2 2.4-2.8L10.9 3.4Zm6.9 0c-2.6 1.2-4 3.2-4 6 0 2.2 1.3 3.7 3.2 3.7 1.7 0 2.9-1.2 2.9-2.9 0-1.6-1.1-2.7-2.6-2.7-.2 0-.4 0-.6.1.3-1.1 1.1-2 2.4-2.8l-1.3-1.4Z';
    const DONE_PATH = 'M13.9 3.9a1 1 0 0 1 1.4 1.4l-7.2 7.2a1 1 0 0 1-1.4 0L3.2 9.1a1 1 0 1 1 1.4-1.4l2.8 2.8 6.5-6.6Z';

    function icon(path) {
      return h('svg', { viewBox: '0 0 24 24', 'aria-hidden': true, focusable: 'false' },
        h('path', { fill: 'currentColor', d: path }));
    }

    /* ---------------------------- floating pill ------------------------- */

    let chip = null;
    let flashTimer = null;
    let armed = '';          // selection captured at mouseup — survives focus loss
    let ignoreUntil = 0;     // quiet window after an insert, so the pill stays down

    function chipText(state) {
      if (state === 'done') return t('done');
      if (state === 'empty') return t('empty');
      if (state === 'failed') return t('failed');
      if (state === 'unavailable') return t('unavailable');
      return t('chip');
    }

    function paintChip(state) {
      if (chip === null) return;
      const text = chipText(state);
      chip.setAttribute('data-state', state || '');
      chip.setAttribute('aria-label', text);
      chip.setAttribute('title', state ? text : t('hint'));
      const label = chip.querySelector('.dqc-chip-label');
      if (label !== null) label.textContent = text;
      const path = chip.querySelector('svg path');
      if (path !== null) path.setAttribute('d', state === 'done' ? DONE_PATH : QUOTE_PATH);
    }

    function ensureChip() {
      if (chip !== null && chip.isConnected) return chip;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'dqc-chip';
      button.setAttribute('data-visible', 'false');
      button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="'
        + QUOTE_PATH + '"></path></svg><span class="dqc-chip-label"></span>';
      // Never steal the DOM selection: without preventDefault the editor and the
      // highlight would both be dropped before the click handler runs.
      button.addEventListener('mousedown', (event) => {
        try { event.preventDefault(); } catch (error) { /* keep going */ }
      });
      button.addEventListener('click', (event) => {
        try { event.preventDefault(); event.stopPropagation(); } catch (error) { /* keep going */ }
        activate();
      });
      document.body.appendChild(button);
      chip = button;
      paintChip('');
      return button;
    }

    function destroyChip() {
      if (flashTimer !== null) {
        window.clearTimeout(flashTimer);
        flashTimer = null;
      }
      if (chip !== null) {
        try { chip.remove(); } catch (error) { /* already detached */ }
        chip = null;
      }
      armed = '';
    }

    /** Park it just right of the pointer, flipping inward near the edges. */
    function placeChip(x, y) {
      if (chip === null) return;
      const gap = 14;
      const pad = 8;
      const width = chip.offsetWidth || 84;
      const height = chip.offsetHeight || 32;
      const vw = window.innerWidth || 1280;
      const vh = window.innerHeight || 800;
      let left = x + gap;
      let side = 'right';
      if (left + width > vw - pad) {
        left = Math.max(pad, x - gap - width);
        side = 'left';
      }
      let top = y + gap;
      if (top + height > vh - pad) top = Math.max(pad, y - gap - height);
      // Grow out of the edge that faces the pointer.
      chip.setAttribute('data-side', side);
      chip.style.left = Math.round(left) + 'px';
      chip.style.top = Math.round(top) + 'px';
    }

    function showChip(text, x, y) {
      const button = ensureChip();
      if (flashTimer !== null) {
        window.clearTimeout(flashTimer);
        flashTimer = null;
      }
      armed = text;
      paintChip('');
      button.setAttribute('data-visible', 'true');
      placeChip(x, y);
    }

    function hideChip() {
      armed = '';
      if (chip !== null && chip.isConnected) chip.setAttribute('data-visible', 'false');
    }

    function flashChip(state) {
      if (chip === null) return;
      paintChip(state);
      chip.setAttribute('data-visible', 'true');
      if (flashTimer !== null) window.clearTimeout(flashTimer);
      flashTimer = window.setTimeout(() => {
        flashTimer = null;
        armed = '';
        if (chip !== null) {
          chip.setAttribute('data-visible', 'false');
          paintChip('');
        }
      }, state === 'done' ? 800 : 1600);
    }

    /** The mouse-release moment raises the pill; keyboard selection does not. */
    function offerQuote(x, y) {
      if (live === null || !live.actions) return;
      if (Date.now() < ignoreUntil) return;
      const text = selectedText();
      if (text === '') return hideChip();
      showChip(text, x, y);
    }

    function activate() {
      const entry = live;
      if (entry === null || !entry.actions) return flashChip('unavailable');
      const text = armed !== '' ? armed : selectedText();
      if (text === '') return flashChip('empty');
      const outcome = insertQuote(entry, text);
      ignoreUntil = Date.now() + 600;
      flashChip(outcome === 'chip' || outcome === 'text' ? 'done' : outcome);
    }

    /* ------------------------------ insertion --------------------------- */

    function normalize(text) {
      return String(text)
        .replace(/\r\n?/g, '\n')
        .replace(/[ \t]+$/gm, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    function toBlockquote(text) {
      const out = [];
      for (const line of text.split('\n')) out.push(line.trim() === '' ? '>' : '> ' + line);
      return out.join('\n');
    }


    /** Prompt serialization owner for `source: 'quote'` chips.
     *  A draft that carries a chip is serialized through
     *  `inputTriggers.serializeReference(source, ref)`, and a source without a
     *  codec makes the send fail outright — so this half is not optional. */
    /** The text a quote occupies in the prompt: a markdown blockquote with a
     *  blank line after it, so a follow-up typed behind the chip can never be
     *  swallowed by the quote. The chip shows only its label; this text is what
     *  the composer stores and what the model reads. */
    function serializeQuote(body) {
      return toBlockquote(String(body == null ? '' : body)) + '\n\n';
    }

    const QUOTE_SOURCE = {
      trigger: '@',
      name: SOURCE_NAME,
      order: 60,
      showGroupTitle: false,
      async candidates() { return []; },
      codec: {
        clipboardText: (ref) => serializeQuote(ref),
        serialize: (ref) => Promise.resolve(serializeQuote(ref)),
      },
    };

    /** Run one insertion attempt, retrying once with a fresh span when the
     *  draft revision moved between capture and edit. */
    function withSpan(actions, run) {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        let span;
        try { span = actions.captureInsertion(); } catch (error) { return false; }
        if (!span) return false;
        try {
          if (run(span) === true) return true;
        } catch (error) {
          console.warn('[quote-to-composer] insert failed:', error);
          return false;
        }
      }
      return false;
    }

    function caretStart(actions) {
      try {
        const span = actions.captureInsertion();
        return span && typeof span.start === 'number' ? span.start : 0;
      } catch (error) {
        return 0;
      }
    }

    /**
     * Leading blank line so the quote starts its own paragraph.
     * Offsets from `captureInsertion` are coordinates of the draft's detect
     * text, so that is what gets sliced — `innerText` diverges as soon as the
     * draft carries a chip (a chip renders as its short label there).
     */
    function leadingBreak(actions) {
      const start = caretStart(actions);
      if (start <= 0) return '';
      let text = liveDraft;
      if (text === '') {
        const editor = composerEditor();
        text = editor === null ? '' : (typeof editor.innerText === 'string' ? editor.innerText : '');
      }
      const before = text.slice(0, start);
      if (/\n\n$/.test(before)) return '';
      if (/\n$/.test(before)) return '\n';
      return '\n\n';
    }


    /** The chip the composer shows for one quote: tiny label, full payload in
     *  `clipboardText`, so the model still receives the `> …` text. */
    function quoteReference(body) {
      return {
        source: SOURCE_NAME,
        ref: body,
        label: t('chip'),
        appearance: 'session',
        clipboardText: serializeQuote(body),
      };
    }

    /** Insert plain text through the public composer actions. */
    function nudge(actions, text) {
      if (text === '') return true;
      return withSpan(actions, (span) => actions.insertText(text, span));
    }

    /**
     * Quote whatever the user has selected into the live composer.
     * Keyboard path behind Ctrl+Shift+Q (the pill calls `activate` directly).
     * @returns boolean whether the shortcut was consumed
     */
    function quoteSelection() {
      const entry = live;
      if (entry === null || !entry.actions) return false;
      const text = selectedText();
      if (text === '') return false;
      const outcome = insertQuote(entry, text);
      // Only swallow the chord when something actually landed.
      return outcome === 'chip' || outcome === 'text';
    }

    /**
     * Drop the quote into the composer.
     * Preferred shape: one inline reference chip labelled "引用" whose hidden
     * payload is the `> …` block — small, body-text sized, and hover reveals the
     * content. Falls back to plain `> …` text when the chip path is unavailable.
     * @returns 'chip' | 'text' | 'empty' | 'failed' | 'unavailable'
     */
    function insertQuote(entry, text) {
      const body = normalize(text);
      if (body === '') return 'empty';
      const actions = entry && entry.actions;
      if (!actions
        || typeof actions.captureInsertion !== 'function'
        || typeof actions.insertText !== 'function') return 'unavailable';

      const controller = sessionController(entry.sessionId);
      let leadDone = false;
      if (controller !== null && typeof controller.execute === 'function') {
        const lead = leadingBreak(actions);
        leadDone = lead === '' || nudge(actions, lead);
        const reference = quoteReference(body);
        if (withSpan(actions, (span) => controller.execute({ insert: reference }, span))) {
          return 'chip';
        }
      }

      const payload = (leadDone ? '' : leadingBreak(actions)) + toBlockquote(body) + '\n';
      if (withSpan(actions, (span) => actions.insertText(payload, span))) return 'text';
      return 'failed';
    }

    /* --------------------------- message action ------------------------- */

    /** The finalized reply text behind one `messageId` (text blocks only). */
    function useAssistantText(useChat, messageId) {
      return useChat((snapshot) => {
        try {
          const timeline = snapshot && snapshot.timeline ? snapshot.timeline : null;
          const turns = timeline && timeline.turns ? timeline.turns : null;
          if (!turns) return '';
          for (const turn of turns.values()) {
            const data = turn && turn.data;
            const entry = data && typeof data.get === 'function' ? data.get('turn-tail') : undefined;
            const closing = entry && (entry.closing || (entry.data && entry.data.closing));
            const finalNode = closing && closing.finalNode;
            if (!finalNode || finalNode.messageId !== messageId) continue;
            const blocks = closing.blocks || [];
            let text = '';
            for (const block of blocks) {
              if (block && block.kind === 'text' && typeof block.text === 'string') text += block.text;
            }
            return text;
          }
        } catch (error) { /* fall through to empty */ }
        return '';
      });
    }

    function QuoteMessageAction(props) {
      const text = useAssistantText(props.useChat, props.messageId);
      const [state, setState] = React.useState('');
      const timer = React.useRef(null);
      React.useEffect(() => () => {
        if (timer.current !== null) window.clearTimeout(timer.current);
      }, []);
      const flashState = (next) => {
        setState(next);
        if (timer.current !== null) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
          timer.current = null;
          setState('');
        }, next === 'done' ? 1200 : 2200);
      };
      const onClick = (event) => {
        try { event.preventDefault(); event.stopPropagation(); } catch (error) { /* keep going */ }
        const outcome = insertQuote({ actions: props.inputActions, sessionId: props.sessionId }, text);
        if (outcome === 'empty') flashState('empty');
        else if (outcome === 'chip' || outcome === 'text') flashState('done');
        else flashState('failed');
      };
      const label = state === 'done' ? t('done') : state === 'empty' ? t('empty') : state === 'failed' ? t('failed') : t('message');
      return h('button', {
        type: 'button',
        className: 'dqc-action',
        'aria-label': label,
        title: label,
        'data-state': state || undefined,
        onClick,
      }, icon(state === 'done' ? DONE_PATH : QUOTE_PATH));
    }

    /* ---------------------------- bubble card --------------------------- */

    /** Render one `> …` block in a sent user message as a quote card. */
    function QuoteBlock(props) {
      const raw = typeof props.raw === 'string' ? props.raw : '';
      const lines = raw.split('\n').map((line) => line.replace(/^>[ \t]?/, ''));
      return h('span', { className: 'dqc-quote', title: raw },
        h('span', { className: 'dqc-quote-body' }, lines.join('\n')));
    }

    function nextQuoteLine(text, from) {
      let index = text.indexOf('>', from);
      while (index >= 0) {
        const lineStart = index === 0 || text.charAt(index - 1) === '\n';
        const after = text.charAt(index + 1);
        if (lineStart && (after === '' || after === ' ' || after === '\t' || after === '\n')) return index;
        index = text.indexOf('>', index + 1);
      }
      return -1;
    }

    /** Claim one run of consecutive `>` lines so they render as one card. */
    const QUOTE_RULE = {
      id: RULE_ID,
      order: 20,
      match(text, from) {
        const start = nextQuoteLine(text, from);
        if (start < 0) return undefined;
        let end = start;
        let cursor = start;
        for (;;) {
          const lineEnd = text.indexOf('\n', cursor);
          if (lineEnd < 0) {
            end = text.length;
            break;
          }
          const next = lineEnd + 1;
          if (next < text.length && text.charAt(next) === '>') {
            cursor = next;
            continue;
          }
          end = lineEnd;
          break;
        }
        if (end <= start) return undefined;
        return { id: RULE_ID, start, end };
      },
    };

    /* ---------------------------- hover card ---------------------------- */

    let tip = null;

    function ensureTip() {
      if (tip !== null && tip.isConnected) return tip;
      tip = document.createElement('div');
      tip.className = 'dqc-tip';
      tip.setAttribute('role', 'tooltip');
      document.body.appendChild(tip);
      return tip;
    }

    function stripBlockquote(text) {
      return text
        .split('\n')
        .map((line) => line.replace(/^>[ \t]?/, ''))
        .join('\n')
        .replace(/\s+$/, '');
    }

    /** The quoted text behind one composer chip.
     *  The draft's own occurrences are the source of truth — they survive a
     *  reload, while any DOM cache does not — matched to the element by order
     *  among `source: 'quote'` chips only. */
    function chipPayload(element) {
      try {
        const list = liveOccurrences;
        if (Array.isArray(list)) {
          const editor = composerEditor();
          const chips = editor === null
            ? []
            : [...editor.querySelectorAll('[data-composer-chip="' + SOURCE_NAME + '"]')];
          const index = chips.indexOf(element);
          const quotes = list.filter((item) => item && item.source === SOURCE_NAME);
          const quote = index < 0 ? undefined : quotes[index];
          if (quote && typeof quote.clipboardText === 'string') {
            return stripBlockquote(quote.clipboardText);
          }
        }
      } catch (error) { /* nothing to show */ }
      return '';
    }

    function showTip(chip, text) {
      if (text === '') return;
      try {
        const el = ensureTip();
        el.textContent = text;
        el.setAttribute('data-visible', 'true');
        const rect = chip.getBoundingClientRect();
        const width = el.offsetWidth;
        const height = el.offsetHeight;
        const pad = 8;
        let left = rect.left + rect.width / 2 - width / 2;
        left = Math.max(pad, Math.min(left, window.innerWidth - width - pad));
        let top = rect.top - height - 8;
        if (top < pad) top = Math.min(rect.bottom + 8, window.innerHeight - height - pad);
        el.style.left = Math.round(left) + 'px';
        el.style.top = Math.round(top) + 'px';
      } catch (error) { /* tooltip is best effort */ }
    }

    function hideTip() {
      try {
        if (tip !== null && tip.isConnected) tip.removeAttribute('data-visible');
      } catch (error) { /* best effort */ }
    }

    function destroyTip() {
      hideTip();
      try {
        if (tip !== null && tip.isConnected) tip.remove();
      } catch (error) { /* best effort */ }
      tip = null;
    }

    /* -------------------------------- apply ----------------------------- */

    return {
      inject: ['inputTriggers', 'locale', 'sessions', 'slots', 'uiConversation'],
      apply(ctx) {
        rootCtx = ctx;
        ensureStyle();
        try {
          ctx.effect(() => ctx.locale.register(NS, COPY), 'quote-to-composer dictionaries');
          bound = ctx.locale.bind(NS);
        } catch (error) { /* local dictionary remains the fallback */ }

        // Chip → prompt text. Without this owner the submit path rejects with
        // "no serializer for reference source" instead of sending.
        attempt('prompt serializer', () => {
          const triggers = service('inputTriggers');
          if (triggers === undefined || typeof triggers.registerSource !== 'function') {
            console.warn('[quote-to-composer] prompt serializer unavailable: inputTriggers.registerSource missing');
            return;
          }
          ctx.effect(() => triggers.registerSource(QUOTE_SOURCE), 'quote-to-composer serializer');
        });

        // Sent user messages: render the chip's `> …` payload as a quote card.
        try {
          const off = ctx.uiConversation.userText.register(QUOTE_RULE);
          if (typeof off === 'function') {
            ctx.effect(() => () => {
              try { off(); } catch (error) { /* best effort */ }
            }, 'quote-to-composer copy rule');
          }
        } catch (error) {
          console.warn('[quote-to-composer] copy rule registration failed:', error);
        }
        attempt('node renderer', () => {
          ctx.slots.inject(NODE_SLOT, () => ctx.slots.register({
            name: NODE_SLOT,
            key: RULE_ID,
            priority: 100,
          }, QuoteBlock));
        });

        // Composer binding: one headless member per session.
        attempt('composer capture', () => {
          ctx.slots.inject(DOCK_SLOT, () => ctx.slots.register({
            name: DOCK_SLOT,
            id: DOCK_ID,
            order: 1000,
          }, Capture));
        });

        // Per-reply action: quote the whole finalized answer.
        attempt('message action', () => {
          ctx.slots.inject(ACTION_SLOT, () => ctx.slots.register({
            name: ACTION_SLOT,
            id: ACTION_ID,
            order: 20,
          }, QuoteMessageAction));
        });

        // Mouse copy raises the pill next to the pointer; Ctrl+Shift+Q still
        // works for keyboard selections and the pill itself does the insert.
        ctx.effect(() => {
          const onMouseUp = (event) => {
            if (event.button !== 0) return;
            const x = event.clientX;
            const y = event.clientY;
            // One tick later: the browser has committed the new selection by then.
            window.setTimeout(() => offerQuote(x, y), 0);
          };
          const onPointerDown = (event) => {
            const target = event.target;
            if (target instanceof Element && target.closest('.dqc-chip') !== null) return;
            hideChip();
          };
          const onSelectionChange = () => {
            const selection = window.getSelection();
            if (!selection || selection.isCollapsed || String(selection).trim() === '') hideChip();
          };
          const chipOf = (event) => {
            const target = event.target;
            if (!(target instanceof Element)) return null;
            return target.closest('[data-composer-chip="' + SOURCE_NAME + '"]');
          };
          const onMouseOver = (event) => {
            const element = chipOf(event);
            if (element === null) return;
            // The shipped chip carries title="引用"; it would pop the native
            // tooltip on top of the card and say nothing new.
            if (element.hasAttribute('title')) element.removeAttribute('title');
            showTip(element, chipPayload(element));
          };
          const onMouseOut = (event) => {
            const element = chipOf(event);
            if (element === null) return;
            const next = event.relatedTarget;
            if (next instanceof Node && element.contains(next)) return;
            hideTip();
          };
          const onKeyDown = (event) => {
            if (!event) return;
            if (event.key === 'Escape') {
              hideTip();
              return hideChip();
            }
            // Ctrl only, on every platform: Cmd+Shift+Q is macOS "log out", so a
            // Meta chord must never be advertised or honoured here.
            if (!event.ctrlKey || event.metaKey || !event.shiftKey || event.altKey) return;
            const key = typeof event.key === 'string' ? event.key.toLowerCase() : '';
            if (key !== 'q' && event.code !== 'KeyQ') return;
            if (!quoteSelection()) return;
            try { event.preventDefault(); event.stopPropagation(); } catch (error) { /* keep going */ }
          };
          const onLayout = () => {
            hideChip();
            hideTip();
          };
          document.addEventListener('pointerdown', onPointerDown, true);
          document.addEventListener('mouseup', onMouseUp, true);
          document.addEventListener('selectionchange', onSelectionChange);
          document.addEventListener('mouseover', onMouseOver, true);
          document.addEventListener('mouseout', onMouseOut, true);
          document.addEventListener('keydown', onKeyDown, true);
          window.addEventListener('scroll', onLayout, true);
          window.addEventListener('resize', onLayout);
          return () => {
            document.removeEventListener('pointerdown', onPointerDown, true);
            document.removeEventListener('mouseup', onMouseUp, true);
            document.removeEventListener('selectionchange', onSelectionChange);
            document.removeEventListener('mouseover', onMouseOver, true);
            document.removeEventListener('mouseout', onMouseOut, true);
            document.removeEventListener('keydown', onKeyDown, true);
            window.removeEventListener('scroll', onLayout, true);
            window.removeEventListener('resize', onLayout);
            destroyChip();
            destroyTip();
          };
        }, 'quote-to-composer selection');
      },
    };

    /** Register one optional UI piece; a rejection must not take the rest down. */
    function attempt(what, run) {
      try {
        run();
      } catch (error) {
        console.warn('[quote-to-composer] ' + what + ' registration failed:', error);
      }
    }
  },
});
