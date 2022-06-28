import {basicSetup} from "codemirror"
import {EditorView, keymap} from "@codemirror/view"
import {EditorState} from "@codemirror/state"
import {javascript} from "@codemirror/lang-javascript"
import {parse} from "acorn"
// @ts-ignore
import {simple} from "acorn-walk"

const unprefixed = ["codemirror", "style-mod", "w3c-keyname", "crelt"]
function isAvailable(mod) {
  return unprefixed.includes(mod) || /^@lezer\//.test(mod) || /^@codemirror\//.test(mod)
}

function rewriteImports(code: string) {
  let tree
  try { tree = parse(code, {ecmaVersion: "latest", sourceType: "module"}) }
  catch (_) { return code }
  let patches = []
  let rewrite = node => {
    if (node && isAvailable(node.value))
      patches.push({
        from: node.start, to: node.end,
        text: JSON.stringify(`./mods/${node.value.replace(/\//g, "-")}.js`)
      })
  }
  simple(tree, {
    ExportNamedDeclaration: n => rewrite(n.source),
    ImportDeclaration: n => rewrite(n.source),
    ImportExpression: n => { if (n.source.type == "Literal") rewrite(n.source) }
  })
  for (let patch of patches.sort((a, b) => b.from - a.from))
    code = code.slice(0, patch.from) + patch.text + code.slice(patch.to)
  return code
}

const examples = getExamples()

function showNotification(ref: HTMLElement, message: string) {
  let node = document.createElement("div")
  node.className = "notification"
  node.textContent = message
  let coords = ref.getBoundingClientRect()
  node.style.left = coords.left + "px"
  node.style.top = coords.bottom + 1 + "px"
  document.body.appendChild(node)
  setTimeout(() => node.remove(), 750)
}

type Loggable = string | number | boolean | null | undefined |
  {array: Loggable[]} |
  {object: {[prop: string]: Loggable}, ctor?: string} |
  {function: string} |
  {error: string, stack: string}

function showLog(values: Loggable[], type: string, elt: HTMLElement) {
  let wrap = document.createElement("div"), first = true
  wrap.className = "log-" + type
  for (let val of values) {
    if (first) first = false
    else wrap.appendChild(document.createTextNode(" "))
    wrap.appendChild(renderLoggable(val, 60, true))
  }
  elt.appendChild(wrap)
}

function span(cls: string, ...content: (string | Node)[]) {
  let elt = document.createElement("span")
  elt.className = cls
  for (let c of content) elt.appendChild(typeof c == "string" ? document.createTextNode(c) : c)
  return elt
}

function etcButton(onClick: (e: MouseEvent) => void) {
  let etc = document.createElement("button")
  etc.textContent = "…"
  etc.className = "log-etc"
  etc.onclick = onClick
  etc.setAttribute("aria-label", "expand")
  return etc
}

function renderLoggable(value: Loggable, space: number, top = false): Node {
  if (typeof value == "number") return span("tok-number", String(value))
  if (typeof value == "string") return top ? document.createTextNode(value) : span("tok-string", JSON.stringify(value))
  if (typeof value == "boolean") return span("tok-atom", String(value))
  if (value == null) return span("tok-keyword", String(value))
  let {function: fun, array, object, ctor, error} = value as any
  if (error) {
    return span("tok-invalid", error, " ", etcButton(e => expandError(e.target as HTMLElement, value)))
  } else if (fun) {
    return span("", span("tok-keyword", "function "), span("tok-variableName2", fun))
  } else if (array) {
    space -= 2
    let children: (string | Node)[] = ["["]
    let wrap: HTMLElement | undefined
    for (let elt of array) {
      if (children.length > 1) {
        children.push(", ")
        space -= 2
      }
      let next = space > 0 && renderLoggable(elt, space)
      let nextSize = next ? next.textContent.length : 0
      if (space - nextSize <= 0) {
        children.push(etcButton(() => expandObj(wrap!, array)))
        break
      }
      space -= nextSize
      children.push(next)
    }
    children.push("]")
    return wrap = span("log-array", ...children)
  } else {
    space -= 2
    let children: (string | Node)[] = []
    let wrap: HTMLElement | undefined
    if (ctor && ctor != "Object") {
      children.push(span("tok-typeName", ctor + " "))
      space -= ctor.length + 1
    }
    children.push("{")
    for (let prop of Object.keys(object)) {
      if (children[children.length - 1] !== "{") {
        space -= 2
        children.push(", ")
      }
      let next = null
      if (space > 0) {
        try { next = renderLoggable(object[prop], space) }
        catch (_) {}
      }
      let nextSize = next ? prop.length + 2 + next.textContent.length : 0
      if (!next || space - nextSize <= 0) {
        children.push(etcButton(() => expandObj(wrap!, object)))
        break
      }
      space -= nextSize
      children.push(span("tok-property", prop + ": "), next)
    }
    children.push("}")
    return wrap = span("log-object", ...children)
  }
}

