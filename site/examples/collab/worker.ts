// @standalone

import {ChangeSet, Text} from "@codemirror/state"
import {Update} from "@codemirror/collab"

let updates: Update[] = []
let doc = Text.of(["Start document"])
let pending: ((value: any) => void)[] = []

onmessage = event => {
  function resp(value: any) {
    event.ports[0].postMessage(JSON.stringify(value))
  }
  let data = JSON.parse(event.data)
  if (data.type == "pushUpdates") {
    if (data.version != updates.length) {
      resp(false)
    } else {
      for (let update of data.updates) {
        let changes = ChangeSet.fromJSON(update.changes)
        updates.push({changes, clientID: update.clientID})
        doc = changes.apply(doc)
      }
      resp(true)
      while (pending.length) pending.pop()!(data.updates)
    }
  } else if (data.type == "pullUpdates") {
    if (data.version < updates.length)
      resp(updates.slice(data.version))
    else
      pending.push(resp)
  } else if (data.type == "getDocument") {
    resp({version: updates.length, doc: doc.toString()})
  }
}
