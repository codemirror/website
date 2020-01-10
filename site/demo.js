import {EditorState} from "../../state"
import {EditorView} from "../../view"
import {keymap} from "../../keymap"
import {history, redo, redoSelection, undo, undoSelection} from "../../history"
import {foldCode, unfoldCode, codeFolding, foldGutter} from "../../fold"
import {lineNumbers} from "../../gutter"
import {baseKeymap, indentSelection} from "../../commands"
import {bracketMatching} from "../../matchbrackets"
import {closeBrackets} from "../../closebrackets"
import {specialChars} from "../../special-chars"
import {multipleSelections} from "../../multiple-selections"
import {search, defaultSearchKeymap} from "../../search"
import {autocomplete, sortAndFilterCompletion} from "../../autocomplete"

import {javascript} from "../../lang-javascript"
import {defaultHighlighter} from "../../highlight"

let items = "break case catch class const continue debugger default delete do else enum export extends false finally for function if implements import interface in instanceof let new package private protected public return static super switch this throw true try typeof var void while with yield".split(" ")
    .concat(Object.getOwnPropertyNames(window))
    .map(s => ({label: s, insertText: s}))

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
  search({keymap: defaultSearchKeymap}),
  defaultHighlighter,
  bracketMatching(),
  closeBrackets,
  autocomplete({completeAt(state, pos) {
    let prefix = /[\w$]*$/.exec(state.doc.slice(Math.max(0, pos - 30), pos))[0]
    if (!prefix) return {start: pos, items: []}
    return {start: pos - prefix.length, items: sortAndFilterCompletion(prefix, items)}
  }}),
  keymap({
    "Mod-z": undo,
    "Mod-Shift-z": redo,
    "Mod-u": view => undoSelection(view) || true,
    [isMac ? "Mod-Shift-u" : "Alt-u"]: redoSelection,
    "Ctrl-y": isMac ? undefined : redo,
    "Shift-Tab": indentSelection,
    "Mod-Alt-[": foldCode,
    "Mod-Alt-]": unfoldCode
  }),
  keymap(baseKeymap),
]})

let view = window.view = new EditorView({state})
document.querySelector("#editor").appendChild(view.dom)
