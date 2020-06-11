import {EditorState} from "../../state"
import {EditorView} from "../../view"
import {keymap} from "../../keymap"
import {historyKeymap, history} from "../../history"
import {foldKeymap, foldGutter} from "../../fold"
import {lineNumbers} from "../../gutter"
import {defaultKeymap} from "../../commands"
import {bracketMatching} from "../../matchbrackets"
import {closeBrackets} from "../../closebrackets"
import {specialChars} from "../../special-chars"
import {multipleSelections} from "../../multiple-selections"
import {searchKeymap} from "../../search"
import {autocomplete} from "../../autocomplete"

import {javascript} from "../../lang-javascript"
import {defaultHighlighter} from "../../highlight"

let jsCompletions = "break case catch class const continue debugger default delete do else enum export extends false finally for function if implements import interface in instanceof let new package private protected public return static super switch this throw true try typeof var void while with yield".split(" ")
    .concat(Object.getOwnPropertyNames(window))

let isMac = /Mac/.test(navigator.platform)
let state = EditorState.create({doc: `function hello(who = "world") {
  console.log(\`Hello, \${who}!\`)
}`, extensions: [
  lineNumbers(),
  history(),
  specialChars(),
  foldGutter(),
  multipleSelections(),
  javascript(),
  defaultHighlighter,
  bracketMatching(),
  closeBrackets,
  autocomplete({
    override(state, pos, cx) {
      let prefix = /[\w$]*$/.exec(state.doc.slice(Math.max(0, pos - 30), pos))[0]
      if (!prefix) return []
      return jsCompletions.filter(str => cx.filter(str, prefix))
        .map(str => ({label: str, start: pos - prefix.length, end: pos}))
    }
  }),
  keymap([
    ...defaultKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...searchKeymap
  ])
]})

let view = window.view = new EditorView({state})
document.querySelector("#editor").appendChild(view.dom)
