!{"type": "examples", "title": "CodeMirror Decoration Example", "injectCode": ["./underline.ts", "./checkbox.ts", "./placeholder.ts"]}

# Example: Decorations

The DOM structure inside a CodeMirror editor is managed by the editor
itself. Inside the `cm-content` element, any attempt to add attributes
or change the structure of nodes will usually just lead to the editor
immediately resetting the content back to what it used to be.

So to style content, replace content, or add additional elements in
between the content, we have to tell the editor to do so. That is what
[decorations](##view.Decoration) are for.

## Types of Decorations

There are four different types of decorations that you can add to your
content.

 - [Mark decorations](##view.Decoration^mark) are the most common.
   These add some attributes or wrapping DOM element to pieces of
   content. Syntax highlighting, for example, is done with mark
   decorations.

 - [Widget decorations](##view.Decoration^widget) insert a DOM element
   in the editor content. You could use this to, for example, add a
   color picker widget next to a color code. Widgets can be inline
   elements or [blocks](##view.Decoration^widget^spec.block).

 - [Replacing decorations](##view.Decoration^replace) _hide_ a stretch
   of content. This is useful for code folding or replacing an element
   in the text with something else. It is possible to display a
   [widget](##view.Decoration^replace^spec.widget) instead of the
   replaced text.

 - [Line decorations](##view.Decoration^line), when positioned at the
   start of a line, can influence the attributes of the DOM element
   that wraps the line.

Calling these functions gives you a `Decoration` object, which just
describes the type of decoration and which you can often reuse between
instances of decorations. The [`range`](##state.RangeValue.range)
method on these objects gives you an actual decorated range, which
holds both the type and a pair of `from`/`to` document offsets.

## Decoration Sources

Decorations are provided to the editor using the
[`RangeSet`](##state.RangeSet) data structure, which stores a
collection of values (in this case the decorations) with ranges (start
and end positions) associated with them. This data structure helps
with things like efficiently updating the positions in a big set of
decorations when the document changes.

Decorations are provided to the editor view through a
[facet](##view.EditorView^decorations). There are two ways to provide
them—directly, or though a function that will be called with a view
instance to produce a set of decorations. Decorations that
signficantly change the vertical layout of the editor, for example by
replacing line breaks or inserting block widgets, must be provided
directly, since indirect decorations are only retrieved after the
viewport has been computed.

Indirect decorations are appropriate for things like syntax
highlighting or search match highlighting, where you might want to
just render the decorations inside the
[viewport](##view.EditorView.viewport) or the current [visible
ranges](##view.EditorView.visibleRanges), which can help a lot with
performance.

Let's start with an example that keeps decorations in the state, and
provides them directly.

## Underlining Command

Say we want to implement an editor extension that allows the user to
underline parts of the document. To do this, we could define a [state
field](##state.StateField) that tracks which parts of the document are
underlined, and provides [mark decoration](##view.Decoration^mark)
that draw those underlines.

To keep the code simple, the field stores only the decoration range
set. It doesn't do things like joining overlapping underlines, but
just dumps any newly underlined region into its set of ranges.

!underlineState

Note that the `update` method starts by
[mapping](##state.RangeSet.map) its ranges through the
transaction's changes. The old set refers to positions in the old
document, and the new state must get a set with positions in the new
document, so unless you completely recompute your decoration set,
you'll generally want to map it though document changes.

Then it checks if the [effect](##state.StateEffect) we defined for
adding underlines is present in the transaction, and if so, extends
the decoration set with more ranges.

Next we define a command that, if any text is selected, adds an
underline to it. We'll just make it automatically enable the state
field (and a [base theme](##view.EditorView^baseTheme)) on demand, so
that no further configuration is necessary.

!underlineSelection

And finally, this keymap binds that command to Ctrl-h (Cmd-h on
macOS). The `preventDefault` field is there because even when the
command doesn't apply, we don't want the browser's default behavior to
happen.

!underlineKeymap

This code is also available [in the sandbox](!!underline.ts).

<div id="editor-underline"></div>
<script defer src="../../codemirror.js"></script>
<script defer src="underline.js"></script>

## Boolean Toggle Widgets

Next, we'll look at a plugin that displays a checkbox widget next to
boolean literals, and allows the user to click that to flip the
literal.

Widget decorations don't directly contain their widget DOM. Apart from
helping keep mutable objects out of the editor state, this additional
level of indirection also makes it possible to recreate widgets
without redrawing the DOM for them. We'll use that later by simply
recreating our decoration set whenever the document changes.

Thus, we must first define a subclass of
[`WidgetType`](##view.WidgetType) that draws the widget.

!CheckboxWidget

Decorations contain instances of this class (which are cheap to
create). When the view updates itself, if it finds it already has a
drawn instance of such a widget in the position where the widget
occurs (using the `eq` method to determine equivalence), it will
simply reuse that.

It is also possible to optimize updating of DOM structure for widgets
of the same type but with different content by defining an
[`updateDOM`](##view.WidgetType.updateDOM) method. But that doesn't
help much here.

The produced DOM wraps the checkbox in a `<span>` element, mostly
because Firefox handles checkboxes with `contenteditable=false` poorly
(running into browser quirks is common around the edges of
contenteditable). We'll also tell screen readers to ignore it since
the feature doesn't really work without a pointing device anyway.

Finally, the widget's `ignoreEvents` method tells the editor to not
ignore events that happen in the widget. This is necessary to allow an
editor-wide event handler (defined later) to handle interaction with
it.

Next, this function uses the editor's [syntax
tree](##language.syntaxTree) (assuming the JavaScript language is
enabled) to locate boolean literals in the visible parts of the editor
and create widgets for them.

!checkboxes

That function is used by a [view plugin](##view.ViewPlugin) that keeps
an up-to-date decoration set as the document or viewport changes.

!checkboxPlugin

The options given to the plugin tell the editor that, firstly, it can
[get](##view.PluginSpec.decorations) decorations from this plugin, and
secondly, that as long as the plugin is active, the given `mousedown`
handler should be registered. The handler checks the event target to
recognize clicks on checkboxes, and uses the following helper to
actually toggle booleans.

!toggleBoolean

After adding the plugin as an extension to a (JavaScript) editor, you
get something like this ([sandbox of this code](!!checkbox.ts)):

<div id="editor-checkbox"></div>
<script defer src="checkbox.js"></script>

To see an example of line decorations, check out the [zebra stripe
example](../zebra/).

## Atomic Ranges

In some cases, such as with most replacing decorations larger than a
single character, you want editing actions to treat the ranges as
atomic elements, skipping over them during cursor motion, and
backspacing them out in one step.

The [`EditorView.atomicRanges`](##view.EditorView^atomicRanges) facet
can be provided range sets (usually the same set that we're using for
the decorations) and will make sure cursor motion skips the ranges in
that set.

Let's implement an extension that replaces placeholder names like
`[[this]]` with widgets, and makes the editor treat them as atoms.

[`MatchDecorator`](##view.MatchDecorator) is a helper class that can
be used to quickly set up view plugins that decorate all matches of a
given regular expression in the viewport.

!placeholderMatcher

(`PlaceholderWidget` is a straightforward subclass of
[`WidgetType`](##view.WidgetType) that renders the given name in a
styled element.)

We'll use the matcher to create and maintain the decorations in our
plugin. It also [provides](##view.PluginSpec.provide) the decoration
set as atomic ranges. ([Sandbox link](!!placeholder.ts)).

!placeholderPlugin

<div id="editor-placeholder"></div>
<script defer src="placeholder.js"></script>

It is possible to implement something like that in a custom way with
[transaction filters](##state.EditorState^transactionFilter), if you
need