//!htmlEditor

import {EditorView, EditorState, basicSetup} from "@codemirror/basic-setup"
import {autocompletion} from "@codemirror/autocomplete"
import {html} from "@codemirror/lang-html"

new EditorView({
  state: EditorState.create({
    doc: "<!doctype html>\n<html>\n  \n</html>",
    extensions: [
      basicSetup,
      html(),
    ]
  }),
  parent: document.querySelector("#editor-html")
})

//!override

import {CompletionContext} from "@codemirror/autocomplete"

function myCompletions(context: CompletionContext) {
  let word = context.matchBefore(/\w*/)
  if (word.from == word.to && !context.explicit)
    return null
  return {
    from: word.from,
    options: [
      {label: "match", type: "keyword"},
      {label: "hello", type: "variable", info: "(World)"},
      {label: "magic", type: "text", apply: "⠁⭒*.✩.*⭒⠁", detail: "macro"}
    ]
  }
}

let state = EditorState.create({
  doc: "Press Ctrl-Space in here...\n",
  extensions: [basicSetup, autocompletion({override: [myCompletions]})]
})

//!createOverride

new EditorView({
  state,
  parent: document.querySelector("#editor-override")
})

//!completeFromGlobalScope

import {syntaxTree} from "@codemirror/language"

const completePropertyAfter = ["PropertyName", ".", "?."]
const dontCompleteIn = ["TemplateString", "LineComment", "BlockComment",
                        "VariableDefinition", "PropertyDefinition"]

function completeFromGlobalScope(context: CompletionContext) {
  let nodeBefore = syntaxTree(context.state).resolveInner(context.pos, -1)

  if (completePropertyAfter.includes(nodeBefore.name) &&
      nodeBefore.parent?.name == "MemberExpression") {
    let object = nodeBefore.parent.getChild("Expression")
    if (object?.name == "VariableName") {
      let from = /\./.test(nodeBefore.name) ? nodeBefore.to : nodeBefore.from
      let variableName = context.state.sliceDoc(object.from, object.to)
      if (typeof window[variableName] == "object")
        return completeProperties(from, window[variableName])
    }
  } else if (nodeBefore.name == "VariableName") {
    return completeProperties(nodeBefore.from, window)
  } else if (context.explicit && !dontCompleteIn.includes(nodeBefore.name)) {
    return completeProperties(context.pos, window)
  }
  return null
}

//!completeProperties

function completeProperties(from: number, object: Object) {
  let options = []
  for (let name in object) {
    options.push({
      label: name,
      type: typeof object[name] == "function" ? "function" : "variable"
    })
  }
  return {
    from,
    options,
    validFor: /^[\w$]*$/
  }
}

//!globalJavaScriptCompletions

import {javascriptLanguage} from "@codemirror/lang-javascript"

const globalJavaScriptCompletions = javascriptLanguage.data.of({
  autocomplete: completeFromGlobalScope
})

//!createJavaScriptEditor

new EditorView({
  state: EditorState.create({
    doc: "// Get JavaScript completions here\ndocument.b",
    extensions: [
      basicSetup,
      javascriptLanguage,
      globalJavaScriptCompletions,
      autocompletion()
    ]
  }),
  parent: document.querySelector("#editor-javascript")
})
