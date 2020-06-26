//!baseTheme

import {EditorView} from "@codemirror/next/view"

const baseTheme = EditorView.baseTheme({
  "zebraStripe@light": {backgroundColor: "#f4fafa"},
  "zebraStripe@dark": {backgroundColor: "#1a2727"}
})

//!facet

import {Facet} from "@codemirror/next/state"

const stepSize = Facet.define<number, number>({
  combine: values => values.length ? Math.min(...values) : 2
})

//!constructor

import {Extension} from "@codemirror/next/state"

export function zebraStripes(options: {step?: number} = {}): Extension {
  return [
    baseTheme,
    options.step == null ? [] : stepSize.of(options.step),
    showStripes
  ]
}

//!stripeDeco

import {Decoration, themeClass} from "@codemirror/next/view"
import {RangeSetBuilder} from "@codemirror/next/rangeset"

const stripe = Decoration.line({
  attributes: {class: themeClass("zebraStripe")}
})

function stripeDeco(view: EditorView) {
  let step = view.state.facet(stepSize)
  let builder = new RangeSetBuilder<Decoration>()
  for (let {from, to} of view.visibleRanges) {
    for (let pos = from; pos < to;) {
      let line = view.state.doc.lineAt(pos)
      if ((line.number % step) == 0)
        builder.add(line.from, line.from, stripe)
      pos = line.to + 1
    }
  }
  return builder.finish()
}

//!showStripes

import {ViewPlugin, DecorationSet, ViewUpdate} from "@codemirror/next/view"

const showStripes = ViewPlugin.fromClass(class {
  decorations: DecorationSet

  constructor(view: EditorView) {
    this.decorations = stripeDeco(view)
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) this.decorations = stripeDeco(update.view)
  }
}).decorations()

//!example

import {EditorState} from "@codemirror/next/basic-setup"
import {keymap} from "@codemirror/next/view"
import {defaultKeymap} from "@codemirror/next/commands"

globalThis.view = new EditorView({
  state: EditorState.create({
    extensions: [zebraStripes(), keymap(defaultKeymap)],
    doc: "line\n".repeat(100)
  }),
  parent: document.querySelector("#editor")
})
