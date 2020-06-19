const {gather} = require("gettypes")
const {build, browserImports} = require("builddocs")
const {join, relative} = require("path")
const {existsSync} = require("fs")

let root = join(__dirname, "../..")

exports.buildRef = function buildRef(highlight) {
  if (process.env.NO_REF) return []

  let modules = Object.keys(require(join(root, "package.json")).exports).map(pth => {
    let name = /^\.\/(.+)/.exec(pth)[1]
    let base = join(root, name), main = join(base, require(join(base, "package.json")).types + ".ts")
    return {name, base, main, relative: relative(process.cwd(), base)}
  })

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
        markdownOptions: {highlight},
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
