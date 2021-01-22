import {EditorState} from "@codemirror/state"
import {EditorView, drawSelection, keymap} from "@codemirror/view"
import {history, historyKeymap} from "@codemirror/history"
import {defaultKeymap} from "@codemirror/commands"
import {defaultHighlightStyle} from "@codemirror/highlight"
import {lineNumbers} from "@codemirror/gutter"
import {Text} from "@codemirror/text"
import {html} from "@codemirror/lang-html"

let lines = [`<!doctype html>`, `<meta charset="utf8">`, `<body>`]
let repeated = [`  <p>These lines are repeated many times to save memory on`,
                `  string data.</p>`,
                `  <hr>`,
                `  <img src="../logo.svg">`,
                ``]
for (let i = 0; lines.length < 2e6; i++) lines.push(repeated[i % repeated.length])
lines.push(`</body>`, ``)

;(window as any).view = new EditorView({
  state: EditorState.create({
    doc: Text.of(lines),
    extensions: [
      keymap.of([...defaultKeymap, ...historyKeymap]),
      history(),
      drawSelection(),
      defaultHighlightStyle,
      lineNumbers(),
      html()
    ]
  }),
  parent: document.querySelector("#editor")
})
