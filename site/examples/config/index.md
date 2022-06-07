!{"type": "examples", "title": "CodeMirror Configuration Example", "injectCode": "./language.ts"}

# Example: Configuration

A CodeMirror editor's configuration lives in its [state
object](##state.EditorState). When creating a state, you
[pass](##state.EditorStateConfig.extensions) it a set of extensions to
use, which will be resolved into an effective configuration.

[Extensions](##state.Extension) can be created by various library
functions, and do things like adding an input for a
[facet](##state.Facet) or installing a [state
field](##state.StateField). They can be grouped in arrays, and most
practical extensions consist of multiple smaller extensions.

For example, the [history](##commands.history) extension contains a
state field that records the undo history, a facet that controls the
extension's configuration, and a view plugin that listens for
[`beforeinput`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/beforeinput_event)
events. Code using the history doesn't have to worry about that
though—it can just drop the extension value produced by the function
into its configuration to install all the necessary parts.

The [basic setup](##codemirror.basicSetup) is a larger example of
this—it holds an array throwing together a whole cartload of different
extensions, which together configure a basic code editor.

## Precedence

With facet [inputs](##state.Facet.of), order matters. The
configuration resolves them in a specific order, and for most facets,
that order matters. For example with [event
handlers](##view.EditorView^domEventHandlers), [transaction
filters](##state.EditorState^transactionFilter), or
[keymaps](##view.keymap), it determines which gets called first. With
settings like the [line separator](#state.EditorState^lineSeparator)
or [indentation unit](##language.indentUnit), the value with the
highest precedence wins.

When a configuration is resolved, by default, the tree of nested
arrays of extensions are simply flattened into a sequence. Inputs to a
given facet are then collected in the order they appear in that
sequence.

So you you specify `[keymap.of(A), keymap.of(B)]` as a configuration,
bindings from `A` take precedence over those in `B`. If you nest more
deeply...

```javascript
[..., [keymap.of(A)], ..., [[], ..., [keymap.of(B)]]]
```

... `A` still comes before `B` in the flat ordering.

There is just one further complication, which allows extensions to
provide a hint on where sub-extensions should go. When an extension is
wrapped in a call to one of the properties of [`Prec`](##state.Prec),
its parts are put in a different bucket from the default sequence
during configuration flattening. There are
[highest](##state.Prec.highest), [high](##state.Prec.high),
[default](##state.Prec.default), [low](##state.Prec.low), and
[lowest](##state.Prec.lowest) buckets.

Within each bucket, ordering is still controlled by the position of
the extensions in the flattened sequence. But all extensions in a
higher-precedence bucket come before all extensions in a
lower-precedence one.

So in an extension like this, `A` 

```javascript
[Prec.high(A), B, Prec.high([C, D])]
```

The extensions will be ordered `A`, `C`, `D`, `B`, because the ones
with high precedence come before `B` with its default precedence.

In general, explicit precedence is used by extension providers to put
(parts of) their extension in a specific bucket. For example, a
special-purpose key binding that only applies in a specific situation
might be given an extending precedence, so that it gets to run before
the bulk of the keybindings. Or a default piece of configuration might
be given a fallback precedence so that any other values provided will
by default override it.

Ordering of extensions in arrays, on the other hand, is generally done
by the code putting together a complete configuration from various
extension providers, and allows for a more global control.

## Dynamic Configuration

In this configuration system you can't just call a set-option method
to change your configuration on the fly, because configuration doesn't
have the shape that it has in, for example, CodeMirror 5: A map from
option names to values.

That is mostly a good thing—extensions _will_ need to affect
configuration, and doing that without stepping on each other's toes is
difficult when each option has exactly one value, which is replaced
with a new value when updated. Facets take multiple inputs and
explicitly define some way to combine them, which mostly avoids such
conflicts.

### Compartments

Still, dynamic reconfiguration is useful in an editor. In order to be
able to partially reconfigure a tree of extensions, we need to divide
it into [_compartments_](##state.Compartment). Transactions can update
the configuration by replacing the content of individual compartments.

```javascript
import {basicSetup, EditorView} from "codemirror"
import {EditorState, Compartment} from "@codemirror/state"
import {python} from "@codemirror/lang-python"

let language = new Compartment, tabSize = new Compartment

let state = EditorState.create({
  extensions: [
    basicSetup,
    language.of(python()),
    tabSize.of(EditorState.tabSize.of(8))
  ]
})

let view = new EditorView({
  state,
  parent: document.body
})
```

When you've done this, you can dispatch transactions to change your
configuration.

```javascript
function setTabSize(view, size) {
  view.dispatch({
    effects: tabSize.reconfigure(EditorState.tabSize.of(size))
  })
}
```

### Private Compartments

The above example shows how the editor's main configuration can be
divided into compartments. But compartments may nest, and the
extension tree produced by some plugin may use its own compartments to
dynamically en- or disable some extensions.

If you just need to dynamically change the value of some known facet,
it is preferable to use [computed facets](##state.Facet.compute)
instead of reconfiguration, since those are more efficient and easier
to keep track of (they are a form of derived state, rather than adding
new fundamental state).

But if you have something like an extension that wants to
conditionally enable another extension, locally declaring a
compartment and reconfiguring that as needed works well.

For example, this function returns an extension that binds the given
key to toggle another extension on and off.

```javascript
import {Extension, Compartment} from "@codemirror/state"
import {keymap, EditorView} from "@codemirror/view"

export function toggleWith(key: string, extension: Extension) {
  let myCompartment = new Compartment
  function toggle(view: EditorView) {
    let on = myCompartment.get(view.state) == extension
    view.dispatch({
      effects: myCompartment.reconfigure(on ? [] : extension)
    })
    return true
  }
  return [
    myCompartment.of([]),
    keymap.of([{key, run: toggle}])
  ]
}
```

With which you can do something like...

```javascript
toggleWith("Mod-o", EditorView.editorAttributes.of({
  style: "background: yellow"
}))
```

If the parent compartment of such an extension is reconfigured, the
extension, along with its local compartment, will simply vanish from
the configuration.

### Top-Level Reconfiguration

Sometimes you need to replace the system's main configuration. There's
a [state effect](##state.StateEffect^reconfigure) that replaces the
top-level extension that was provided when creating the state with a
new one.

```javascript
import {StateEffect} from "@codemirror/state"

export function deconfigure(view) {
  view.dispatch({
    effects: StateEffect.reconfigure.of([])
  })
}
```

That function is never a good idea, since it'll mostly just render
your editor useless, but it shows how to do a top-level
reconfiguration. This is slightly different from just creating a new
editor state, in that it'll preserve the content of state
[fields](##state.StateField) and compartments that exist in both the
old and the new configuration.

Another thing you can do is _add_ extension with the
[`appendConfig`](##state.StateEffect^appendConfig) effect. Extensions
added in this way are added to the end of the top-level configuration,
and stay there until a full reconfiguration happens.

This can be useful to inject extensions on demand. For example,
[snippet completion](##autocomplete.snippet), the first time it is
activated, adds a state field that tracks which snippet field the user
is in.

```javascript
function injectExtension(view, extension) {
  view.dispatch({
    effects: StateEffect.appendConfig.of(extension)
  })
}
```

## Automatic Language Detection

This example sets up an editor that dynamically changes its
[language](../lang-package/) configuration in response to the
(auto-detected) language of the editor content.

In order to be able to affect transactions as they are being created
(as opposed to dispatching a separate reconfiguring extension after
the change), we'll use a [transaction
extender](##state.EditorState^transactionExtender). Whenever the
document content changes, our extender does a crude check (whether the
doc starts with a `<` character) to determine whether the document
contains HTML or JavaScript code.

When the detected language disagrees with the (primary) language
configured for the state, the transaction is extended with a
[reconfiguration effect](##state.Compartment.reconfigure) that
switches the language config compartment to the appropriate
extensions.

!autoLanguage

If we specify an initial language configuration, we must be careful to
[wrap](##state.Compartment.of) it with our compartment, so that when
the extension updates the language, that part of the configuration
gets replaced.

!enable

The result acts like this:

<div id=editor></div>
<script defer src="../../codemirror.js"></script>
<script defer src="language.js"></script>
