//!startState

import {EditorState} from "@codemirror/state"
import {defaultKeymap, historyKeymap, history} from "@codemirror/commands"
import {drawSelection, keymap, lineNumbers} from "@codemirror/view"

let startState = EditorState.create({
  doc: "The document\nis\nshared",
  extensions: [
    history(),
    drawSelection(),
    lineNumbers(),
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
    ])
  ]
})

//!otherState

import {undo, redo} from "@codemirror/commands"

let otherState = EditorState.create({
  doc: startState.doc,
  extensions: [
    drawSelection(),
    lineNumbers(),
    keymap.of([
      ...defaultKeymap,
      {key: "Mod-z", run: () => undo(mainView)},
      {key: "Mod-y", mac: "Mod-Shift-z", run: () => redo(mainView)}
    ])
  ]
})

//!syncDispatch

import {EditorView} from "@codemirror/view"
import {Transaction, Annotation} from "@codemirror/state"

let syncAnnotation = Annotation.define<boolean>()

function syncDispatch(tr: Transaction, view: EditorView, other: EditorView) {
  view.update([tr])
  if (!tr.changes.empty && !tr.annotation(syncAnnotation)) {
    let annotations: Annotation<any>[] = [syncAnnotation.of(true)]
    let userEvent = tr.annotation(Transaction.userEvent)
    if (userEvent) annotations.push(Transaction.userEvent.of(userEvent))
    other.dispatch({changes: tr.changes, annotations})
  }
}

//!setup

let mainView = new EditorView({
  state: startState,
  parent: document.querySelector("#editor1") || document.body,
  dispatch: tr => syncDispatch(tr, mainView, otherView)
})

let otherView = new EditorView({
  state: otherState,
  parent: document.querySelector("#editor2") || document.body,
  dispatch: tr => syncDispatch(tr, otherView, mainView)
})
