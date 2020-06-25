import {EditorState, EditorView, basicSetup} from "@codemirror/next/basic-setup"
import {javascript, javascriptSyntax} from "@codemirror/next/lang-javascript"
import {completeFromList} from "@codemirror/next/autocomplete"

let jsCompletion = completeFromList("break case catch class const continue debugger default delete do else enum export extends false finally for function if implements import interface in instanceof let new package private protected public return static super switch this throw true try typeof var void while with yield".split(" ").concat(Object.getOwnPropertyNames(window)))

let state = EditorState.create({doc: `function hello(who = "world") {
  console.log(\`Hello, \${who}!\`)
}`, extensions: [
  basicSetup,
  javascript(),
  javascriptSyntax.languageData.of({autocomplete: jsCompletion})
]})

let view = window.view = new EditorView({state, parent: document.querySelector("#editor")})
