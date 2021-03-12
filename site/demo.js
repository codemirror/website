// @babel

import {EditorState, EditorView, basicSetup} from "@codemirror/basic-setup"
import {javascript, javascriptLanguage} from "@codemirror/lang-javascript"
import {completeFromList} from "@codemirror/autocomplete"

let keywords = "break case catch class const continue debugger default delete do else enum export extends false finally for function if implements import interface in instanceof let new package private protected public return static super switch this throw true try typeof var void while with yield".split(" ").map(kw => ({label: kw, type: "keyword"}))
let globals = Object.getOwnPropertyNames(window).map(p => {
  return {
    label: p,
    type: /^[A-Z]/.test(p) ? "class" : typeof window[p] == "function" ? "function" : "variable"
  }
})
let jsCompletion = completeFromList([...keywords, ...globals])

let state = EditorState.create({doc: `function hello(who = "world") {
  console.log(\`Hello, \${who}!\`)
}`, extensions: [
  basicSetup,
  javascript(),
  javascriptLanguage.data.of({autocomplete: jsCompletion})
]})

let view = window.view = new EditorView({state, parent: document.querySelector("#editor")})
