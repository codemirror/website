const {gatherMany} = require("getdocs-ts")
const {build, browserImports} = require("builddocs")
const {join} = require("path")
const {existsSync, readdirSync, readFileSync} = require("fs")

let root = join(__dirname, "../..")
const {loadPackages, core} = require("../../bin/packages")

exports.buildRef = function buildRef(highlight) {
  if (process.env.NO_REF) return []

  function buildOptions(name) {
    return {
      name,
      anchorPrefix: name + ".",
      allowUnresolvedTypes: false,
      markdownOptions: {highlight},
      extendMarkdown: m => m.use(require("markdown-it-anchor"), {
        slugify: s => "h_" + String(s).toLowerCase().replace(/[^a-z0-9]+/g, "_")
      }),
      breakAt: 55,
      processType(type) {
        let ext = null
        // Kludge to de-inline the Extension type when it is found in a union type
        if (type.type == "union" && type.typeArgs.length > 2 &&
            type.typeArgs.some(t => t.type == "ReadonlyArray" && (ext = t.typeArgs[0]).type == "Extension"))
          return Object.assign({}, type, {typeArgs: [ext].concat(type.typeArgs.filter(t => {
            return !((t.type == "ReadonlyArray" && t.typeArgs[0].type == "Extension") ||
                     (t.type == "Object" && t.properties?.extension))
          }))})
      },
      imports: [type => {
        let sibling = type.typeSource && modules.find(m => type.typeSource.startsWith("../" + m.name + "/"))
        if (sibling) return "#" + sibling.name + "." + type.type
      }, type => {
        if (/\blezer[\/\\]common\b/.test(type.typeSource)) return `https://lezer.codemirror.net/docs/ref/#common.${type.type}`
        if (/\blezer[\/\\]lr\b/.test(type.typeSource)) return `https://lezer.codemirror.net/docs/ref/#lr.${type.type}`
        if (/\blezer[\/\\]highlight\b/.test(type.typeSource)) return `https://lezer.codemirror.net/docs/ref/#highlight.${type.type}`
        if (/\bstyle-mod\b/.test(type.typeSource)) return "https://github.com/marijnh/style-mod#documentation"
        if (/\bvscode-languageserver-/.test(type.typeSource))
          return `https://microsoft.github.io/language-server-protocol/specifications/specification-current#` +
            type.type[0].toLowerCase() + type.type.slice(1)
      }, browserImports]
    }
  }

  let modules = loadPackages().packages.filter(p => core.includes(p.name)).map(pkg => {
    return {name: pkg.name, base: pkg.dir, main: pkg.main}
  })

  let items = gatherMany(modules.map(mod => ({filename: mod.main, basedir: mod.base})))
  return modules.map((mod, i) => {
    let main = join(mod.main, "../README.md")
    return {
      name: mod.name,
      content: build({...buildOptions(mod.name), main: existsSync(main) ? main : null}, items[i])
    }
  })
}
