//!regexpLint

import {syntaxTree} from "@codemirror/language"
import {linter, Diagnostic} from "@codemirror/lint"

const regexpLinter = linter(view => {
  let diagnostics: Diagnostic[] = []
  syntaxTree(view.state).cursor().iterate(node => {
    if (node.name == "RegExp") diagnostics.push({
      from: node.from,
      to: node.to,
      severity: "warning",
      message: "Regular expressions are FORBIDDEN",
      actions: [{
        name: "Remove",
        apply(view, from, to) { view.dispatch({changes: {from, to}}) }
      }]
    })
  })
  return diagnostics
})

//!editor

import {basicSetup, EditorView} from "codemirror"
import {javascript} from "@codemirror/lang-javascript"
import {lintGutter} from "@codemirror/lint"

new EditorView({
  doc: `function isNumber(string) {
  return /^\\d+(\\.\\d*)?$/.test(string)
}`,
  extensions: [
    basicSetup,
    javascript(),
    lintGutter(),
    regexpLinter
  ],
  parent: document.querySelector("#editor")!
})
