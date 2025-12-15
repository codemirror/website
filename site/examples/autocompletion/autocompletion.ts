//!htmlEditor

import {EditorView, basicSetup} from "codemirror"
import {autocompletion} from "@codemirror/autocomplete"
import {html} from "@codemirror/lang-html"

new EditorView({
  doc: "<!doctype html>\n<html>\n  \n</html>",
  extensions: [
    basicSetup,
    html(),
  ],
  parent: document.querySelector("#editor-html")
})

//!override

import {CompletionContext} from "@codemirror/autocomplete"

function myCompletions(context: CompletionContext) {
  let word = context.matchBefore(/\w*/)
  if (word.from == word.to && !context.explicit)
    return null
  return {
    from: word.from,
    options: [
      {label: "match", type: "keyword"},
      {label: "hello", type: "variable", info: "(World)"},
      {label: "magic", type: "text", apply: "⠁⭒*.✩.*⭒⠁", detail: "macro"}
    ]
  }
}

//!createOverride

new EditorView({
  doc: "Press Ctrl-Space in here...\n",
  extensions: [basicSetup, autocompletion({override: [myCompletions]})],
  parent: document.querySelector("#editor-override")
})
