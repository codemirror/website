const Mold = require("mold-template")
const markdownIt = require("markdown-it")
const {join, dirname} = require("path")
const {readFileSync, readdirSync} = require("fs")
const {mapDir, mapFile} = require("./mapdir")
const {buildRef} = require("./buildref")
const {buildLibrary, linkLibrary} = require("./library")
const {changelog} = require("./changelog")
const {linkMods} = require("./linkmods")

const {highlightTree, classHighlighter} = require("@lezer/highlight")
const {parser: jsParser} = require("@lezer/javascript")
const {parser: htmlParser} = require("@lezer/html")
const {parser: cssParser} = require("@lezer/css")

const escapeHtml = markdownIt().utils.escapeHtml

const parsers = {
  html: htmlParser,
  css: cssParser,
  javascript: jsParser,
  typescript: jsParser.configure({dialect: "ts"}),
  shell: null
}

function highlight(str, lang) {
  if (lang && !parsers.hasOwnProperty(lang))
    console.warn("No highlighting available for " + lang)
  let parser = parsers[lang]
  if (!parser) return str
  let result = "", pos = 0
  highlightTree(parser.parse(str), classHighlighter, (from, to, cls) => {
    if (from > pos) result += escapeHtml(str.slice(pos, from))
    result += `<span class="${cls}">${escapeHtml(str.slice(from, to))}</span>`
    pos = to
  })
  if (pos < str.length) result += escapeHtml(str.slice(pos))
  return result
}

const markdown = markdownIt({html: true, highlight})
  .use(require("markdown-it-deflist"))
  .use(require("markdown-it-anchor"))

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
        let mode = /\.ts$/.test(files[i]) ? "typescript" : /\.js$/.test(files[i]) ? "javascript" : "null"
        let snippet = code.slice(start + marker.length, end < 0 ? code.length : end - 1).trimEnd()
        while (snippet[0] == "\n") snippet = snippet.slice(1)
        found = true
        content = content.slice(0, m.index + 1) + "```" + mode + "\n" +
          snippet + "\n```\n" +
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
    let files = Array.isArray(data.injectCode) ? data.injectCode : [data.injectCode]
    content = injectCode(content, files.map(f => join(dirname(fullPath), f)))
  }
  if (updateContent) content = updateContent(content)
  data.content = content
  data.fileName = name
  return {name: name.replace(/\.md$/, ".html"),
          content: mold.defs[data.template || "page"](data)}
}

let siteDir = join(base, "site"), outDir = join(base, "output")
let file = process.argv[2]

if (file)
  mapFile(file, join(siteDir, file), outDir, map)
else
  mapDir(siteDir, outDir, map)

function map(fullPath, name) {
  currentRoot = backToRoot(dirname(name))
  if (name == "docs/ref/index.html") {
    return {content: mold.bake(name, readFileSync(fullPath, "utf8"))({fileName: name, modules: buildRef(highlight)})}
  } else if (name == "codemirror.js") {
    return buildLibrary().then(code => ({content: code}))
  } else if (name == "docs/changelog/index.md") {
    return renderMD(fullPath, name, content => content + "\n\n" + changelog())
  } else if (name == "try/mods/generate") {
    return linkMods("try/mods")
  } else if (/\.md$/.test(name)) {
    return renderMD(fullPath, name)
  } else if (/\.html$/.test(name)) {
    return {content: mold.bake(name, readFileSync(fullPath, "utf8"))({fileName: name})}
  } else if (/\.[jt]s$/.test(name)) {
    let content = readFileSync(fullPath, "utf8")
    if (/@omit\b/.test(content)) return false
    return linkLibrary(content, {
      ts: /\.ts$/.test(name),
      path: fullPath,
      standalone: /@standalone\b/.test(content),
      babel: /@babel\b/.test(content)
    }).then(code => ({content: code, name: name.replace(/\.ts$/, ".js")}))
  } else {
    return null
  }
}

function backToRoot(dir) {
  let result = "./"
  while (dir != ".") {
    result += "../"
    dir = dirname(dir)
  }
  return result
}
