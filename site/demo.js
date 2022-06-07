// @babel

import {basicSetup, EditorView} from "codemirror"
import {javascript, javascriptLanguage} from "@codemirror/lang-javascript"
import {completeFromList} from "@codemirror/autocomplete"

let jsCompletion = completeFromList(Object.getOwnPropertyNames(window).map(p => {
  return {
    label: p,
    type: /^[A-Z]/.test(p) ? "class" : typeof window[p] == "function" ? "function" : "variable"
  }
}))

window.view = new EditorView({
  doc: `function hello(who = "world") {
  console.log(\`Hello, \${who}!\`)
}`,
  extensions: [
    basicSetup,
    javascript(),
    javascriptLanguage.data.of({autocomplete: jsCompletion})
  ],
  parent: document.querySelector("#editor")
})
