import {EditorState, Text} from "@codemirror/state"
import {EditorView, drawSelection, keymap, lineNumbers} from "@codemirror/view"
import {defaultKeymap, history, historyKeymap} from "@codemirror/commands"
import {syntaxHighlighting, defaultHighlightStyle} from "@codemirror/language"
import {html} from "@codemirror/lang-html"

let lines = [`<!doctype html>`, `<meta charset="utf8">`, `<body>`]
let repeated = [`  <p>These lines are repeated many times to save memory on`,
                `  string data.</p>`,
                `  <hr>`,
                `  <img src="../../style/logo.svg">`,
                ``]
for (let i = 0; lines.length < 2e6; i++) lines.push(repeated[i % repeated.length])
lines.push(`</body>`, ``)

;(window as any).view = new EditorView({
  doc: Text.of(lines),
  extensions: [
    keymap.of([...defaultKeymap, ...historyKeymap]),
    history(),
    drawSelection(),
    syntaxHighlighting(defaultHighlightStyle),
    lineNumbers(),
    html()
  ],
  parent: document.querySelector("#editor")
})
