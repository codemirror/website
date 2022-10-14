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

//!completeJSDoc

import {syntaxTree} from "@codemirror/language"

const tagOptions = [
  "constructor", "deprecated", "link", "param", "returns", "type"
].map(tag => ({label: "@" + tag, type: "keyword"}))

function completeJSDoc(context: CompletionContext) {
  let nodeBefore = syntaxTree(context.state).resolveInner(context.pos, -1)
  if (nodeBefore.name != "BlockComment" ||
      context.state.sliceDoc(nodeBefore.from, nodeBefore.from + 3) != "/**")
    return null
  let textBefore = context.state.sliceDoc(nodeBefore.from, context.pos)
  let tagBefore = /@\w*$/.exec(textBefore)
  if (!tagBefore && !context.explicit) return null
  return {
    from: tagBefore ? nodeBefore.from + tagBefore.index : context.pos,
    options: tagOptions,
    validFor: /^(@\w*)?$/
  }
}

//!jsDocCompletions

import {javascriptLanguage} from "@codemirror/lang-javascript"

const jsDocCompletions = javascriptLanguage.data.of({
  autocomplete: completeJSDoc
})

//!createJavaScriptEditor

new EditorView({
  doc: "/** Complete tags here\n    @pa\n */\n",
  extensions: [
    basicSetup,
    javascriptLanguage,
    jsDocCompletions,
    autocompletion()
  ],
  parent: document.querySelector("#editor-javascript")
})
