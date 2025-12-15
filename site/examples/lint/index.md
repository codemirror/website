!{"type": "examples", "title": "CodeMirror Lint Example", "injectCode": "./lint.ts"}

# Example: Linter

The [@codemirror/lint](../../docs/ref/#lint) package provides a way to
display errors and warnings in your editor. If you give it a
[source](../../docs/ref/##lint.LintSource) function that, when given
an editor, produces an array of problems, it will call this function
when changes are made to the document, and display its result.

The library does *not* come with a collection of lint sources. Some
language packages (such as
[@codemirror/lang-javascript](https://github.com/codemirror/lang-javascript/#user-content-eslint))
may include integration with lint libraries, but usually setting up a
source is something you have to do yourself.

There's two ways to do this:

 - Find a linter that you can run in the browser, run it on the
   content, and translate its output into the [expected
   format](../../docs/ref/#lint.Diagnostic).

 - Write one from scratch, possibly using the syntax tree kept by the
   editor.

In this example, we'll do the latter.

Assume for a second that the boss has decided that regular expressions
are the work of the devil (to be fair, he's not entirely wrong), and
should be forbidden in the entire codebase. We want a linter that
highlights any use of a regular expression in JavaScript code.

Conveniently, the [JavaScript
parser](https://github.com/lezer-parser/javascript) emits a specific
node type for regular expression literals, so all we have to do is
iterate over the parse tree and emit a warning for every node like
that we find.

!regexpLint

[Diagnostics](../../docs/ref/#lint.Diagnostic) (the objects returned
by a lint source) must have `from` and `to` properties indicating the
range they apply to, a
[severity](../../docs/ref/#lint.Diagnostic.severity) field, and a
message.

This one also uses the optional
[`actions`](../../docs/ref/#lint.Diagnostic.actions) field to add an
“action” for the diagnostic. This adds a button to the diagnostic that
can be clicked to perform some effect, like automatically fixing the
problem (which this does in a very crude way) or providing further
context.

The result of a call to [`linter`](../../docs/ref/#lint.linter) is
an extension that you can include in a (JavaScript) editor to get a
result like this ([sandbox link](!!lint.ts)):

<div id=editor></div>

The gutter only appears if you also include
[`lintGutter`](../../docs/ref/#lint.lintGutter). You can press
Ctrl-Shift-m (Cmd-Shift-m on macOS) to show a list of diagnostics in a
panel below the editor.

<script defer src="../../codemirror.js"></script>
<script defer src="lint.js"></script>
