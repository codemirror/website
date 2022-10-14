// @babel

import {basicSetup, EditorView} from "codemirror"
import {javascript, javascriptLanguage, scopeCompletionSource} from "@codemirror/lang-javascript"

window.view = new EditorView({
  doc: `function hello(who = "world") {
  console.log(\`Hello, \${who}!\`)
}`,
  extensions: [
    basicSetup,
    javascript(),
    javascriptLanguage.data.of({autocomplete: scopeCompletionSource(globalThis)})
  ],
  parent: document.querySelector("#editor")
})
