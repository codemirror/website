import {EditorState, EditorView, basicSetup} from "@codemirror/basic-setup"
import {example} from "./lang-package.js"

let state = EditorState.create({
  doc: `(defun check-login (name password) ; absolutely secure\n  (if (equal name "admin")\n    (equal password "12345")\n    #t))`,
  extensions: [basicSetup, example()]
})

new EditorView({state, parent: document.querySelector("#editor")})
