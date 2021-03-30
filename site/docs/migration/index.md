!{"type": "docs", "title": "CodeMirror 5 to 6 Migration Guide"}

# Migration Guide

This guide provides rough translations of how various basic operations
in the CodeMirror 5.x interface work with the new system. To do
anything complicated, you'll definitely have to read [the
guide](../guide/), but for quick translations of a few simple method
calls, this document might be enough.

## Module System

The 5.x library was distributed as UMD modules, which could either be
loaded directly with `<script>` tags or bundled as CommonJS modules.
The new version exposes only modules, which will require some kind of
build step before you can use them.

In addition, the library has been split into a number of separate
packages under the `@codemirror` scope. Depending on how closely you
want to configure the editor and how much features you want to load,
you could start with the [`@codemirror/basic-setup`](##basic-setup),
or hand-pick the core modules you need from the list provided in the
[reference manual](../ref/).

Language support also lives in separate packages. There's a number of
languages available in dedicated packages, with names like
[`@codemirror/lang-javascript`](https://github.com/codemirror/lang-javascript)
or [`@codemirror/lang-rust`](https://github.com/codemirror/lang-rust).
Many of the CodeMirror 5 modes have been ported to CodeMirror 6's
[stream-parser](##stream-parser) interface and are available in the
[`@codemirror/legacy-modes`](https://github.com/codemirror/legacy-modes)
package.

See the [bundling example](../../examples/bundle/) for a basic example
of how to load the library in the browser.

## Creating an Editor

[`EditorView`](##view.EditorView) from the [view](##view) package is
roughly the equivalent of the `CodeMirror` class from 5.x. This is a
stateful object that manages the editor's DOM representation and basic
user interaction.

```javascript
import {EditorView} from "@codemirror/view"
let view = new EditorView({parent: document.body})
```

The [`parent`](##view.EditorView.constructor^config.parent) option
makes the editor append itself to a given node in the DOM. We'll just
crudely pass `document.body` there in these examples, but you'll
usually pass your custom mount point there. It is also possible not to
provide it and, after creating the editor, manually insert
[`view.dom`](##view.EditorView.dom) somewhere.

The new editor view comes with a bit less built-in behavior than the
old `CodeMirror` class, though. By default it doesn't provide things
like key bindings and an undo history.

To add a [history](##history) and a default set of [key
bindings](##commands.defaultKeymap), we must add a few
[extensions](##state.Extension) to the editor. Configuration lives in
the state, so in order to do that we'll have to create an [editor
state](##state.EditorState) and provide that to the view.

```javascript
import {keymap, EditorView} from "@codemirror/view"
import {EditorState} from "@codemirror/state"
import {history, historyKeymap} from "@codemirror/history"
import {defaultKeymap} from "@codemirror/commands"

let view = new EditorView({
  state: EditorState.create({
    extensions: [
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
    ]
  }),
  parent: document.body
})
```

Next, in order to highlight source code, we have to load a language
package and a highlight style, and make sure those are enabled.

```javascript
import {defaultHighlightStyle} from "@codemirror/highlight"
import {javascript} from "@codemirror/lang-javascript"

  // Add these extensions
  javascript(),
  defaultHighlightStyle,
```

This gives you an editor with JavaScript highlighting and indentation.

A line number gutter is also available as an
[extension](##gutter.lineNumbers), as are features like [rectangular
selection](##rectangular-selection.rectangularSelection) and
highlighting of [non-printing
characters](##view.highlightSpecialChars).

By default, the view will show the browser's native selection. If you
prefer something closer to the old custom-drawn selection, use the
[`drawSelection`](##view.drawSelection) extension. You can also enable
[multiple selections](##state.EditorState^allowMultipleSelections).

## Positions

Whereas CodeMirror 5 used `{line, ch}` objects to point at document
positions, CodeMirror 6 just uses offsets—the number of characters
(UTF16 code units) from the start of the document, counting line
breaks as one character. This decision was made because manipulating
plain numbers is a lot simpler and more efficient than working with
such objects.

To get information about the line that includes a given position, you
can call `.state.doc.`[`lineAt`](##text.Text.lineAt)`(pos)`. The other
way around, you can go from a line number to a line object with the
[`line`](##text.Text.line) method.

But **note**: in CodeMirror 6 the first line has number 1, whereas
CodeMirror 5 lines started at 0.

So to convert between old-style positions and offsets, you could use
functions like these:

```javascript
function posToOffset(doc, pos) {
  return doc.line(pos.line + 1).from + pos.ch
}
function offsetToPos(doc, offset) {
  let line = doc.lineAt(offset)
  return {line: line.number - 1, ch: offset - line.from}
}
```

For method equivalents shown in this document, assume that positions
used in the new code are always offsets.

## Getting the Document and Selection

Your [`EditorView`](##view.EditorView) object has a
[`state`](##view.EditorView.state) property that holds an object
representing its current [state](##state.EditorState). This stores
things like the [document](##state.EditorState.doc),
[selection](##state.EditorState.selection), and configuration.

You can access the current document via
[`.state.doc`](##state.EditorState.doc). That holds an
[object](##text.Text) storing the document as a tree of lines.

```javascript
cm.getValue() → cm.state.doc.toString()

cm.getRange(a, b) → cm.state.sliceDoc(a, b)

cm.getLine(n) → cm.state.doc.line(n + 1).text

cm.lineCount() → cm.state.doc.lines
```

The [selection](##state.EditorSelection), like in the previous
version, consists of a number of selection
[ranges](##state.EditorSelection.ranges), one of which is considered
the [main](##state.EditorSelection.main) selection.

```javascript
cm.getCursor() → cm.state.selection.main.head

cm.listSelections() → cm.state.selection.ranges

cm.getSelection() → cm.state.sliceDoc(
  cm.state.selection.main.from,
  cm.state.selection.main.to)

cm.getSelections() → cm.state.selection.ranges.map(r => cm.state.sliceDoc(r.from, r.to))

cm.somethingSelected() → cm.state.selection.ranges.some(r => !r.empty)
```

## Making Changes

In the old interface, changes to the editor state were made via direct
method calls to the editor object. In version 6, updates are wrapped
in [transactions](##state.Transaction) and then
[dispatched](##view.EditorView.dispatch) to the view up to update it.

This means that different types of update go through a single method,
which takes one or more objects describing the changes, and applies
them atomically. Document changes are described by the
[`changes`](##state.TransactionSpec.changes) property of the
transaction specs.

```javascript
cm.replaceRange(text, from, to) → cm.dispatch({
  changes: {from, to, insert: text}
})

cm.setValue(text) → cm.dispatch({
  changes: {from: 0, to: cm.state.doc.length, insert: text}
})
// Or, if the entire state (undo history, etc) should be reset
cm.setState(EditorState.create({doc: text, extensions: ...}))

cm.replaceSelection(text) → cm.dispatch(cm.state.replaceSelection(text))
```

The selection is updated with the
[`selection`](##state.TransactionSpec.selection) property.

```javascript
cm.setCursor(pos) → cm.dispatch({selection: {anchor: pos}})

cm.setSelection(anchor, head) → cm.dispatch({selection: {anchor, head}})

cm.setSelections(ranges) → cm.dispatch({
  selection: EditorSelection.create(ranges)
})

cm.extendSelectionsBy(f) ⤳ cm.dispatch({
  selection: EditorSelection.create(
    cm.state.selection.ranges.map(r => r.extend(f(r))))
})
```

Situations that would, in the old interface, require the use of
`operation` to group updates together tend to not really come up
anymore, since you will just group all your updates into a single
transaction.

When making multiple changes at once
([`changes`](##state.TransactionSpec.changes) can also take an array
of change objects), all `from` and `to` positions refer to the
document at the start of the transaction (as opposed to the document
created by the changes before it). This makes it a lot easier to apply
composite changes.

To create changes based on the selection ranges (along with updated
selection ranges), it is recommended to use the
[`changeByRange`](##state.EditorState.changeByRange) helper method.

## DOM Structure

The new library creates a rather different DOM structure for the
editor. If you're writing custom CSS for the editor, you'll probably
have to change it a bit. Class names roughly correspond like this:

```
CodeMirror → cm-editor
CodeMirror-line → cm-line
CodeMirror-scroll → cm-scroller
CodeMirror-sizer → cm-content
CodeMirror-focused → cm-focused
CodeMirror-gutters → cm-gutters
CodeMirror-gutter → cm-gutter
CodeMirror-gutter-elt → cm-gutterElement
```

Highlighting tokens are no longer assigned stable CSS classes. Rather,
a [highlight style](##highlight.HighlightStyle) produces generated
class names for specific syntactic structures. To write or port a
theme, see the [One Dark
theme](https://github.com/codemirror/theme-one-dark) as an example.

```javascript
cm.focus() → cm.focus()

cm.hasFocus() → cm.hasFocus

cm.getWrapperElement() → cm.dom

cm.getScrollerElement() → cm.scrollDOM

// This is always a contentEditable element
cm.getInputField() → cm.contentDOM
```

## Configuration

Instead of a set of named options, the new configuration system uses a
tree of [extension](#state.Extension) values. Refer to the
[guide](../guide/#configuration) for a description of this system.

This means that instead of setting an option when creating your
editor, you just dump the extension value that implements the behavior
you want into your set of [state
extensions](##state.EditorStateConfig.extensions). In many cases (such
as keymaps), the order of the extensions is relevant—those provided
first have a higher precedence than those provided later.

Dynamically changing the configuration is a bit more involved. This
requires you to [tag](##state.tagExtension) parts of your
configuration that you may need to change in advance, and then later
dispatch a transaction that
[reconfigures](##state.TransactionSpec.reconfigure) that part.

```javascript
let view = new EditorView({
  state: EditorState.create({
    extensions: [
      // ...
      tagExtension("tabSize", EditorState.tabSize.of(2))
    ]
  })
})

function setTabSize(size) {
  view.dispatch({
    reconfigure: {tabSize: EditorState.tabSize.of(size)}
  })
}
```

## Events

CodeMirror 6 no longer uses an event system. The main reason for this
is that that kind of asynchronous notification interface makes it
really hard to implement more complex customizations in a robust way,
and that events tend to be too fine-grained—a given event handler just
tells you about one aspect of what changed, and you need to awkwardly
piece together information from multiple events to get a bigger
picture of what's happening.

Instead, state updates are represented by
[transactions](##state.Transaction), which group all the available
information about the update. If you need to maintain state in sync
with other parts of the editor state, you'll want to use [custom state
fields](##state.StateField) for that. Those are updated for every
transaction using a “reducer”—a function that takes the previous state
and a transaction, and produces a new state.

On the imperative side, updates to the view are represented by
[`ViewUpdate`](##view.ViewUpdate) objects. It is possible to just
listen for those with an [update
listener](##view.EditorView^updateListener). But if you need your
response to the update to directly affect the editor somehow, you
might want to define a [view plugin](##view.ViewPlugin) instead.

Changing or filtering updates as they happen (similar to the old
`"beforeChange"` and `"beforeSelectionChange"` events) can be done
with [change filters](##state.EditorState^changeFilter), [transaction
filters](##state.EditorState^transactionFilter), or [transaction
extenders](##state.EditorState^transactionExtender).

## Commands

The concept of "commands" still exists, but there is no longer a
central registry of named commands (getting rid of central registries
was one of the goals of the redesign). [Commands](##view.Command) are
simply functions that take an editor instance and, if they can,
perform a side effect and return true. The
[`@codemirror/commands`](##commands) package exports a number of basic
editing commands (many of which are bound in the [default
keymap](##commands.defaultKeymap)), and other packages may export
their own relevant commands (see for example [`undo`](##history.undo)
and [`redo`](##history.redo) in the history package).

Key bindings are defined as [objects](##view.KeyBinding), and a keymap
is simply an array of those. Use the [`keymap`](##view.keymap) facet
to add keymaps to your configuration. When multiple commands are bound
to a key, they are executed in order of precedence until one of them
returns true.

## CodeMirror.fromTextArea

Version 5 has a static `fromTextArea` method that tries to
transparently replace a given `<textarea>` element with a CodeMirror
instance. Unfortunately, this was never very robust (or even
transparent), so I've decided not to provide this convenience function
in version 6.

Basically, what `fromTextArea` did was insert the editor as a sibling
of the textarea, hide the textarea, and, through various hacks, wire
up form submission to sync the content of the editor back to the
textarea (automatically syncing on every change gets too expensive for
big documents).

In its most minimal form, you can do something like this to get
similar behavior:

```javascript
function editorFromTextArea(textarea, extensions) {
  let view = new EditorView({
    state: EditorState.create({doc: textarea.value, extensions})
  })
  textarea.parentNode.insertBefore(view.dom, textarea)
  textarea.style.display = "none"
  if (textarea.form) textarea.form.addEventListener("submit", () => {
    textarea.value = view.state.doc.toString()
  })
  return view
}
```

## Marked Text

Marked text (and bookmarks) are called
[decorations](##view.Decoration) in the new system, and creating them
is a bit more difficult (but also a lot less error-prone).

Instead of adding and removing marks through a side effect,
decorations are _provided_ by extensions, scoped to their source
extension, and only present as long as that extension continues to
provide them.

That means you can't just call a method to mark some text, but have to
define an extension to manage it. Decorations are kept in a [range
set](##rangeset.RangeSet), a data structure that associates ranges in
the document with some extra data. The extension must
[map](##rangeset.RangeSet.map) these sets to stay in sync with the
document on changes.

This is an example of a simple extension that maintains a set of
decorations.

```javascript
import {StateField, StateEffect} from "@codemirror/state"
import {EditorView, Range, Decoration, DecorationSet} from "@codemirror/view"

// Effects can be attached to transactions to communicate with the extension
const addMarks = StateEffect.define(), filterMarks = StateEffect.define()

// This value must be added to the set of extensions to enable this
const markField = StateField.define({
  // Start with an empty set of decorations
  create() { return Decoration.none },
  // This is called whenever the editor updates—it computes the new set
  update(value, tr) {
    // Move the decorations to account for document changes
    value = value.map(tr.changes)
    // If this transaction adds or removes decorations, apply those changes
    for (let effect of tr.effects) {
      if (effect.is(addMarks)) value = value.update({add: effect.value, sort: true})
      else if (effect.is(filterMarks)) value = value.update({filter: effect.value})
    }
    return value
  },
  // Indicate that this field provides a set of decorations
  provide: f => EditorView.decorations.from(f)
})
```

You could use that extension to mark text like this:

```javascript
const strikeMark = Decoration.mark({
  attributes: {style: "text-decoration: line-through"}
})
view.dispatch({
  effects: addMarks.of([strikeMark.range(1, 4)])
})
```

Or to remove all marks between `a` and `b`:

```javascript
function removeMarks(a, b) {
  view.dispatch({
    effects: filterMarks.of((from, to) => to <= a || from >= b)
  })
}
```

Read the docs for [decorations](##view.Decoration) to see how to
collapse parts of the document, insert widgets, or style lines.

In cases where there would be a _lot_ of marks (for example to manage
code highlighting), this approach, which eagerly calculates and
maintains marks for the entire document, may not be ideal. See the
[zebra stripes example](../../example/zebra/) to learn how to write an
extension that computes decorations only for visible code.
