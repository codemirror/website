const resolve = require("@rollup/plugin-node-resolve").default
const sucrase = require("@rollup/plugin-sucrase")
const {rollup} = require("rollup")
const {join, dirname} = require("path")
const {readFileSync} = require("fs")

async function runRollup(code, config = {}, {ext = "js", path} = {}) {
  let base = path && dirname(path)
  let bundle = await rollup({
    ...config,
    input: "XXX." + ext,
    plugins: [
      {
        name: "loadcode",
        resolveId(source, from) {
          if (/XXX/.test(source)) return "XXX"
          if (from == "XXX" && source[0] == "." && path) return join(base, source)
        },
        load(name) {
          if (/XXX/.test(name)) return code
          if (base && name.startsWith(base)) return linkCode(readFileSync(name, "utf8"))
        }
      },
      ...config.plugins || [],
      resolve()
    ],
    onwarn(warning, handle) {
      if (warning.code != "MISSING_NAME_OPTION_FOR_IIFE_EXPORT") handle(warning)
    }
  })
  let output = (await bundle.generate({format: "iife", file: "out.js", ...config.output || {}})).output[0]
  return output.code
}

function runBabel(code) {
  let compact = process.env.COMPACT != "false"
  return require("@babel/core").transformSync(code, {
    filename: "codemirror.js",
    babelrc: false,
    compact,
    comments: !compact,
    plugins: ["transform-for-of-as-array"]
  }).code
}

const {all: packages} = require("../../bin/packages")

let exclude = /^(stream-syntax|language-data|legacy-modes|lang-)$/
let include = /^lang-(css|html|javascript)$/
let bundledModules = packages.filter(n => !exclude.test(n) || include.test(n))
    .map(n => n == "codemirror" ? n : "@codemirror/" + n).concat(["@lezer/lr", "@lezer/common", "@lezer/highlight", "crelt"])

exports.buildLibrary = () => {
  return runRollup(
    `import ${JSON.stringify(join(__dirname, "..", "polyfills.js"))}\n` +
    bundledModules.map((id, i) => `import * as _m${i} from ${JSON.stringify(id)}`).join("\n") +
    `\nwindow.CM = {\n  ${bundledModules.map((id, i) => JSON.stringify(id) + ": _m" + i).join(",\n  ")}\n}\n`).then(runBabel)
}

const {parse} = require("acorn")
const {simple} = require("acorn-walk")

function linkCode(code) {
  let tree = parse(code, {ecmaVersion: "latest", sourceType: "module"})
  let patches = []
  simple(tree, {
    ImportDeclaration: node => {
      if (node.source && bundledModules.indexOf(node.source.value) > -1) {
        let imported = /\s+(\{[^}]*\}|\w+)/.exec(code.slice(node.start + 5, node.end))
        patches.push({
          from: node.start, to: node.end,
          text: `const ${imported[1].replace(/ as /g, ": ")} = CM[${JSON.stringify(node.source.value)}];`
        })
      }
    }
  })
  for (let patch of patches.sort((a, b) => b.from - a.from))
    code = code.slice(0, patch.from) + patch.text + code.slice(patch.to)
  return code
}

exports.linkLibrary = (code, {ts, path, standalone, babel}) => {
  let plugins = []
  if (ts) plugins.push(sucrase({transforms: ['typescript'], include: /XXX/}))
  if (!standalone) plugins.push({name: "link-CM", transform: code => ({code: linkCode(code)})})
  let result = runRollup(code, {plugins}, {ext: "ts", path})
  return babel ? result.then(runBabel) : result
}
