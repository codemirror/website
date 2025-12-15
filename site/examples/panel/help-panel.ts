//!helpState

import {showPanel, Panel} from "@codemirror/view"
import {StateField, StateEffect} from "@codemirror/state"

const toggleHelp = StateEffect.define<boolean>()

const helpPanelState = StateField.define<boolean>({
  create: () => false,
  update(value, tr) {
    for (let e of tr.effects) if (e.is(toggleHelp)) value = e.value
    return value
  },
  provide: f => showPanel.from(f, on => on ? createHelpPanel : null)
})

//!createHelpPanel

import {EditorView} from "@codemirror/view"

function createHelpPanel(view: EditorView) {
  let dom = document.createElement("div")
  dom.textContent = "F1: Toggle the help panel"
  dom.className = "cm-help-panel"
  return {top: true, dom}
}

//!helpKeymap

const helpKeymap = [{
  key: "F1",
  run(view) {
    view.dispatch({
      effects: toggleHelp.of(!view.state.field(helpPanelState))
    })
    return true
  }
}]

//!helpPanel

import {keymap} from "@codemirror/view"

const helpTheme = EditorView.baseTheme({
  ".cm-help-panel": {
    padding: "5px 10px",
    backgroundColor: "#fffa8f",
    fontFamily: "monospace"
  }
})

export function helpPanel() {
  return [helpPanelState, keymap.of(helpKeymap), helpTheme]
}

//!create

import {basicSetup} from "codemirror"

;(window as any).view = new EditorView({
  doc: "In this editor, F1 is bound to a panel-toggling\ncommand.\n",
  extensions: [helpPanel(), basicSetup],
  parent: document.querySelector("#editor") || document.body
})
