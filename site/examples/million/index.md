!{"type": "examples", "title": "CodeMirror Huge Doc Demo"}

# Example: Huge Document

This page loads a document of a few million lines, to demonstrate how
CodeMirror performs on documents that size.

You'll notice that highlighting stops at some point if you scroll down
far enough. The parser contains logic that limits the amount of work
it does to avoid wasting too much battery and memory. If the editor is
inactive, it'll stop doing work entirely. Otherwise, it should
eventually get to your scroll position.

<style>.cm-wrap { height: 400px }</style>

<div id=editor></div>
<script defer src="../../codemirror.js"></script>
<script defer src="million.js"></script>
