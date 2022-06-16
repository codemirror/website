const {writeFileSync, mkdirSync, readdirSync, statSync, linkSync, unlinkSync, renameSync, existsSync} = require("fs")
const {join, dirname} = require("path")
const {sync: rimraf} = require("rimraf")

let nothing = Promise.resolve(undefined)

function write(path, data) {
  mkdirSync(dirname(path), {recursive: true})
  writeFileSync(path, data)
}

function writeResult(result, dest, name) {
  if (Array.isArray(result)) {
    for (let part of result) write(join(dest, part.name), part.content)
  } else {
    write(join(dest, result.name || name), result.content)
  }
}

exports.mapFile = function mapFile(name, fullPath, dest, map) {
  let mapped = map(fullPath, name)
  if (mapped && mapped.then) {
    return mapped.then(result => writeResult(result, dest, name))
  } else if (mapped) {
    writeResult(mapped, dest, name)
    return nothing
  } else if (mapped !== false) {
    let destPath = join(dest, name)
    mkdirSync(dirname(destPath), {recursive: true})
    if (existsSync(destPath)) unlinkSync(destPath)
    linkSync(fullPath, destPath)
    return nothing
  }
}

exports.mapDir = async function mapDir(source, dest, map, add = {}) {
  let above = join(dest, ".."), id = Math.floor(Math.random() * 0xffff).toString(16)
  let temp = join(above, "tmp-output-" + id)
  let waitFor = []

  function walkDir(dir, prefix) {
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
      write(join(temp, added), add[added])
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
