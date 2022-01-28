//!baseTheme

import {EditorView} from "@codemirror/view"

const baseTheme = EditorView.baseTheme({
  "&light .cm-zebraStripe": {backgroundColor: "#d4fafa"},
  "&dark .cm-zebraStripe": {backgroundColor: "#1a2727"}
})

//!facet

import {Facet} from "@codemirror/state"

const stepSize = Facet.define<number, number>({
  combine: values => values.length ? Math.min(...values) : 2
})

//!constructor

import {Extension} from "@codemirror/state"

export function zebraStripes(options: {step?: number} = {}): Extension {
  return [
    baseTheme,
    options.step == null ? [] : stepSize.of(options.step),
    showStripes
  ]
}

//!stripeDeco

import {Decoration} from "@codemirror/view"
import {RangeSetBuilder} from "@codemirror/rangeset"

const stripe = Decoration.line({
  attributes: {class: "cm-zebraStripe"}
})

function stripeDeco(view: EditorView) {
  let step = view.state.facet(stepSize)
  let builder = new RangeSetBuilder<Decoration>()
  for (let {from, to} of view.visibleRanges) {
    for (let pos = from; pos <= to;) {
      let line = view.state.doc.lineAt(pos)
      if ((line.number % step) == 0)
        builder.add(line.from, line.from, stripe)
      pos = line.to + 1
    }
  }
  return builder.finish()
}

//!showStripes

import {ViewPlugin, DecorationSet, ViewUpdate} from "@codemirror/view"

const showStripes = ViewPlugin.fromClass(class {
  decorations: DecorationSet

  constructor(view: EditorView) {
    this.decorations = stripeDeco(view)
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged)
      this.decorations = stripeDeco(update.view)
  }
}, {
  decorations: v => v.decorations
})

//!example

import {EditorState} from "@codemirror/basic-setup"
import {keymap} from "@codemirror/view"
import {defaultKeymap} from "@codemirror/commands"

let text = []
for (let i = 1; i <= 100; i++) text.push("line " + i)

;(window as any).view = new EditorView({
  state: EditorState.create({
    extensions: [zebraStripes(), keymap.of(defaultKeymap)],
    doc: text.join("\n")
  }),
  parent: document.querySelector("#editor")
})
