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
Backspace deletes _before_ the cursor, which is to the left in
left-to-right text, and to the right in right-to-left text. Similarly,
Delete deletes text _after_ the cursor.

When you define custom commands that work in a visual way, you should
check the [local text direction](##view.EditorView.textDirectionAt),
and use that to determine which way to go (possibly using the
`forward` argument to something like
[`moveByChar`](##view.EditorView.moveByChar)).

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
surrounding text. The [`bidiIsolates`](##language.bidiIsolates)
extension does that, based on
[metadata](https://lezer.codemirror.net/docs/ref/#common.NodeProp^isolate)
added to the syntax tree.

Here's an editor has that exention enabled. Note that the HTML tags
are shown coherently left-to-right.

<div id=isolate_editor style="direction: rtl"></div>

If you need to isolate ranges using some other mechanism, you can use
[decorations](../decoration/) to style pieces of code with a
`unicode-bidi: isolate` style (and optionally an explicit
`direction`). But to make the editor's cursor motion aware of these,
you must also use the
[`bidiIsolatedRanges`](##view.EditorView.bidiIsolatedRanges) facet to
tell it that these decorations provide isolates.

<script defer src="../../codemirror.js"></script>
<script defer src="bidi.js"></script>
