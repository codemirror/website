//!placeholderMatcher

import {MatchDecorator} from "@codemirror/view"

const placeholderMatcher = new MatchDecorator({
  regexp: /\[\[(\w+)\]\]/g,
  decoration: match => Decoration.replace({
    widget: new PlaceholderWidget(match[1]),
  })
})

//!placeholderPlugin

import {Decoration, DecorationSet, EditorView,
        ViewPlugin, ViewUpdate} from "@codemirror/view"

const placeholders = ViewPlugin.fromClass(class {
  placeholders: DecorationSet
  constructor(view: EditorView) {
    this.placeholders = placeholderMatcher.createDeco(view)
  }
  update(update: ViewUpdate) {
    this.placeholders = placeholderMatcher.updateDeco(update, this.placeholders)
  }
}, {
  decorations: instance => instance.placeholders,
  provide: plugin => EditorView.atomicRanges.of(view => {
    return view.plugin(plugin)?.placeholders || Decoration.none
  })
})

//!placeholderWidget

import {WidgetType} from "@codemirror/view"

class PlaceholderWidget extends WidgetType {
  constructor(readonly name: string) {
    super()
  }
  eq(other: PlaceholderWidget) {
    return this.name == other.name
  }
  toDOM() {
    let elt = document.createElement("span")
    elt.style.cssText = `
      border: 1px solid blue;
      border-radius: 4px;
      padding: 0 3px;
      background: lightblue;`
    elt.textContent = this.name
    return elt
  }
  ignoreEvent() {
    return false
  }
}

//!placeholderCreate

import {minimalSetup} from "codemirror"

new EditorView({
  doc: "Dear [[name]],\nYour [[item]] is on its way. Please see [[order]] for details.\n",
  extensions: [placeholders, minimalSetup],
  parent: document.querySelector("#editor-placeholder") || document.body
})
