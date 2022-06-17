(() => {

let outChannel = null

addEventListener("message", e => {
  if (e.origin != document.location.origin) return
  if (e.data.type == "load") {
    outChannel = e.ports[0]
    let tag = document.createElement("script")
    tag.type = "module"
    tag.textContent = e.data.code
    document.body.appendChild(tag)
  }
})

function ctorName(obj) {
  let ctor = obj.constructor?.name
  if (ctor) return ctor
  let m = /\[object (\w+)\]/.exec(obj + "")
  return m ? m[1] : null
}

function serialize(val) {
  let seen = new Set
  function inner(val) {
    if (val instanceof Error) return {error: val.toString(), stack: val.stack}
    if (typeof val == "function") return {function: val.name || "?"}
    if (val == null || typeof val != "object") return val
    if (seen.has(val)) return {cycle: true}
    seen.add(val)
    if (Array.isArray(val)) return {array: val.map(inner)}
    let result = {object: Object.create(null), ctor: ctorName(val)}
    for (let prop of Object.keys(val)) {
      try { result.object[prop] = inner(val[prop]) }
      catch {}
    }
    return result
  }
  return inner(val)
}

function wrapConsole(level) {
  let old = console[level]
  console[level] = (...args) => {
    old.apply(console, args)
    if (outChannel) outChannel.postMessage({log: level, elements: args.map(serialize)})
  }
}
wrapConsole("log")
wrapConsole("warn")
wrapConsole("error")

window.addEventListener("error", e => console.error(e.error))

})()
