const {writeFileSync, mkdirSync, readdirSync, statSync, linkSync, renameSync, existsSync} = require("fs")
const {join, dirname} = require("path")
const {sync: rimraf} = require("rimraf")

exports.mapDir = function mapDir(source, dest, map, add = {}) {
  let above = join(dest, ".."), id = Math.floor(Math.random() * 0xffff).toString(16)
  let temp = join(above, "tmp-output-" + id)

  function walkDir(dir, prefix) {
    mkdirSync(join(temp, prefix), {recursive: true})
    for (let filename of readdirSync(dir)) {
      let path = join(dir, filename)
      let stat = statSync(path)
      let prefixed = join(prefix, filename)
      if (stat.isDirectory()) {
        walkDir(path, prefixed)
      } else {
        let mapped = map(path, prefixed)
        let outPath = join(temp, mapped && mapped.name ? mapped.name : prefixed)
        if (mapped) writeFileSync(outPath, mapped.content)
        else if (mapped !== false) linkSync(path, outPath)
      }
    }
  }

  try {
    walkDir(source, "")
    for (let added in add) {
      writeFileSync(join(temp, added), add[added])
    }
  } catch(e) {
    rimraf(temp)
    throw e
  }

  let moved
  if (existsSync(dest)) {
    moved = join(above, "moved-" + id)
    renameSync(dest, moved)
  }
  renameSync(temp, dest)
  if (moved) rimraf(moved)
}
