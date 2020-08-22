//!autoLanguage

import {EditorState} from "@codemirror/next/state"
import {htmlSyntax, html} from "@codemirror/next/lang-html"
import {javascript} from "@codemirror/next/lang-javascript"

const languageTag = Symbol("language")

const autoLanguage = EditorState.transactionFilter.of((spec, prev) => {
  if (!spec.changes) return spec
  let docIsHTML = /^\s*</.test(spec.doc.sliceString(0, 100))
  let stateIsHTML = prev.facet(EditorState.syntax)[0] == htmlSyntax
  if (docIsHTML == stateIsHTML) return spec
  return [spec, {
    reconfigure: {[languageTag]: docIsHTML ? html() : javascript()}
  }]
})

//!enable

import {EditorView, basicSetup} from "@codemirror/next/basic-setup"
import {tagExtension} from "@codemirror/next/state"

new EditorView({
  state: EditorState.create({
    doc: 'console.log("hello")',
    extensions: [
      basicSetup,
      tagExtension(languageTag, javascript()),
      autoLanguage
    ]
  }),
  parent: document.querySelector("#editor")
})
