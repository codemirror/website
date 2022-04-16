!{"type": "examples", "title": "CodeMirror Gutter Example", "injectCode": "./gutters.ts"}

# Example: Gutters

The [view module](##h_gutters) provides functionality for adding
_gutters_ (vertical bars in front of the code) to your editor. The
simplest use of gutters is to simply dump
[`lineNumbers()`](##view.lineNumbers) into your configuration to
get a line number gutter. But the module also helps when you want to
define your own gutters and show custom controls in them.

## Adding a Gutter

Conceptually, the editor displays a collection of gutters next to each
other, each of which has its own style and content (though you'll
often want to keep their default style so that they blend in with the
others, looking like a single big gutter). For each line, each gutter
may display something. The line number gutter will show a line
number—obviously.

To add a gutter, call the [`gutter`](##view.gutter) function and
include the result in your state configuration. The position of this
extension relative to other gutter extensions determines the ordering
of the gutters. So this, for example, will put our gutter after the
line numbers:

```
extensions: [lineNumbers(), gutter({class: "cm-mygutter"})]
```

Unless the `cm-mygutter` CSS class sets some minimum width, you won't
see such a gutter though—it'll just be an empty element (in a CSS
flexbox), which the browser will collapse.

To put content into the gutter, we can use either the
[`lineMarker`](##view.gutter^config.lineMarker) option, which will be
called for each visible line to determine what to show there, or the
[`markers`](##view.gutter^config.markers) option, which allows you to
build a persistent set of markers (using the same [range
set](##state.RangeSet) data structure used in
[decorations](../decoration/)) to show in your gutter.

As with [decorations](##view.WidgetType), gutter markers are
represented by lightweight immutable values that know how to render
themselves to DOM nodes, in order to allow updates to be represented
in a declarative way without recreating a lot of DOM nodes on every
transaction. Gutter markers can also [add a CSS
class](##view.GutterMarker.elementClass) to a gutter element.

This code defines two gutters, one that shows an ø sign on every empty
line, and one that allows you to toggle a 'breakpoint' marker per line
by clicking on that gutter. The first is easy:

!emptyLineGutter

(The `new class` construct creates an anonymous class and then
initializes a single instance of it. Since there's only one type of
empty-line marker, we use this to get our `GutterMarker` instance.)

To avoid the problem with empty gutters not showing up at all, gutters
allow you to [configure](##view.gutter^config.initialSpacer) a
'spacer' element that is rendered invisibly in the gutter to set its
minimal width. This is often easier than setting an explicit with with
CSS and making sure it covers the expected content.

The `lineMarker` option checks if the line is zero-length, and if so,
returns our marker.

The breakpoint gutter is a bit more involved. It needs to track state
(the position of the breakpoints), for which we use a [state
field](##state.StateField), with a [state effect](##state.StateEffect)
that can update it.

!breakpointState

The state starts empty, and when a transaction happens, it
[maps](##state.ChangeDesc.mapPos) the positions of the breakpoints
through the changes (if any), and looks for effects that add or remove
breakpoints, adjusting the set of breakpoints as appropriate.

The `breakpointGutter` extension combines this state field with a
gutter and a bit of styling for that gutter.

!breakpointGutter

The [`domEventHandlers`](##view.gutter^config.domEventHandlers)
option allows you to specify event handlers for this gutter, which we
use to set up a mousedown handler to toggle the breakpoint for the
line that was clicked.

This is what an editor with the breakpoint gutter before the line
numbers and the empty line gutter after it looks like:

<div id="editor"></div>
<script defer src="../../codemirror.js"></script>
<script defer src="gutters.js"></script>

## Customizing the Line Number Gutter

The [`lineNumbers`](##view.lineNumbers) function also takes
configuration parameters, allowing you to add [event
handlers](##view.lineNumbers^config.domEventHandlers) or customize
the way line numbers are
[displayed](##view.lineNumbers^config.formatNumber).

```
const hexLineNumbers = lineNumbers({
  formatNumber: n => n.toString(16)
})
```

It is also possible to add markers to the line number gutter, which
replace the line numbers for affected lines. This is done through the
[`lineNumberMarkers`](##view.lineNumberMarkers) facet, which works a
lot like `markers` on custom gutters, but can be provided by any
extension, rather than being configured directly for a single gutter.
