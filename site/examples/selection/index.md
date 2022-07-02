!{"type": "examples", "title": "CodeMirror Selection Example"}

# Example: Selection

The editor's state always holds at least one selection range. When
[multiple
selections](../../docs/ref/#state.EditorState^allowMultipleSelections)
are entabled, it may have several.

Ranges consist of an *anchor* (the side that doesn't move when you
shift-select) and a *head* (the moving side). When those are the same,
it is a cursor selection, otherwise it is a range.

When there are multiple selection ranges, of them will be considered
the *main* range (this is also the one that the native selection will
reflect). If you have an editor state, you can find the main selection
range with `state.selection.main`. It is a
[`SelectionRange`](##state.SelectionRange) object with `anchor` and
`head` properties (and also `from`/`to` if you're interested in the
minimum or maximum side) holding document positions.

Like any editor state change, moving the selection is done by
dispatching a transaction. For example, this moves the cursor to the
start of the document:

```javascript
view.dispatch({selection: {anchor: 0}})
```

The [`selection`](##state.TransactionSpec.selection) property on a
transaction spec takes either a shorthand `{anchor: number, head?:
number}` object, or a full
[`EditorSelection`](##state.EditorSelection) instance.

This code creates two selection ranges selecting the 4th and 6th
character in the editor, and a cursor selection at 8. It makes the
second range the primary one.

```javascript
view.dispatch({
  selection: EditorSelection.create([
    EditorSelection.range(4, 5),
    EditorSelection.range(6, 7),
    EditorSelection.cursor(8)
  ], 1)
})
```

When a transaction makes a document change as well as setting the
selection, the new selection should point into the document as it is
*after* the change. For example, here's how you could insert an
asterisk at position 10 and then put the cursor after it.

```javascript
view.dispatch({
  changes: {from: 10, insert: "*"},
  selection: {anchor: 11}
})
```

When writing commands that act on the selection, you have to take some
care to support multiple ranges. Helper methods like
[`replaceSelection`](##state.EditorState.replaceSelection) (which
replaces all ranges with the same text) and
[`changeByRange`](##state.EditorState.changeByRange) (which allows you
to specify changes per range and merges them into a single transaction
spec) can be useful.
