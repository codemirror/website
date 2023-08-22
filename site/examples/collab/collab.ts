import {Update, receiveUpdates, sendableUpdates, collab, getSyncedVersion} from "@codemirror/collab"
import {basicSetup} from "codemirror"
import {ChangeSet, EditorState, Text} from "@codemirror/state"
import {EditorView, ViewPlugin, ViewUpdate} from "@codemirror/view"

;(document.querySelector("#addpeer") as HTMLButtonElement).onclick = addPeer

function pause(time: number) {
  return new Promise<void>(resolve => setTimeout(resolve, time))
}

function currentLatency() {
  let base = +(document.querySelector("#latency") as HTMLInputElement).value
  return base * (1 + (Math.random() - 0.5))
}

class Connection {
  private disconnected: null | {wait: Promise<void>, resolve: () => void} = null

  constructor(private worker: Worker,
              private getLatency: () => number = currentLatency) {}

  private _request(value: any): Promise<any> {
    return new Promise(resolve => {
      let channel = new MessageChannel
      channel.port2.onmessage = event => resolve(JSON.parse(event.data))
      this.worker.postMessage(JSON.stringify(value), [channel.port1])
    })
  }

  async request(value: any) {
    let latency = this.getLatency()
    if (this.disconnected) await this.disconnected.wait
    await pause(latency)
    let result = await this._request(value)
    if (this.disconnected) await this.disconnected.wait
    await pause(latency)
    return result
  }

  setConnected(value: boolean) {
    if (value && this.disconnected) {
      this.disconnected.resolve()
      this.disconnected = null
    } else if (!value && !this.disconnected) {
      let resolve, wait = new Promise<void>(r => resolve = r)
      this.disconnected = {wait, resolve}
    }
  }
}

//!wrappers

function pushUpdates(
  connection: Connection,
  version: number,
  fullUpdates: readonly Update[]
): Promise<boolean> {
  // Strip off transaction data
  let updates = fullUpdates.map(u => ({
    clientID: u.clientID,
    changes: u.changes.toJSON()
  }))
  return connection.request({type: "pushUpdates", version, updates})
}

function pullUpdates(
  connection: Connection,
  version: number
): Promise<readonly Update[]> {
  return connection.request({type: "pullUpdates", version})
    .then(updates => updates.map(u => ({
      changes: ChangeSet.fromJSON(u.changes),
      clientID: u.clientID
    })))
}

function getDocument(
  connection: Connection
): Promise<{version: number, doc: Text}> {
  return connection.request({type: "getDocument"}).then(data => ({
    version: data.version,
    doc: Text.of(data.doc.split("\n"))
  }))
}

//!peerExtension

function peerExtension(startVersion: number, connection: Connection) {
  let plugin = ViewPlugin.fromClass(class {
    private pushing = false
    private done = false

    constructor(private view: EditorView) { this.pull() }

    update(update: ViewUpdate) {
      if (update.docChanged) this.push()
    }

    async push() {
      let updates = sendableUpdates(this.view.state)
      if (this.pushing || !updates.length) return
      this.pushing = true
      let version = getSyncedVersion(this.view.state)
      await pushUpdates(connection, version, updates)
      this.pushing = false
      // Regardless of whether the push failed or new updates came in
      // while it was running, try again if there's updates remaining
      if (sendableUpdates(this.view.state).length)
        setTimeout(() => this.push(), 100)
    }

    async pull() {
      while (!this.done) {
        let version = getSyncedVersion(this.view.state)
        let updates = await pullUpdates(connection, version)
        this.view.dispatch(receiveUpdates(this.view.state, updates))
      }
    }

    destroy() { this.done = true }
  })
  return [collab({startVersion}), plugin]
}

//!rest

const worker = new Worker("./worker.js")

async function addPeer() {
  let {version, doc} = await getDocument(new Connection(worker, () => 0))
  let connection = new Connection(worker)
  let state = EditorState.create({
    doc,
    extensions: [basicSetup, peerExtension(version, connection)]
  })
  let editors = document.querySelector("#editors")
  let wrap = editors.appendChild(document.createElement("div"))
  wrap.className = "editor"
  let cut = wrap.appendChild(document.createElement("div"))
  cut.innerHTML = "<label><input type=checkbox aria-description='Cut'>✂️</label>"
  cut.className = "cut-control"
  cut.querySelector("input").addEventListener("change", e => {
    let isCut = (e.target as HTMLInputElement).checked
    wrap.classList.toggle("cut", isCut)
    connection.setConnected(!isCut)
  })
  new EditorView({state, parent: wrap})
}

addPeer()
addPeer()
