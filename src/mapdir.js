const {writeFileSync, mkdirSync, readdirSync, statSync, linkSync, renameSync, existsSync} = require("fs")
const {join, dirname} = require("path")
const {sync: rimraf} = require("rimraf")

let nothing = Promise.resolve(undefined)

exports.mapFile = function mapFile(name, fullPath, dest, map) {
  let mapped = map(fullPath, name)
  if (mapped && mapped.then) {
    return mapped.then(result => {
      writeFileSync(join(dest, result.name || name), result.content)
    })
  } else if (mapped) {
    writeFileSync(join(dest, mapped.name || name), mapped.content)
    return nothing
  } else if (mapped !== false) {
    linkSync(fullPath, join(dest, name))
    return nothing
  }
}

exports.mapDir = async function mapDir(source, dest, map, add = {}) {
  let above = join(dest, ".."), id = Math.floor(Math.random() * 0xffff).toString(16)
  let temp = join(above, "tmp-output-" + id)
  let waitFor = []

  function walkDir(dir, prefix) {
    if (/tmp-output/.test(dir)) throw new Error("STOH")
    mkdirSync(join(temp, prefix), {recursive: true})
    
    for (let filename of readdirSync(dir)) {
      let path = join(dir, filename)
      let stat = statSync(path)
      let prefixed = join(prefix, filename)
      if (stat.isDirectory()) {
        walkDir(path, prefixed)
      } else {
        let promise = exports.mapFile(prefixed, path, temp, map)
        if (promise != nothing) waitFor.push(promise)
      }
    }
  }

  let done = false
  try {
    walkDir(source, "")
    for (let added in add) {
      writeFileSync(join(temp, added), add[added])
    }
    for (let p of waitFor) await p
    let moved
    if (existsSync(dest)) {
      moved = join(above, "moved-" + id)
      renameSync(dest, moved)
    }
    renameSync(temp, dest)
    done = true
    if (moved) rimraf(moved)
  } finally {
    if (!done) rimraf(temp)
  }
}
