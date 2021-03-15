!{"type": "examples", "title": "CodeMirror Panel Example", "injectCode": ["./help-panel.ts", "./word-count.ts"]}

# Example: Editor Panels

A “panel”, as supported by the [@codemirror/panel](##panel) package,
is a UI element shown above or below the editor. They will sit inside
the editor's vertical space for editors with fixed height. When the
editor is partially scrolled out of view, panels will be positioned to
say in view.

This example shows how to add panels to your editor.

## Opening and Closing Panels

The set of panels to show at a given time is determined by the value
of the [`showPanel`](##panel.showPanel) facet. To track the current
state of our panel, we define this [state field](##state.StateField),
with an [effect](##state.StateEffect) to turn it on or off.

!helpState

The `provide` option wires this field up to the `showPanel` facet. The
`createHelpPanel` function is define like this:

!createHelpPanel

It's not a very useful panel. The [object](##panel.Panel) it returns
can, apart from providing the panel's DOM structure, configure whether
the panel should be at the top or bottom of the editor.

Next we define a [key binding](##view.KeyBinding) that makes F1 toggle
the field on and off.

!helpKeymap

And tie everything together in the `helpPanel` function, which creates
the extension that enables the field, the key binding, and a simple
styling for the panel.

!helpPanel

<style>.cm-wrap { height: 140px }</style>
<div id=editor></div>
<script defer src="../../codemirror.js"></script>
<script defer src="help-panel.js"></script>

## Dynamic Panel Content

It is often necessary to keep the content of a panel in sync with the
rest of the editor. For this purpose, the [object](##panel.Panel)
returned by a panel constructor may have an
[`update`](##panel.Panel.update) method that, much like the `update`
method in view plugins, gets called every time the editor view
updates.

Here we'll build a little extension that sets up a word-counting panel.

First we need a (very crude, entirely Unicode-unaware) function that
counts the words in a document.

!countWords

Next, a [panel constructor](##panel.PanelConstructor) building a panel
that re-counts the words every time the document changes.

!wordCountPanel

And finally, a function that build the extension that enables the
panel in an editor.

!wordCounter

<div id=count-editor></div>
<script defer src="word-count.js"></script>
