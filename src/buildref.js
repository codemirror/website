const {gather} = require("gettypes")
const {build, browserImports} = require("builddocs")
const {join, relative} = require("path")
const {existsSync} = require("fs")

class Mod {
  constructor(name, main = "src/index.ts") {
    this.name = name
    this.base = "../" + name
    this.main = this.base + "/" + main
    this.relative = relative(process.cwd(), this.base) + "/"
  }
}

exports.buildRef = function buildRef() {
  let modules = [
    new Mod("state"),
    new Mod("text"),
    new Mod("view"),
    new Mod("commands", "src/commands.ts"),
    new Mod("history", "src/history.ts"),
    new Mod("gutter"),
    new Mod("extension", "src/extension.ts"),
    new Mod("rangeset", "src/rangeset.ts"),
    new Mod("special-chars", "src/special-chars.ts"),
    new Mod("syntax"),
    new Mod("matchbrackets", "src/matchbrackets.ts"),
    new Mod("keymap", "src/keymap.ts"),
    new Mod("multiple-selections", "src/multiple-selections.ts"),
    new Mod("highlight", "src/highlight.ts"),
    new Mod("stream-syntax", "src/stream-syntax.ts"),
    new Mod("lang-javascript", "src/javascript.ts"),
    new Mod("lang-css", "src/css.ts"),
    new Mod("lang-html", "src/html.ts")
  ]

  return modules.map(mod => {
    let items = gather({filename: mod.main, basedir: mod.base})
    let main = join(mod.main, "../README.md")
    return {
      name: mod.name,
      content: build({
        name: mod.name,
        anchorPrefix: mod.name + ".",
        main: existsSync(main) ? main : null,
        allowUnresolvedTypes: false,
        markdownFilter: exports.linkRef,
        imports: [type => {
          let sibling = type.typeSource && modules.find(m => type.typeSource.startsWith(m.relative))
          if (sibling) return "#" + sibling.name + "." + type.type
        }, type => {
          if (/\blezer[\/-]tree\b/.test(type.typeSource)) return `https://lezer.codemirror.net/docs/ref/#tree.${type.type}`
          if (/\blezer\b/.test(type.typeSource)) return `https://lezer.codemirror.net/docs/ref/#lezer.${type.type}`
          if (/\bstyle-mod\b/.test(type.typeSource)) return "https://github.com/marijnh/style-mod#documentation"
        }, browserImports]
      }, items)
    }
  })
}

exports.linkRef = function linkRef(markdown) {
  return markdown.replace(/\]\(#(#.*?)\)/g, "](/docs/ref/$1)")
}
