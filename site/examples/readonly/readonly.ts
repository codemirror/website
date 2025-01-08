//!tabindex

import {EditorView, basicSetup} from "codemirror"
import {EditorState} from "@codemirror/state"

new EditorView({
  parent: document.querySelector("#editor_focus"),
  doc: "I am focusable but not editable",
  extensions: [
    basicSetup,
    EditorState.readOnly.of(true),
    EditorView.editable.of(false),
    EditorView.contentAttributes.of({tabindex: "0"})
  ]
})

//!inert

new EditorView({
  parent: document.querySelector("#editor_inert"),
  doc: "I am read-only and non-focusable",
  extensions: [
    basicSetup,
    EditorState.readOnly.of(true),
    EditorView.editable.of(false),
  ]
})
