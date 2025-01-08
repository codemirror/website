!{"type": "examples", "title": "CodeMirror Read-Only Editor Example", "injectCode": "./readonly.ts"}

# Example: Read-Only Editor

CodeMirror splits the concept of editability into two parts.

 - On the state level, there is a [`readOnly`
   facet](##state.EditorState^readOnly) and corresponding
   [getter](##state.EditorState.readOnly). This is used to indicate
   that an editor state should not be changed by direct user
   interaction. It disables things like typing or pasting into the
   editor. Document-changing editor commands tend to check for this
   flag and do nothing when it is on.

 - On the DOM level, there's the [`editable`
   facet](##view.EditorView^editable), which controls whether the
   editor content is marked as editable to the browser.

Depending on your use case, you might want to combine these in
different ways. An editor that should be completely non-interactive
would set `readOnly` to true and `editable` to false. Though note
that, if you only want syntax highlighting and no editing features, it
is often preferable to not use `EditorView` at all, and directly use
[@lezer/highlight](https://lezer.codemirror.net/docs/ref/#highlight)
to highlight the code.

<div id=editor_inert></div>

If you want an editor that responds to keyboard commands, you will
need to make sure your editor is focusable, because DOM elements do
not receive keyboard input unless they are focused. Turning `editable`
off will make the content element a regular DOM `<div>` element which
the user cannot focus. Depending on whether you want the browser to
behave as if the content is editable or not, you could either leave
`editable` on, or add a
[`tabindex`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex)
attribute via
[`contentAttributes`](##view.EditorView^contentAttributes) to make an
uneditable element focusable.

!tabindex

<div id=editor_focus></div>

The native cursor will not be visible in a non-editable element, but
if you enable the library's own [cursor drawing](##view.drawSelection)
(which is enabled by default in `basicSetup`), you can still get a
visible cursor.

<script defer src="../../codemirror.js"></script>
<script defer src="readonly.js"></script>
