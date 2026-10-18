/**
 * Host half of the quote-to-composer bundle.
 *
 * The capability is a pure Client view interaction (select text anywhere in the
 * UI, then insert it as a Markdown blockquote into the current session's
 * composer), so the Host half intentionally declares nothing. The composer
 * binding is picked up from the `conversation.input.dock` slot on the client.
 */
export function apply() {}
