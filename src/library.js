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
    .map(n => "@codemirror/" + n).concat(["lezer", "lezer-tree", "crelt"])

exports.buildLibrary = () => {
  return runRollup(
    `import ${JSON.stringify(join(__dirname, "..", "polyfills.js"))}\n` +
    bundledModules.map((id, i) => `import * as _m${i} from ${JSON.stringify(id)}`).join("\n") +
    `\nwindow.CM = {\n  ${bundledModules.map((id, i) => JSON.stringify(id) + ": _m" + i).join(",\n  ")}\n}\n`).then(runBabel)
}

function linkCode(code) {
  return code.replace(/\bimport\s+(\{[^]*?\})\s+from\s+(".*?"|'.*?')/g, (all, bindings, mod) => {
    if (bundledModules.indexOf(JSON.parse(mod)) < 0) return all
    return `const ${bindings.replace(/ as /g, ": ")} = CM[${mod}]`
  })
}

exports.linkLibrary = (code, {ts, path, standalone, babel}) => {
  let result = runRollup(standalone ? code : linkCode(code), {
    plugins: ts ? [sucrase({transforms: ['typescript'], include: /XXX/})] : [],
  }, {ext: "ts", path})
  return babel ? result.then(runBabel) : result
}
