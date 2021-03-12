// @standalone

//!authorityState

import {ChangeSet, Text} from "@codemirror/state"
import {Update} from "@codemirror/collab"

// The updates received so far (updates.length gives the current
// version)
let updates: Update[] = []
// The current document
let doc = Text.of(["Start document"])

//!authorityMessage

let pending: ((value: any) => void)[] = []

self.onmessage = event => {
  function resp(value: any) {
    event.ports[0].postMessage(JSON.stringify(value))
  }
  let data = JSON.parse(event.data)
  if (data.type == "pullUpdates") {
    if (data.version < updates.length)
      resp(updates.slice(data.version))
    else
      pending.push(resp)
  } else if (data.type == "pushUpdates") {
    if (data.version != updates.length) {
      resp(false)
    } else {
      for (let update of data.updates) {
        // Convert the JSON representation to an actual ChangeSet
        // instance
        let changes = ChangeSet.fromJSON(update.changes)
        updates.push({changes, clientID: update.clientID})
        doc = changes.apply(doc)
      }
      resp(true)
      // Notify pending requests
      while (pending.length) pending.pop()!(data.updates)
    }
  } else if (data.type == "getDocument") {
    resp({version: updates.length, doc: doc.toString()})
  }
}
