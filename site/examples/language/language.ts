//!autoLanguage

import {EditorState} from "@codemirror/next/state"
import {htmlLanguage, html} from "@codemirror/next/lang-html"
import {language} from "@codemirror/next/language"
import {javascript} from "@codemirror/next/lang-javascript"

const languageTag = Symbol("language")

const autoLanguage = EditorState.transactionExtender.of(tr => {
  if (!tr.docChanged) return null
  let docIsHTML = /^\s*</.test(tr.newDoc.sliceString(0, 100))
  let stateIsHTML = tr.startState.facet(language)[0] == htmlLanguage
  if (docIsHTML == stateIsHTML) return null
  return {
    reconfigure: {[languageTag]: docIsHTML ? html() : javascript()}
  }
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
