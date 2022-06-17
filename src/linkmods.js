const path = require("path")
const fs = require("fs")
const {parse} = require("acorn")
const {simple} = require("acorn-walk")
const {core, nonCore} = require("../../bin/packages")

function mangle(name) {
  return name.replace(/\//g, "-") + (/\.js$/.test(name) ? "" : ".js")
}

function resolveImports(code, peers) {
  let tree = parse(code, {ecmaVersion: "latest", sourceType: "module"})
  let patches = []
  let rewrite = node => {
    if (node && peers.has(node.value))
      patches.push({
        from: node.start, to: node.end,
        text: JSON.stringify(`./${mangle(node.value)}`)
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

exports.linkMods = function(modDir) {
  let code = new Map
  let work = core.concat(nonCore).map(n => n == "codemirror" ? n : `@codemirror/${n}`)
  while (work.length) {
    let name = work.pop()
    if (code.has(name)) continue
    let main = require.resolve(name == "@codemirror/legacy-modes" ? name + "/mode/javascript" : name), mainDir
    for (let dir = path.dirname(main);;) {
      if (fs.existsSync(path.join(dir, "package.json"))) { mainDir = dir; break }
      let next = path.dirname(dir)
      if (next == dir) throw new Error("No package.json found for " + name)
      dir = next
    }
    let package = require(path.join(mainDir, "package.json"))
    if (name == "@codemirror/legacy-modes") {
      for (let mode of fs.readdirSync(path.join(mainDir, "mode")).filter(f => /\.js$/.test(f)))
        code.set(name + "/mode/" + mode, fs.readFileSync(path.join(mainDir, "mode", mode), "utf8"))
    } else {
      if (!package.module && !package.exports) console.log(package)
      let mod = path.join(package.module || package.exports.import)
      code.set(name, fs.readFileSync(path.join(mainDir, mod), "utf8"))
      for (let dep of Object.keys(package.dependencies || {}).concat(Object.keys(package.peerDependencies || {}))) {
        if (!code.has(dep)) work.push(dep)
      }
    }
  }
  return Array.from(code.entries()).map(([name, content]) => {
    return {
      name: path.join(modDir, mangle(name)),
      content: resolveImports(content, code)
    }
  })
}
