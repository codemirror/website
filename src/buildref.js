const {gatherMany} = require("gettypes")
const {build, browserImports} = require("builddocs")
const {join, relative} = require("path")
const {existsSync, readdirSync, readFileSync} = require("fs")

let root = join(__dirname, "../..")

exports.buildRef = function buildRef(highlight, markdown) {
  if (process.env.NO_REF) return []

  function buildOptions(name) {
    return {
      name,
      anchorPrefix: name + ".",
      allowUnresolvedTypes: false,
      markdownOptions: {highlight},
      breakAt: 45,
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
        let sibling = type.typeSource && modules.find(m => type.typeSource.startsWith(m.relative))
        if (sibling) return "#" + sibling.name + "." + type.type
      }, type => {
        if (/\blezer[\/-]tree\b/.test(type.typeSource)) return `https://lezer.codemirror.net/docs/ref/#tree.${type.type}`
        if (/\blezer\b/.test(type.typeSource)) return `https://lezer.codemirror.net/docs/ref/#lezer.${type.type}`
        if (/\bstyle-mod\b/.test(type.typeSource)) return "https://github.com/marijnh/style-mod#documentation"
      }, browserImports]
    }
  }

  let ignore = /package.json|legacy-modes/
  let modules = Object.keys(require(join(root, "package.json")).exports).filter(x => !ignore.test(x)).map(pth => {
    let name = /^\.\/(.+)/.exec(pth)[1]
    let base = join(root, name), main = join(base, require(join(base, "package.json")).types + ".ts")
    return {name, base, main, relative: relative(process.cwd(), base)}
  })

  let legacySrc = join(root, "legacy-modes", "mode")
  let legacy = readdirSync(legacySrc).filter(f => /\.d.ts$/.test(f)).map(file => {
    let name = /^(.*)\.d\.ts$/.exec(file)[1]
    return {name, filename: join(legacySrc, file), basedir: join(root, "legacy-modes")}
  })

  let items = gatherMany(modules.map(mod => ({filename: mod.main, basedir: mod.base})).concat(legacy))
  return modules.map((mod, i) => {
    let main = join(mod.main, "../README.md")
    return {
      name: mod.name,
      content: build({...buildOptions(mod.name), main: existsSync(main) ? main : null}, items[i])
    }
  }).concat({
    name: "legacy-modes",
    content: markdown.render(readFileSync(join(legacySrc, "README.md"), "utf8")) + legacy.map((l, i) => {
      let id = "legacy-" + l.name
      return `<h3 id=${id}><span class=kind>mode/</span><a href="#${id}">${l.name}</a></h3>` + build(buildOptions(id), items[modules.length + i])
    }).join("\n")
  })
}
