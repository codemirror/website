const {writeFileSync, mkdirSync, readdirSync, statSync, linkSync, renameSync, existsSync} = require("fs")
const {join, dirname} = require("path")
const {sync: rimraf} = require("rimraf")

exports.mapDir = function mapDir(source, dest, map, add = {}) {
  let above = join(dest, ".."), id = Math.floor(Math.random() * 0xffff).toString(16)
  let temp = join(above, "tmp-output-" + id)
  let waitFor = []

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
        if (mapped && mapped.then) {
          waitFor.push(mapped.then(result => {
            writeFileSync(join(temp, result.name || prefixed), result.content)
          }))
        } else if (mapped) {
          writeFileSync(join(temp, mapped.name || prefixed), mapped.content)
        } else if (mapped !== false) {
          linkSync(path, join(temp, prefixed))
        }
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

  Promise.all(waitFor).then(() => {
    let moved
    if (existsSync(dest)) {
      moved = join(above, "moved-" + id)
      renameSync(dest, moved)
    }
    renameSync(temp, dest)
    if (moved) rimraf(moved)
  }).catch(e => {
    rimraf(temp)
    throw e
  })
}
