!{"type": "examples", "title": "CodeMirror Right-to-Left Text Example", "injectCode": "./bidi.ts"}

# Example: Right-to-Left Text

To create a basic editor for Arabic or Hebrew text, you only need to
style the editor or some parent document with a `direction: rtl`
property.

<div id=rtl_editor style="direction: rtl"></div>

Of course, in a code editor context, you will often be dealing with a
bunch of Latin syntax or tag names, causing right-to-left text to
become heavily bidirectional. Editing mixed-direction text is, by its
very nature, somewhat messy and confusing, but CodeMirror tries to
make it bearable wherever it can.

Cursor motion (as defined in the [default](##commands.defaultKeymap)
keymaps) is _visual_, meaning that if you press the left arrow your
cursor should move left, regardless of the direction of the text at
the cursor position.

Some other commands work in a _logical_ direction—for example
Backspace deletes _before_ of the cursor, which is to the left in
left-to-right text, and to the right in right-to-left text. Similarly,
Delete deletes text _after_ the cursor.

When you define custom commands that work in a visual way, you should
check the [local text direction](##view.EditorView.textDirectionAt),
and use that to determine which way to go (possibly using the
`forward` argument to something like
[`moveByChar`](##view.EditorView.moveByChar)).

!cursorSemicolonLeft

When writing extensions, take care to not assume a left-to-right
layout. Either set up your CSS to use [direction-aware
properties](https://drafts.csswg.org/css-logical/#position-properties)
or, if that doesn't work, explicitly check the [global editor
direction](##view.EditorView.textDirection) and adjust your behavior
to that.

## Bidi Isolation

A common issue with bidirectional programming or markup text is that
the standard algorithm for laying the text out associates neutral
punctuation characters between two pieces of directional text with the
wrong side. See for example this right-to-left HTML code:

<pre><div style="direction: rtl">النص &lt;span class="blue">الأزرق&lt;/span></div></pre>

Though in the logical text, the `<span class="blue">` appears as a
coherent string, the algorithm will consider the punctuation `">` to
be part of the nearby right-to-left text, because that is the line's
base direction. This results in an unreadable mess.

Thus, it can be useful to add elements with a [`unicode-bidi:
isolate`](https://developer.mozilla.org/en-US/docs/Web/CSS/unicode-bidi#isolate)
style around sections that should be ordered separate from the
surrounding text. This bit of code does that for HTML tags:

!htmlIsolates

This computes a set of [decorations](../decoration/) and keeps it up
to date as the editor state changes. It provides the set to _both_ the
[decoration](##view.EditorView.decorations) and [isolated
range](##view.EditorView.bidiIsolatedRanges) facets—the first makes
sure the editable HTML is rendered appropriately, the second that
CodeMirror's own order computations match the rendered order.

Because styling something as isolated only works if it is rendered as
a single HTML element, we don't want other decorations to break up the
isolating decorations. Because lower-precedence decorations are
rendered around higher-precedence ones, we use
[`Prec.lowest`](##state.Prec.lowest) to give this extension a very low
precedence.

`computeIsolates` uses the syntax tree to compute decorations for HTML
tags in the visible ranges.

!computeIsolates

Here's an editor showing this extension in action. Note that the HTML
tags are shown coherently left-to-right.

<div id=isolate_editor style="direction: rtl"></div>

<script defer src="../../codemirror.js"></script>
<script defer src="bidi.js"></script>
