import {EditorView, basicSetup} from "codemirror"
import {example} from "./lang-package.js"

new EditorView({
  doc: `(defun check-login (name password) ; absolutely secure\n  (if (equal name "admin")\n    (equal password "12345")\n    #t))`,
  extensions: [basicSetup, example()],
  parent: document.querySelector("#editor")
})
