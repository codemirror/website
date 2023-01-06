!{"type": "examples", "title": "CodeMirror Document Change Example"}

# Example: Document Changes

Initiating an editor state change from a program is done by
[dispatching](##view.EditorView.dispatch) a
[transaction](##state.Transaction).

```javascript
// Insert text at the start of the document
view.dispatch({
  changes: {from: 0, insert: "#!/usr/bin/env node\n"}
})
```

Changes (replacements) are [described](##state.ChangeSpec) with
`{from, to, insert}` objects. For insertions, `to` can be omitted, and
for deletions, `insert` can be omitted.

When dispatching a transaction, you can also pass an array of changes.
The `from`/`to` in each of these changes refer to positions in the
start document, not to the document created by previously listed
changes.

For example, to replace all tabs in a document with two spaces, you
could do something like this:

```javascript
let text = view.state.doc.toString(), pos = 0
let changes = []
for (let next; (next = text.indexOf("\t", pos)) > -1;) {
  changes.push({from: next, to: next + 1, insert: "  "})
  pos = next + 1
}
view.dispatch({changes})
```

When acting on the selection, you'll often want to create your
[transaction spec](##state.TransactionSpec) using the
[`replaceSelection`](##state.EditorState.replaceSelection) method.
This replaces each selection range with a given string, _and_ moves
the selection ranges to the end of that string (by default, they'd
stay in front of it):

```javascript
view.dispatch(view.state.replaceSelection("★"))
```

To do something more complicated with each [selection
range](##state.EditorSelection.ranges), without manually dealing with
the potentially complicated interactions between those ranges and the
changes created for them, you can use the
[`changeByRange`](##state.EditorState.changeByRange) helper. This
would wrap all ranges in underscores, for example:

```javascript
view.dispatch(view.state.changeByRange(range => ({
  changes: [{from: range.from, insert: "_"}, {from: range.to, insert: "_"}],
  range: EditorSelection.range(range.from, range.to + 2)
})))
```

The method takes a callback, which is called for each current
selection range. It should return an object enumerating the changes
for that range, plus the range's new position (taking into account the
changes made for that range, but not those made for other ranges).
