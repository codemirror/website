//!htmlIsolates

import {EditorView, Direction, ViewPlugin, ViewUpdate,
        Decoration, DecorationSet} from "@codemirror/view"
import {Prec} from "@codemirror/state"
import {syntaxTree} from "@codemirror/language"
import {Tree} from "@lezer/common"

const htmlIsolates = ViewPlugin.fromClass(class {
  isolates: DecorationSet
  tree: Tree

  constructor(view: EditorView) {
    this.isolates = computeIsolates(view)
    this.tree = syntaxTree(view.state)
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged ||
        syntaxTree(update.state) != this.tree) {
      this.isolates = computeIsolates(update.view)
      this.tree = syntaxTree(update.state)
    }
  }
}, {
  provide: plugin => {
    function access(view: EditorView) {
      return view.plugin(plugin)?.isolates ?? Decoration.none
    }
    return Prec.lowest([EditorView.decorations.of(access),
                        EditorView.bidiIsolatedRanges.of(access)])
  }
})

//!computeIsolates

import {RangeSetBuilder} from "@codemirror/state"

const isolate = Decoration.mark({
  attributes: {style: "direction: ltr; unicode-bidi: isolate"},
  bidiIsolate: Direction.LTR
})

function computeIsolates(view: EditorView) {
  let set = new RangeSetBuilder<Decoration>()
  for (let {from, to} of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from, to,
      enter(node) {
        if (node.name == "OpenTag" || node.name == "CloseTag" ||
            node.name == "SelfClosingTag")
          set.add(node.from, node.to, isolate)
      }
    })
  }
  return set.finish()
}

//!cursorSemicolonLeft

function cursorSemicolonLeft(view: EditorView) {
  let from = view.state.selection.main.head
  let dir = view.textDirectionAt(from)
  let line = view.state.doc.lineAt(from)
  let found = dir == Direction.LTR
    ? line.text.lastIndexOf(";", from - line.from)
    : line.text.indexOf(";", from - line.from)
  if (found < 0) return false
  view.dispatch({
    selection: {anchor: found + line.from},
    scrollIntoView: true,
    userEvent: "select"
  })
  return true
}

//!create

import {basicSetup} from "codemirror"
import {html} from "@codemirror/lang-html"

new EditorView({
  doc: `זהו עורך קוד מימין לשמאל.
يحتوي على شريط التمرير على الجانب الأيمن
`,
  extensions: basicSetup,
  parent: document.querySelector("#rtl_editor")
})

new EditorView({
  doc: `النص <span class="blue">الأزرق</span>\n`,
  extensions: [basicSetup, html(), htmlIsolates],
  parent: document.querySelector("#isolate_editor")
})
