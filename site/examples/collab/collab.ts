import {Update, receiveUpdates, sendableUpdates, collab, getSyncedVersion} from "@codemirror/collab"
import {basicSetup} from "@codemirror/basic-setup"
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
    await (this.disconnected ? this.disconnected.wait : pause(latency))
    let result = await this._request(value)
    await (this.disconnected ? this.disconnected.wait : pause(latency))
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

const worker = new Worker("./worker.js")

function pushUpdates(
  connection: Connection,
  version: number,
  updates: readonly Update[]
): Promise<boolean> {
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

function currentDocument(
  worker: Worker
): Promise<{version: number, doc: Text}> {
  return new Connection(worker, () => 0).request({type: "getDocument"})
    .then(({version, doc}) => ({version, doc: Text.of(doc.split("\n"))}))
}

function peerExtension(startVersion: number, connection: Connection) {
  let plugin = ViewPlugin.fromClass(class {
    private mustPush = -1

    constructor(private view: EditorView) { this.pull() }

    update(update: ViewUpdate) {
      if (update.docChanged) this.pushSoon(10)
    }

    pushSoon(delay: number) {
      clearTimeout(this.mustPush)
      this.mustPush = setTimeout(() => this.push(), delay)
    }

    async push() {
      this.mustPush = -1
      let updates = sendableUpdates(this.view.state)
      let version = getSyncedVersion(this.view.state)
      if (!updates.length) return
      let success = await pushUpdates(connection, version, updates)
      this.pushSoon(success ? 10 : 500)
    }

    async pull() {
      for (;;) {
        let version = getSyncedVersion(this.view.state)
        let updates = await pullUpdates(connection, version)
        this.view.dispatch(receiveUpdates(this.view.state, updates))
      }
    }
  })
  return [collab({startVersion}), plugin]
}

async function addPeer() {
  let {version, doc} = await currentDocument(worker)
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
