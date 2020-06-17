!{"type": "docs", "title": "CodeMirror System Guide"}

# System Guide

This is the guide to the CodeMirror editor system. It provides a prose
description of the system's functionality. For the item-by-item
documentation of its interface, see the [reference manual](../ref/).

## Architecture Overview

Because CodeMirror is structured quite a bit differently than your
classical JavaScript library (including its own previous versions), it
is recommended to read at least this section before jumping in, so
that you don't waste your time with mismatched expectations.

### Modularity

CodeMirror is set up as a collection of separate modules that,
together, provide a full-featured text and code editor. On the bright
side, this means that you can pick and choose which features you need,
and even replace core functionality with a custom implementation if
you need to. On the less bright side, this means that setting up an
editor requires you to put together a bunch of pieces.

The putting-together part isn't hard, but you will have to install and
import the pieces you need. The core packages, without which it'd be
hard to set up an editor at all, are:

 - [`@codemirror/next/text`](##text), which provides the [document
   representation](##text.Text) used by the editor (a rope-like data
   structure).

 - [`@codemirror/next/state`](##state), which defines data structures
   that represent the [editor state](##state.EditorState) and
   [changes](##state.Transaction) to that state.

 - [`@codemirror/next/view`](##view), a [display
   component](##view.EditorView) that knows how to show the editor
   state to the user, and translates basic editing actions into state
   updates.

 - [`@codemirror/next/commands](##commands) defines a lot of editing
   commands and some [key bindings](##commands.defaultKeymap) for
   them.

This is what a minimal viable editor might look like:

```javascript
import {EditorState} from "@codemirror/next/state"
import {EditorView, keymap} from "@codemirror/next/view"
import {defaultKeymap} from "@codemirror/next/commands"

let startState = EditorState.create({
  doc: "Hello World",
  extensions: [keymap(defaultKeymap)]
})

let view = new EditorView({
  state: startState,
  parent: document.body
})
```

Many things that you might expect to be part of the core, such as the
[line number gutter](##gutter.lineNumbers) or [undo
history](##history) are in fact separate packages. To make it easy to
get started, the [`@codemirror/next/basic-setup`](##basic-setup)
package pulls in most of the things you need for a baseline editor
(except a language package).

```javascript
import {EditorState, EditorView, basicSetup} from "@codemirror/next/basic-setup"
import {javascript} from "@codemirror/next/lang-javascript"

let view = new EditorView({
  state: EditorState.create({extensions: [basicSetup, javascript()]}),
  parent: document.body
})
```

The packages are distributed as [ES6 modules](FIXME). This means that
it is not currently practical to run the library without some kind of
bundler (which packages up a modular program into a single big
JavaScript file) or module loader. If you are new to bundling, I
recommend looking into [rollup](https://rollupjs.org/) or
[Webpack](FIXME).

### Functional Core, Imperative Shell

An attitude that guides the architecture of CodeMirror is that
functional (pure) code, which creates new values instead of having
side effects, is much easier to work with than imperative code. But
the browser DOM is obviously very imperative-minded, as are many of
the systems that CodeMirror integrate with.

To resolve this contradiction, the library's state representation is
strictly functional—the [document](##text.Text) and
[state](##state.EditorState) data structures are immutable, and
operations on them pure functions, whereas the [view
component](##view.EditorView) and command interface wrap these in an
imperative interface.

This means that an old state value stays intact even when the editor
moves on to a new state. Having both the old and the new state
available is often very useful when dealing with state changes. It
also means that directly changing a state value, or writing extensions
like additional [state fields](##state.StateFields) in an imperative
way will not do what you'd hope (and probably just break things).

The TypeScript interface tries to be very clear about this by marking
arrays and object properties as `readonly`. When using plain old
JavaScript it can be harder to remember this. But as a general rule,
unless explicitly described in the docs, reassignment of properties in
objects created by the library is just not supported.

```javascript
let state = EditorState.create({doc: "123"})
// BAD WRONG NO GOOD CODE:
state.doc = Text.of("abc") // <- DON'T DO THIS
```

### State and Updates

The library handles updates in a way inspired by approaches like
[Redux](FIXME) or [Elm](FIXME). With a few exceptions (like
composition and drag-drop handling), the state of the
[view](##view.EditorView) is entirely determined by the
[`EditorState`](##state.EditorState) value in its
[`state`](##view.EditorView.state) property.

Changes to that state happen in functional code, by
[creating](##state.EditorState.update) a
[transaction](##state.Transaction) that describes the changes to
document, selection, or other state [fields](##state.StateField). Such
a transaction can then be
[dispatched](##view.EditorView.dispatch), which
tells the view to update its state, at which point it'll synchronize
its DOM representation with the new state.

```javascript
// (Assume view is an EditorView instance holding the document "123".)
let transaction = view.state.update({changes: {at: 0, insert: "0"}})
console.log(transaction.state.doc.toString()) // "0123"
// At this point the view still shows the old state.
view.dispatch(transaction)
// And now it shows the new state.
```

The data flow during typical user interaction looks something like
this:

<style>.box { color: white; display: inline-block; border-radius: 5px; padding: 6px 15px; margin: 3px 0; }</style>
<div style="text-align: center; font-size: 120%; font-weight: bold; font-family: sans-serif;">
  <div class=box style="background: #c33;">DOM event</div>
  <div>↗<span style="width: 5em; display: inline-block;"></span>↘</div>
  <div>
    <div class=box style="margin: 0 2em 0 3em; background: #55b">view</div>
    <div class=box style="background: #77e">transaction</div>
  </div>
  <div>↖<span style="width: 5em; display: inline-block;"></span>↙</div>
  <div class=box style="background: #446;">new state</div>
</div>

The view listens for events. When DOM events come in, it (or a command
bound to a key, or an event handler registered by an extension)
translates them into state transactions and dispatches them. This
builds up a new state. When that new state is given to the view, it'll
update itself.

### Extension

Since the core library is rather minimal and generic, a lot of
functionality is implemented in system extensions. Extensions can do
all kinds of things, from merely configuring some
[option](##state.EditorState^tabSize), to defining new [fields in the
state object](##state.StateField), to [styling the
editor](##view.EditorView.theme), to [injecting](##view.ViewPlugin)
custom imperative components into the view. The system takes
[care](https://marijnhaverbeke.nl/blog/extensibility.html) to allow
extensions to compose without unexpected conflicts.

The set of active extensions is
[kept](##state.EditorStateConfig.extensions) in the editor state (and
can be [changed](##state.TransactionSpec.reconfigure) by a
transaction). Extensions are provided as [values](##state.Extension)
(usually imported from some package), or arrays of such values. They
can be arbitrarily nested (an array containing more arrays is also a
valid extension), and are deduplicated during the configuration
process. Thus, it is okay for extensions to pull in other
extensions—if the same one gets included multiple times, it'll only
take effect once.

When relevant, the precedence of extensions is determined first by
[explicitly set](##state.Precedence) precedence category, and within
that, by the position the extension has in the (flattened) collection
of extensions passed to the state.

```javascript
import {keymap} from "@codemirror/next/view"
import {EditorState, precedence} from "@codemirrror/next/state"

function dummyKeymap(tag) {
  return keymap([{
    key: "Ctrl-Space",
    run() { console.log(tag); return true }
  }])
}

let state = EditorState.create({extensions: [
  dummyKeymap("A"),
  dummyKeymap("B"),
  precedence(dummyKeymap("C"), "override")
]})
```

In a view using the state from that code, pressing Ctrl-Space will log
`"C"`, because, despite being last in the order of extensions, that
keymap is tagged with a higher precedence. If that weren't the case,
keymap `"A"` would be the first one to get a chance to handle the key
combination, since it occurs before the others.

A [later section](FIXME) of the guide goes into more detail on the
kinds of extensions that exist, and how to use them.

### Document Offsets

CodeMirror uses plain numbers to address positions in the document.
These represent character counts—more precisely, they count UTF16 code
units (so astral characters count as two units). Line breaks _always_
count as a single unit (even when you
[configure](##state.EditorState^lineSeparator) a line separator that
is longer than that).

These offsets are used to track the
[selection](##state.SelectionRange.head), position
[changes](##state.ChangeSpec), [decorate content](##view.Decoration),
and so on.

It is sometimes necessary to figure out where a position in a start
document ends up in a changed document. For this purpose, the library
provides a [position mapping](##state.ChangeDesc.mapPos) feature,
which, given a [transaction](##state.Transaction) (or just a [change
set](##state.ChangeSet) and a start position), can give you the
corresponding new position.

```javascript
import {EditorState} from "@codemirror/next/state"

let state = EditorState.create({doc: "1234"})
// Delete "23" and insert at "0" at the start.
let tr = state.update({changes: [{from: 1, to: 2}, {from: 0, insert: "0"}]})
// The position at the end of the old document is at 3 in the new document.
console.log(tr.changes.mapPos(4))
```

The document [data structure](##text.Text) also indexes by lines, so
it is not expensive to look things up by (1-based) line number.

```javascript
import {Text} from "@codemirror/next/text"

let doc = Text.of(["line 1", "line 2", "line 3"])
// Get information about line 2
console.log(doc.line(2)) // {start: 7, end: 13, ...}
// Get the line around position 15
console.log(doc.lineAt(15)) // {start: 14, end: 20, ...}
```

## Data Model

CodeMirror, being a _text_ editor, treats the document as a flat
string. It stores this in a tree-shaped [data structure](##text.Text)
to allow cheap updates anywhere in the document (and efficient
indexing by line number).

### Document Changes

Document changes are themselves [values](##state.ChangeSet),
describing precisely which ranges of the old document are being
replaced by which bits of new text. This allows extensions to track
precisely what happens to the document, allowing things like an [undo
history](##history) and [collaborative editing](##collab) to be
implemented outside the library core.

When creating a change set, all changes are described in terms of the
_original_ document—they conceptually all happen at once. (If you
really need to combine lists of changes where later changes refer to
the document created by earlier ones, you can use the changes set
[`compose`](##state.ChangeSet.compose) method.)

### Selection

Alongside the document, an editor [state](##state.EditorState) stores
a current [selection](##state.EditorSelection). Selections may consist
of multiple [ranges](##state.SelectionRange), each of which can be a
cursor ([empty](##state.SelectionRange.empty)) or cover a range
between its [anchor](##state.SelectionRange.anchor) and
[head](##state.SelectionRange.head)). Overlapping ranges are
automatically merged, and ranges are sorted, so that a selection's
[`ranges`](##state.Selection.ranges) property always holds a sorted,
non-overlapping array of ranges.

```javascript
import {EditorState, EditorSelection} from "@codemirror/next/state"

let state = EditorState.create({
  doc: "hello",
  selection: EditorSelection.create([
    EditorSelection.range(0, 4),
    EditorSelection.cursor(5)
  ]),
  extensions: EditorState.allowMultipleSelections.of(true)
})
console.log(state.selection.ranges.length) // 2

let tr = state.update(state.replaceSelection("!"))
console.log(tr.state.doc.toString()) // "!o!"
```

One of these ranges is marked as the
[_primary_](##state.EditorSelection.primary) one. This is the one that
the browser's DOM selection will reflect. The others are drawn and
handled entirely by the library.

By default a state will only accept selections with a single range.
You have to enable an extension (like
[`multipleSelections`](##view.multipleSelections)) that
[enables](##state.EditorState.allowMultipleSelections) multiple
selection ranges to get access to them.

State objects have a convenience method,
[`changeByRange`](##state.EditorState.changeByRange) for applying an
operation to every selection range separately (which can be a bit
awkward to do manually).

```javascript
import {EditorState} from "@codemirror/next/state"

let state = EditorState.create({doc: "abcd", selection: {anchor: 1, head: 3}})

// Upcase the selection
let tr = state.update(state.changeByRange(range => ({
  changes: {from: range.from, to: range.to,
            insert: state.sliceDoc(range.from, range.to).toUpperCase()},
  // The updated selection range—in this case it stays the same
  range
})))
console.log(tr.state.doc.toString()) // "aBCd"
```

### Configuration

Each editor state also has a (private) reference to its
_configuration_, which is determined by the extensions that are active
for that state. During regular transactions, the configuration stays
the same. But it is possible to reconfigure the state using the
[`reconfigure`](##state.TransactionSpec.reconfigure) or
[`replaceExtensions`](##state.TransactionSpec.replaceExtensions)
transaction directives.

The main effects of a state's configuration are the
[fields](##state.StateFields) it stores, and the values associated
with [facets](##state.Facet) for that state.

### Facets

A _facet_ is an extension point. Different extension values can
[_provide_](##state.Facet.of) values for the facet. And anyone with
access to the state can [read](##state.EditorState.facet) its combined
value. Depending on the facet, that may just be an array of provided
values, or some value computed from those.

The idea behind facets is that most types of extension allow multiple
inputs, but want to compute some coherent combined value from those.
How that combining works may differ.

 - For something like [tab size](##state.EditorState^tabSize), you
   need a single output value. So that facet takes the value with the
   highest precedence and uses that.

 - When providing [event
   handlers](##view.EditorView^domEventHandlers), you want the
   handlers as an array, sorted by precedence, so that you can try
   them one at a time until one of them handles the event.

 - Another common pattern is the compute the logical _or_ of the input
   values (as in
   [`allowMultipleSelections`](##state.EditorState^allowMultipleSelections))
   or reduce them in some other way (say, taking the maximum of the
   requested undo history depths).

```javascript
import {EditorState} from "@codemirror/next/state"

let state = EditorState.create({
  extensions: [
    EditorState.tabSize.of(16),
    EditorState.changeFilter.of(() => true)
  ]
})
console.log(state.facet(EditorState.tabSize)) // 16
console.log(state.facet(EditorState.changeFilter)) // [() => true]
```

Facets are explicitly [defined](##state.Facet^defined), producing a
facet value. Such a value can be exported, to allow other code to
provide and read it, or it can be kept module-private, in which case
only that module can access it. We'll come back to that in the section
on [writing extensions](FIXME).

In a given configuration, most facets tend to be static, provided only
directly as part of the configuration. But it is also possible to have
facet values [computed](##state.Facet.compute) from other aspects of
the state.

Facet values are only recomputed when necessary, so you can use an
object or array identity test to cheaply check whether a facet
changed.

### Transactions

Transactions, created with the state's
[`update`](##state.EditorState.update) method, combine a number of
effect (all optional):

 - It can apply [document changes](##state.TransactionSpec.changes).

 - It can explicitly move the
   [selection](##state.TransactionSpec.selection). Note that when
   there are document changes, but no explicit new selection, the
   selection will be implicitly [mapped](##state.EditorSelection.map)
   through these changes.

 - It can set a [flag](##state.TransactionSpec.scrollIntoView) that
   instructs the view to scroll the (primary) selection head into
   view.

 - It can have any number of
   [annotations](##state.TransactionSpec.annotations), which store
   additional metadata that describes the (entire) transaction. For
   example, the [`userEvent`](##state.Transaction.userEvent)
   annotation can be used to recognize transactions generated for
   certain common operations like typing or pasting.

 - It can have [effects](##state.TransactionSpec.effects), which are
   self-contained additional effects, typically on some extension's
   state (such as folding code or starting an autocompletion).

 - It can influence the state's configuration, either by providing a
   [completely new](##state.TransactionSpec.reconfigure) set of
   extensions, or by
   [replacing](##state.TransactionSpec.replaceExtensions) specific
   [tagged](##state.tagExtension) parts of the configuration.

To completely reset a state—for example to load a new document—it is
recommended to create a new state instead of a transaction. That will
make sure no unwanted state (such as undo history events) sticks
around.

## The View



## Extending the System

### State Fields

Extensions often need to store additional information in the state.
The undo [history](##history) needs to store undoable changes, the
code [folding](##fold) extension needs to track what has been folded,
and so on.

For this purpose, extensions can define additional [state
fields](##state.StateField). State fields, living inside the purely
functional [state](##state.EditorState) data structure, must store
immutable values.

### Affecting the View

### Decorating the Document

## Working with Syntax