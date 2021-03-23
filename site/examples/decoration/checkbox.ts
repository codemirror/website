//!CheckboxWidget

import {WidgetType} from "@codemirror/view"

class CheckboxWidget extends WidgetType {
  constructor(readonly checked: boolean) { super() }

  eq(other: CheckboxWidget) { return other.checked == this.checked }

  toDOM() {
    let wrap = document.createElement("span")
    wrap.setAttribute("aria-hidden", "true")
    wrap.className = "cm-boolean-toggle"
    let box = wrap.appendChild(document.createElement("input"))
    box.type = "checkbox"
    box.checked = this.checked
    return wrap
  }

  ignoreEvent() { return false }
}

//!checkboxes

import {EditorView, Decoration} from "@codemirror/view"
import {syntaxTree} from "@codemirror/language"

function checkboxes(view: EditorView) {
  let widgets = []
  for (let {from, to} of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from, to,
      enter: (type, from, to) => {
        if (type.name == "BooleanLiteral") {
          let isTrue = view.state.doc.sliceString(from, to) == "true"
          let deco = Decoration.widget({
            widget: new CheckboxWidget(isTrue),
            side: 1
          })
          widgets.push(deco.range(to))
        }
      }
    })
  }
  return Decoration.set(widgets)
}

//!toggleBoolean

function toggleBoolean(view: EditorView, pos: number) {
  let before = view.state.doc.sliceString(Math.max(0, pos - 5), pos)
  let change
  if (before == "false")
    change = {from: pos - 5, to: pos, insert: "true"}
  else if (before.endsWith("true"))
    change = {from: pos - 4, to: pos, insert: "false"}
  else
    return false
  view.dispatch({changes: change})
  return true
}

//!checkboxPlugin

import {ViewUpdate, ViewPlugin, DecorationSet} from "@codemirror/view"

const checkboxPlugin = ViewPlugin.fromClass(class {
  decorations: DecorationSet

  constructor(view: EditorView) {
    this.decorations = checkboxes(view)
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged)
      this.decorations = checkboxes(update.view)
  }
}, {
  decorations: v => v.decorations,

  eventHandlers: {
    mousedown: (e, view) => {
      let target = e.target as HTMLElement
      if (target.nodeName == "INPUT" &&
          target.parentElement!.classList.contains("cm-boolean-toggle"))
        return toggleBoolean(view, view.posAtDOM(target))
    }
  }
})

//!create

import {basicSetup, EditorState} from "@codemirror/basic-setup"
import {javascript} from "@codemirror/lang-javascript"

new EditorView({
  state: EditorState.create({
    doc: "let value = true\nif (!value == false)\n  console.log(\"good\")\n",
    extensions: [checkboxPlugin, basicSetup, javascript()]
  }),
  parent: document.querySelector("#editor-checkbox")
})

