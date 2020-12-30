//!autoLanguage

import {EditorState} from "@codemirror/state"
import {htmlLanguage, html} from "@codemirror/lang-html"
import {language} from "@codemirror/language"
import {javascript} from "@codemirror/lang-javascript"

const languageTag = Symbol("language")

const autoLanguage = EditorState.transactionExtender.of(tr => {
  if (!tr.docChanged) return null
  let docIsHTML = /^\s*</.test(tr.newDoc.sliceString(0, 100))
  let stateIsHTML = tr.startState.facet(language) == htmlLanguage
  if (docIsHTML == stateIsHTML) return null
  return {
    reconfigure: {[languageTag]: docIsHTML ? html() : javascript()}
  }
})

//!enable

import {EditorView, basicSetup} from "@codemirror/basic-setup"
import {tagExtension} from "@codemirror/state"

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
