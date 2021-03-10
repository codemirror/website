!{"type": "examples", "title": "CodeMirror Reconfiguration Example"}

# Example: Dynamic Configuration

CodeMirror's configuration system is somewhat unusual in that an
editor's configuration is provided in the form of a
[_tree_](##state.Extension): a nested structure of arrays, with mostly
[facet providers](##state.Facet.of) as leaves. This makes it
composable—an extension can include other extensions if it needs to.

But it does mean that you can't just call a set-option method to
change your configuration on the fly, because configuration doesn't
have the shape that it has in, for example, CodeMirror 5: a map from
option names to values. That is mostly a good thing—extensions _will_
need to affect configuration, and doing that without stepping on each
other's toes is difficult when each option has exactly one value,
which is replaced with a new value when updated.

Instead, some things that you'd think of as an option, such as [tab
size](##state.EditorState^tabSize), are defined as a
[facet](##state.Facet). Facets take multiple inputs and explicitly
define some way to combine them, which avoids most such conflicts.

Other bit of configuration, like [language
support](##language.LanguageSupport), may consist of an entire
constellation of extensions, and don't fit the labeled-option model
very well in the first place.

## Compartments

Still, dynamic reconfiguration is useful in an editor. In order to be
able to partially reconfigure a tree of extensions, we need to divide
it into [_compartments_](##state.Compartment). Transactions can update
the configuration by replacing the content of individual compartments.

```javascript
import {basicSetup, EditorView} from "@codemirror/basic-setup"
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

## Private compartments

The above example shows how the editor's main configuration can be
divided into compartments. But compartments may nest, and the
extension tree produced by some plugin may use its own compartments to
dynamically en- or disable some extensions.

If you just need to dynamically change the vale of some known facet,
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
import {Compartment} from "@codemirror/state"
import {keymap} from "@codemirror/view"

export function toggleWith(key, extension) {
  let myCompartment = new Compartment
  return [
    myCompartment.of([]),
    keymap.of([{
      key,
      run(view) {
        let on = myCompartment.get(view.state) == extension
        view.dispatch({
          effects: myCompartment.reconfigure(on ? [] : extension)
        })
        return true
      }
    }])
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

## Top-level reconfiguration

Sometimes you need to replace the system's main configuration. There's
a [state effect](##state.StateEffect^reconfigure) that replaces the
top-level extension that was provided when creating the state with a
new one.

```javascript
import {StateEffect} from "@codemirror/state"

export function deconfigure(view) {
  view.dispatch({
    effects: StateEffect.reconfigure([])
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