function expandObj(node: HTMLElement, val: any) {
  let content = document.createElement("div")
  content.className = "log-prop-table"
  function addProp(name: string) {
    let rendered
    try { rendered = renderLoggable(val[name], 40) }
    catch (_) { return }
    content.appendChild(span("tok-property", name + ": "))
    content.appendChild(rendered)
  }
  if (Array.isArray(val)) {
    for (let i = 0; i < val.length; i++) addProp(String(i))
    node.parentNode.replaceChild(span("log-array", "[", content, "]"), node)
  } else {
    for (let prop of Object.keys(val)) addProp(prop)
    let children: (string | Node)[] = ["{", content, "}"]
    if ((node.firstChild as HTMLElement).className == "tok-typeName") children.unshift(node.firstChild!)
    node.parentNode.replaceChild(span("log-object", ...children), node)
  }
}

function parseStack(stack: string) {
  return stack.split("\n").map(line => /^\s*([\w$*.]*)/.exec(line)[1] || "<anonymous>")
}

function expandError(target: HTMLElement, val: any) {
  let frames = document.createElement("div")
  frames.className = "log-frames"
  for (let fn of parseStack(val.stack))
    frames.appendChild(document.createElement("div")).textContent = fn
  target.parentNode!.replaceChild(frames, target)
}

let tabNames = ["editor", "output", "log"]
let tabButtons = tabNames.map(n => document.querySelector(`#tab_${n}`)) as HTMLElement[]
let tabs = tabNames.map(n => document.querySelector(`#${n}`)) as HTMLElement[]

function getMode() {
  return innerWidth >= 1200 ? "wide" : "narrow"
}

let mode = getMode(), tab: number
function toggleTab(i: number) {
  tab = i
  if (mode == "wide") {
    tabs[0].style.display = "block"
    tabs[1].style.display = i != 2 ? "block" : ""
    tabs[2].style.display = i == 2 ? "block" : ""
    tabButtons[0].classList.remove("active")
    tabButtons[1].classList.toggle("active", i != 2)
    tabButtons[2].classList.toggle("active", i == 2)
  } else {
    for (let j = 0; j < tabs.length; j++) {
      tabs[j].style.display = j == i ? "block" : ""
      tabButtons[j].classList.toggle("active", j == i)
    }
  }
}
toggleTab(0)

window.addEventListener("resize", () => {
  if (getMode() != mode) {
    mode = getMode()
    toggleTab(tab)
  }
})

