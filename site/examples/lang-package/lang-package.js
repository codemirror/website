// @omit
//!parser
import {parser} from "./parser.js"
import {foldNodeProp, foldInside, indentNodeProp} from "@codemirror/language"
import {styleTags, tags as t} from "@lezer/highlight"

let parserWithMetadata = parser.configure({
  props: [
    styleTags({
      Identifier: t.variableName,
      Boolean: t.bool,
      String: t.string,
      LineComment: t.lineComment,
      "( )": t.paren
    }),
    indentNodeProp.add({
      Application: context => context.column(context.node.from) + context.unit
    }),
    foldNodeProp.add({
      Application: foldInside
    })
  ]
})

//!language
import {LRLanguage} from "@codemirror/language"

export const exampleLanguage = LRLanguage.define({
  parser: parserWithMetadata,
  languageData: {
    commentTokens: {line: ";"}
  }
})

//!completion
import {completeFromList} from "@codemirror/autocomplete"

export const exampleCompletion = exampleLanguage.data.of({
  autocomplete: completeFromList([
    {label: "defun", type: "keyword"},
    {label: "defvar", type: "keyword"},
    {label: "let", type: "keyword"},
    {label: "cons", type: "function"},
    {label: "car", type: "function"},
    {label: "cdr", type: "function"}
  ])
})

//!support
import {LanguageSupport} from "@codemirror/language"

export function example() {
  return new LanguageSupport(exampleLanguage, [exampleCompletion])
}

//!editor
import {EditorView, basicSetup} from "codemirror"

new EditorView({
  doc: `(defun check-login (name password) ; absolutely secure\n  (if (equal name "admin")\n    (equal password "12345")\n    #t))`,
  extensions: [basicSetup, example()],
  parent: document.querySelector("#editor")
});

