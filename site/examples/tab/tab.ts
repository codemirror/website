//!editor

import {EditorState, basicSetup} from "@codemirror/basic-setup"
import {EditorView, keymap} from "@codemirror/view"
import {indentWithTab} from "@codemirror/commands"
import {javascript} from "@codemirror/lang-javascript"

const doc = `if (true) {
  console.log("okay")
} else {
  console.log("oh no")
}
`

new EditorView({
  state: EditorState.create({
    doc,
    extensions: [
      basicSetup,
      keymap.of([indentWithTab]),
      javascript()
    ]
  }),
  parent: document.querySelector("#editor")
})
