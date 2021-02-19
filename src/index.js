const Mold = require("mold-template")
const markdownIt = require("markdown-it")
const {join, dirname} = require("path")
const {readFileSync, readdirSync} = require("fs")
const {mapDir} = require("./mapdir")
const {buildRef} = require("./buildref")
const {buildLibrary, linkLibrary} = require("./library")
const {changelog} = require("./changelog")

const CodeMirror = require("codemirror/addon/runmode/runmode.node.js")
require("codemirror/mode/javascript/javascript.js")
require("codemirror/mode/xml/xml.js")
const escapeHtml = markdownIt().utils.escapeHtml

function highlight(str, lang) {
  if (lang == "html") lang = "text/html"
  let result = ""
  CodeMirror.runMode(str, lang, (text, style) => {
    let esc = escapeHtml(text)
    result += style ? `<span class="${style.replace(/^|\s+/g, "$&hl-")}">${esc}</span>` : esc
  })
  return result
}

const markdown = markdownIt({html: true, highlight}).use(require("markdown-it-deflist")).use(require("markdown-it-anchor"))

let base = join(__dirname, "..")

let currentRoot = ""

function resolveRefLinks(markdown, root) {
  return markdown.replace(/\]\(#(#.*?)\)/g, `](${root}docs/ref/$1)`)
}

function loadTemplates(dir, env) {
  let mold = new Mold(env)
  for (let filename of readdirSync(dir)) {
    let match = /^(.*?)\.html$/.exec(filename)
    if (match) mold.bake(match[1], readFileSync(join(dir, filename), "utf8").trim())
  }
  mold.defs.markdown = function(options) {
    if (typeof options == "string") options = {text: options}
    let text = resolveRefLinks(options.text, currentRoot)
    return markdown.render(text)
  }
  mold.defs.root = function() {
    return currentRoot
  }
  
  return mold
}

let mold = loadTemplates(join(base, "template"), {})

function injectCode(content, files) {
  let fileCode = files.map(f => readFileSync(f, "utf8")), m
  while (m = /\n!(\w+)\n/.exec(content)) {
    let found = false
    for (let i = 0; i < files.length; i++) {
      let code = fileCode[i], marker = "//!" + m[1] + "\n", start = code.indexOf(marker)
      if (start >= 0) {
        let end = code.indexOf("//!", start + marker.length)
        let mode = /\.ts$/.test(files[i]) ? "text/typescript" : /\.js$/.test(files[i]) ? "text/javascript" : "null"
        found = true
        content = content.slice(0, m.index + 1) + "```" + mode + "\n" +
          code.slice(start + marker.length, end < 0 ? code.length : end - 1).trimEnd() + "\n```\n" +
          content.slice(m.index + m[0].length + 1)
        break
      }
    }
    if (!found) throw new Error("Reference to missing code snippet " + m[1])
  }
  return content
}

function renderMD(fullPath, name, updateContent) {
  let text = readFileSync(fullPath, "utf8")
  let meta = /^!(\{[^]*?\})\n\n/.exec(text)
  let data = meta ? JSON.parse(meta[1]) : {}
  let content = meta ? text.slice(meta[0].length) : text
  if (data.injectCode) {
    let files = Array.isArray(data.injectCode) ? date.injectCode : [data.injectCode]
    content = injectCode(content, files.map(f => join(dirname(fullPath), f)))
  }
  if (updateContent) content = updateContent(content)
  data.content = content
  data.fileName = name
  return {name: name.replace(/\.md$/, ".html"),
          content: mold.defs[data.template || "page"](data)}
}

let siteDir = join(base, "site")
mapDir(siteDir, join(base, "output"), (fullPath, name) => {
  currentRoot = backToRoot(dirname(name))
  if (name == "docs/ref/index.html") {
    return {content: mold.bake(name, readFileSync(fullPath, "utf8"))({fileName: name, modules: buildRef(highlight, markdown)})}
  } else if (name == "codemirror.js") {
    return buildLibrary().then(code => ({content: code}))
  } else if (name == "docs/changelog/index.md") {
    return renderMD(fullPath, name, content => content + "\n\n" + changelog())
  } else if (/\.md$/.test(name)) {
    return renderMD(fullPath, name)
  } else if (/\.html$/.test(name)) {
    return {content: mold.bake(name, readFileSync(fullPath, "utf8"))({fileName: name})}
  } else if (/\.[jt]s$/.test(name)) {
    return linkLibrary(readFileSync(fullPath, "utf8"), /\.ts$/.test(name))
      .then(code => ({content: code, name: name.replace(/\.ts$/, ".js")}))
  } else {
    return null
  }
})

function backToRoot(dir) {
  let result = "./"
  while (dir != ".") {
    result += "../"
    dir = dirname(dir)
  }
  return result
}
