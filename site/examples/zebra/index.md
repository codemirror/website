!{"type": "examples", "title": "CodeMirror Zebra Stipes Example", "injectCode": "./zebra.ts"}

# Example: Zebra Stripes

This example defines an extension that styles every Nth line with a
background.

To style the stripes in a way that allows
[themes](##view.EditorView^theme) to override them, we start by
defining a [base theme](##view.EditorView^baseTheme). It styles the
`cm-zebraStripe` class, with different backgrounds for light and dark
base themes.

!baseTheme

Next, as an excuse for including configuration functionality, we'll
allow the caller to configure the distance between the stripes. To
store the configured distance in a way that is well-defined even if
multiple instances of the extension are added, we'll store it in a
[facet](##state.Facet).

The facet takes any number of step values (input type `number`, the
first type parameter), and takes their minimum, or 2 if no values were
provided, as its value (output type, the second type parameter, also
`number`).

!facet

We'll export a single function, which returns the
[extension](##state.Extension) that installs the zebra stripe
functionality.

Note that extension values can be individual extensions (such as facet
values, created with the [`of` method](##state.Facet.of)), or arrays,
possibly nested, of extensions. Thus they can be easily composed into
bigger extensions.

In this case, the function returns our base theme, a value for the
`stepSize` facet, if a configuration was provided, and `showStripes`,
the [view plugin](##view.ViewPlugin) that actually adds the styling,
which we'll define in a moment.

!constructor

First, this helper function, given a view, iterates over the visible
lines, creating a [line decoration](##view.Decoration^line) for every
Nth line.

The plugin will simply recompute its decorations every time something
changes. Using a [builder](##state.RangeSetBuilder), this is not
very expensive. In other cases, it can be preferable to preserve
decorations ([mapping](##state.RangeSet.map) them through document
changes) across updates.

Note that, because facets are always available on every state, whether
they have been added to that state or not, we can simply
[read](##state.EditorState.facet) the value of `stepSize` to get the
appropriate step size. When no one configured it, it'll have the value
`2` (the result of calling its `combine` function with the empty
array).

!stripeDeco

The `showStripes` [view plugin](##view.ViewPlugin), then, only has to
advertise that it provides decorations (the `decorations` option),
and make sure its `decorations` property is recomputed when the
document or the [viewport](##view.EditorView.viewport) changes.

!showStripes

The result looks like this:

<div id=editor></div>
<script defer src="../../codemirror.js"></script>
<script defer src="zebra.js"></script>