window.addEventListener("keydown", e => {
  if ((e.keyCode >= 49 && e.keyCode <= 51) && (e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey) {
    toggleTab(e.keyCode - 49)
    e.preventDefault()
  } else if (e.keyCode == 13 && (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) {
    run()
    e.preventDefault()
  }
})

for (let i = 0; i < tabs.length; i++)
  tabButtons[i].addEventListener("click", () => toggleTab(i))

;(document.querySelector("#run") as HTMLElement).onclick = () => run()
;(document.querySelector("#share") as HTMLElement).onclick = e => {
  navigator.clipboard.writeText(document.location.toString().replace(/[#?].*/, "") + "?c=" +
    btoa(view.state.doc.toString()))
  showNotification(e.target as HTMLElement, "URL copied!")
}
let exampleSelect = document.querySelector("#examples") as HTMLSelectElement
for (let name of Object.keys(examples))
  exampleSelect.appendChild(document.createElement("option")).textContent = name
exampleSelect.onchange = () => {
  let value = exampleSelect.value
  if (examples.hasOwnProperty(value)) {
    history.pushState({}, "", document.location.toString().replace(/[#?].*/, "") + "?example=" + encodeURIComponent(value))
    loadCode(examples[value])
    run()
  }
  exampleSelect.selectedIndex = 0
}

let urlCode = /[?&]code=([^&]+)/.exec(document.location.search)
let urlBCode = /[?&]c=([^&]+)/.exec(document.location.search)
let urlExample = /[?&]example=([^&]+)/.exec(document.location.search)
let view

function loadCode(code: string) {
  let state = EditorState.create({
    doc: code,
    extensions: [
      keymap.of([{key: "Ctrl-Enter", run: () => run()}]),
      basicSetup,
      javascript(),
    ]
  })
  if (view) view.setState(state)
  else view = new EditorView({state, parent: tabs[0]})
}
loadCode(urlCode ? decodeURIComponent(urlCode[1])
  : urlBCode ? atob(urlBCode[1])
  : urlExample && examples.hasOwnProperty(decodeURIComponent(urlExample[1])) ? examples[decodeURIComponent(urlExample[1])]
  : getDefaultCode())

function run() {
  if (mode == "narrow" && tab == 0) toggleTab(1)
  tabs[1].textContent = tabs[2].textContent = ""
  let frame = document.createElement("iframe")
  frame.setAttribute("sandbox", "allow-scripts allow-popups allow-modals allow-forms")
  frame.src = "sandbox.html"
  let code = view.state.doc.toString()
  let channel = new MessageChannel
  channel.port2.onmessage = event => {
    if (event.data.log) showLog(event.data.elements, event.data.log, tabs[2])
  }
  frame.onload = () => {
    frame.contentWindow.postMessage({type: "load", code: rewriteImports(code)}, "*", [channel.port1])
    frame.focus()
  }
  tabs[1].appendChild(frame)
  return true
}
run()

function getExamples() {
  let ex = {
    "Minimal editor": `
import {minimalSetup, EditorView} from "codemirror"

new EditorView({
  doc: "...",
  extensions: minimalSetup,
  parent: document.body
})
`,
    "Moving the selection": `
import {basicSetup, EditorView} from "codemirror"
import {keymap} from "@codemirror/view"

function moveToLine(view) {
  let line = prompt("Which line?")
  if (!/^\\d+$/.test(line) || +line <= 0 || +line > view.state.doc.lines)
    return false
  let pos = view.state.doc.line(+line).from
  view.dispatch({selection: {anchor: pos}, userEvent: "select"})
  return true
}

new EditorView({
  doc: "a\\nb\\nc\\n",
  extensions: [
    keymap.of([{key: "Alt-l", run: moveToLine}]),
    basicSetup,
  ],
  parent: document.body
})
`,
    "Custom completions": `
import {basicSetup, EditorView} from "codemirror"
import {autocompletion} from "@codemirror/autocomplete"

// Our list of completions (can be static, since the editor
/// will do filtering based on context).
const completions = [
  {label: "panic", type: "keyword"},
  {label: "park", type: "constant", info: "Test completion"},
  {label: "password", type: "variable"},
]

function myCompletions(context) {
  let before = context.matchBefore(/\\w+/)
  // If completion wasn't explicitly started and there
  // is no word before the cursor, don't open completions.
  if (!context.explicit && !before) return null
  return {
    from: before ? before.from : context.pos,
    options: completions,
    validFor: /^\\w*$/
  }
}

let view = new EditorView({
  doc: "// Type a 'p'\\n",
  extensions: [
    basicSetup,
    autocompletion({override: [myCompletions]})
  ],
  parent: document.body
})
`,
    "Single-line editor": `
import {minimalSetup, EditorView} from "codemirror"
import {EditorState} from "@codemirror/state"

new EditorView({
  doc: "You cannot add new lines in this editor",
  extensions: [
    minimalSetup,
    // Transaction filters can inspect transactions and
    // add/replace them with other transactions. If a
    // transaction would have made the document more than
    // one line long, it is filtered out.
    EditorState.transactionFilter.of(tr => {
      return tr.newDoc.lines > 1 ? [] : [tr]
    })
  ],
  parent: document.body
})
`,
    "Markdown code block highlighting": `
import {basicSetup, EditorView} from "codemirror"
import {markdown} from "@codemirror/lang-markdown"
import {languages} from "@codemirror/language-data"

// The Markdown parser will dynamically load parsers
// for code blocks, using @codemirror/language-data to
// look up the appropriate dynamic import.
let view = new EditorView({
  doc: "Hello\\n\\n\`\`\`javascript\\nlet x = 'y'\\n\`\`\`",
  extensions: [
    basicSetup,
    markdown({codeLanguages: languages})
  ],
  parent: document.body
})
`,
  }
  for (let prop of Object.keys(ex)) ex[prop] = ex[prop].trimStart()
  return ex
}

function getDefaultCode() {
  return `import {basicSetup, EditorView} from "codemirror"
import {javascript} from "@codemirror/lang-javascript"

new EditorView({
  doc: "console.log('hello')\\n",
  extensions: [basicSetup, javascript()],
  parent: document.body
})
`
}
