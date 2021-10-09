//!cursorTooltipField

import {Tooltip, showTooltip} from "@codemirror/tooltip"
import {StateField} from "@codemirror/state"

const cursorTooltipField = StateField.define<readonly Tooltip[]>({
  create: getCursorTooltips,

  update(tooltips, tr) {
    if (!tr.docChanged && !tr.selection) return tooltips
    return getCursorTooltips(tr.state)
  },

  provide: f => showTooltip.computeN([f], state => state.field(f))
})

//!getCursorTooltips

import {EditorState} from "@codemirror/state"

function getCursorTooltips(state: EditorState): readonly Tooltip[] {
  return state.selection.ranges
    .filter(range => range.empty)
    .map(range => {
      let line = state.doc.lineAt(range.head)
      let text = line.number + ":" + (range.head - line.from)
      return {
        pos: range.head,
        above: true,
        strictSide: true,
        create: () => {
          let dom = document.createElement("div")
          dom.className = "cm-cursor-tooltip"
          dom.textContent = text
          return {dom}
        }
      }
    })
}

//!baseTheme

import {EditorView} from "@codemirror/basic-setup"

const cursorTooltipBaseTheme = EditorView.baseTheme({
  ".cm-tooltip.cm-cursor-tooltip": {
    backgroundColor: "#66b",
    color: "white",
    transform: "translate(-50%, -7px)",
    border: "none",
    padding: "2px 7px",
    borderRadius: "10px",
    "&:before": {
      position: "absolute",
      content: '""',
      left: "50%",
      marginLeft: "-5px",
      bottom: "-5px",
      borderLeft: "5px solid transparent",
      borderRight: "5px solid transparent",
      borderTop: "5px solid #66b"
    }
  }
})

//!cursorTooltip

export function cursorTooltip() {
  return [cursorTooltipField, cursorTooltipBaseTheme]
}

//!create

import {basicSetup} from "@codemirror/basic-setup"

new EditorView({
  state: EditorState.create({
    doc: "Move through this text to\nsee your tooltip\n",
    extensions: [basicSetup, cursorTooltip()]
  }),
  parent: document.querySelector("#editor")!
})
