//!wordCountPanel

import {EditorView, Panel} from "@codemirror/view"

function wordCountPanel(view: EditorView): Panel {
  let dom = document.createElement("div")
  dom.textContent = countWords(view.state.doc)
  return {
    dom,
    update(update) {
      if (update.docChanged)
        dom.textContent = countWords(update.state.doc)
    }
  }
}

//!countWords

import {Text} from "@codemirror/state"

function countWords(doc: Text) {
  let count = 0, iter = doc.iter()
  while (!iter.next().done) {
    let inWord = false
    for (let i = 0; i < iter.value.length; i++) {
      let word = /\w/.test(iter.value[i])
      if (word && !inWord) count++
      inWord = word
    }
  }
  return `Word count: ${count}`
}

//!wordCounter

import {showPanel} from "@codemirror/view"

export function wordCounter() {
  return showPanel.of(wordCountPanel)
}

//!create

import {basicSetup, EditorState} from "@codemirror/basic-setup"

new EditorView({
  state: EditorState.create({
    doc: "Type here and the editor will count your\nwords.",
    extensions: [basicSetup, wordCounter()]
  }),
  parent: document.querySelector("#count-editor")
})
