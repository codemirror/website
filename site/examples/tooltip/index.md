!{"type": "examples", "title": "CodeMirror Tooltip Example", "injectCode": ["./tooltip.ts", "./hover.ts"]}

# Example: Tooltips

The [@codemirror/view](##h_tooltips) package provides
functionality for displaying tooltips over the editor—widgets floating
over the content, aligned to some position in that content.

In keeping with the style of the rest of the interface, tooltips are
not added and removed to an editor through side effects, but instead
controlled by the content of a [facet](##view.showTooltip). This
does make them slightly involved to set up, but by directly tying the
tooltips to the state they reflect we avoid a whole class of potential
synchronization problems.

## Cursor Position

This first example implements a tooltip that displays a row:column
position above the cursor.

<div id=editor></div>
<script defer src="../../codemirror.js"></script>
<script defer src="tooltip.js"></script>

Dynamic facet values need to be rooted somewhere—usually in a state
field. The field below holds the set of tooltips, basing them on the
current selection state. We'll only show tooltips for cursors (not
range selections), but there can be multiple cursors, so the tooltips
are kept in an array.

!cursorTooltipField

The [`provide`](##state.StateField^define^config.provide) option, used
with [`computeN`](##state.Facet.computeN), is the way to provide
multiple facet inputs from a state field.

Often the field that manages your tooltips will be a bit less
trivial. For example, the autocompletion extension tracks the active
completion state in a field, and provides zero or one tooltips (the
completion widget) from that.

The helper function used by that state field looks like this:

!getCursorTooltips

Tooltips are represented as [objects](##view.Tooltip) that provide
the position of the tooltip, its orientation relative to that position
(we want our tooltips above the cursor,
[even](##view.Tooltip.strictSide) when there's no room in the
viewport), whether to show a triangle-arrow on the tooltip, and a
function that draws it.

This [`create`](##view.Tooltip.create) function handles the
DOM-related and imperative part of the tooltip. Its [return
value](##view.TooltipView) can also define functions that should be
called when the tooltip is added to the DOM or the view state updates.

Active tooltips are displayed as fixed-position elements. We add some
padding and a border radius to ours, and set the background on both
the element and the arrow to purple. The `:after` element produces a
pseudo-border for the arrow, which we don't want here, so we make it
transparent.

!baseTheme

And finally we can define a function that returns the extensions
needed to enable this feature: the field and the base theme.

!cursorTooltip

## Hover Tooltips

The tooltip package also exports a helper function
[`hoverTooltip`](##view.hoverTooltip), which can be used to define
tooltips that show up when the user hovers over the document. This
demo will show tooltips with the word you're hovering over.

<div id=hover-editor></div>
<script defer src="hover.js"></script>

When defining a hover tooltip, you provide a function that will be
called when the pointer pauses over the editor. It gets the position
near the pointer and the side of that position the pointer is on, and
can optionally return a tooltip that should be displayed.

!hoverTooltip

The function crudely determines the word boundaries around the given
position and, if the pointer is inside that word, returns a tooltip
with the word. The `end` field is used to determine the range that the
pointer can move over without closing the tooltip. This can be useful
when the tooltip contains controls that the user can interact with—the
tooltip shouldn't close when the pointer is moving towards such
controls.
