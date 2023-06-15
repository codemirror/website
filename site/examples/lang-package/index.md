!{"type": "examples", "title": "CodeMirror Language Package Example", "injectCode": "./lang-package.js"}

# Example: Writing a Language Package

Language support in CodeMirror takes the form of specific packages
(with names like `@codemirror/lang-python` or
`codemirror-lang-elixir`) that implement the support features for
working with that language. Those may be...

 * A parser for the language.

 * Additional syntax-related metadata, such as highlighting,
   indentation, and folding information.

 * Optionally various language-specific extensions and commands, such
   as autocompletion support or language-specific keybindings.

In this example, we'll go through implementing a language package for
a very minimal Lisp-like language. A similar project, with build tool
configuration and such set up for you, is available as an example Git
repository at
[codemirror/lang-example](https://github.com/codemirror/lang-example).
It may be useful to start from that when building your own package.

## Parsing

The first thing we'll need is a parser, which is used for
[highlighting](##language.HighlightStyle) but also provides the
structure for things like [syntax-aware
selection](##commands.selectParentSyntax),
[auto-indentation](##commands.insertNewlineAndIndent), and [code
folding](##h_folding). There are several ways to implement a parser
for CodeMirror.

 * Using a [Lezer](https://lezer.codemirror.net) grammar. This is a
   parser generator system that converts a declarative description of
   a grammar into an efficient parser. It's what we'll be using in
   this example.

 * Using a CodeMirror 5-style [stream
   parser](##language.StreamParser), which is mostly just a tokenizer.
   This can be easier for very basic highlighting, but doesn't produce
   a structured syntax tree, and quickly breaks down when you need
   more than tokenizing, for example to distinguish type names from
   variable names.

 * Writing a completely custom parser. This can be the only recourse
   for some awkward languages like
   [Markdown](https://github.com/codemirror/lang-markdown), but tends
   to be quite a lot of work.

Generally, it won't be feasible to use existing parsers, written for a
different purpose, to parse editor content. The way the editor parses
code needs to be incremental, so that it can quickly update its parse
when the document changes, without re-parsing the entire text. It also
needs to be error-tolerant, so that highlighting doesn't break when
you have a syntax error somewhere in your file. And finally, it is
practical when it produces a syntax tree in a
[format](https://lezer.codemirror.net/docs/ref/#common.Tree) that the
highlighter can consume. Very few existing parsers can easily be
integrated in such a context.

If your language defines a formal [context-free
grammar](https://en.wikipedia.org/wiki/Context-free_language), you may
be able to base a Lezer grammar on that with relative ease—depending
on how much dodgy tricks the language uses. Almost all languages do
some things that don't fit the context-free formalism, but Lezer has
some mechanisms to deal with that.

The Lezer
[guide](https://lezer.codemirror.net/docs/guide/#writing-a-grammar)
provides a more complete explanation of how to write a grammar. But
roughly, the way it works is that you declare a number of tokens,
which describe the way the document is split into meaningful pieces
(identifiers, strings, comments, braces, and so on), and then provide
rules that describe bigger constructs in term of those tokens and
other rules.

The notation borrows from extended Backus-Naur notation and regular
expression syntax, using `|` to indicate a choice between several
forms, `*` and `+` for repetition, and `?` for optional elements.

The grammar should be put in its own file, typically with a `.grammar`
extension, and ran through
[lezer-generator](https://lezer.codemirror.net/docs/guide/#building-a-grammar)
to create a JavaScript file.

To learn how to write a Lezer grammar, see the
[examples](https://lezer.codemirror.net/examples/) on the project
website.

If your grammar lives in `example.grammar`, you can run
`lezer-generator example.grammar` to create a JavaScript module
holding the parse tables. Or, as the [example
repository](https://github.com/codemirror/lang-example) does, include
the [Rollup](https://rollupjs.org/) plugin provided by that tool in
your build process, so that you can directly import the parser from
the grammar file.

## CodeMirror integration

Lezer is a generic parser tool, and our grammar so far doesn't know
anything about highlighting or other editor-related functionality.

A Lezer parser comes with a number of [node
types](https://lezer.codemirror.net/docs/ref/#common.NodeType), each of
which can have
[props](https://lezer.codemirror.net/docs/ref/#common.NodeProp) with
extra metadata added to them. We'll create an extended copy of the
parser to include node-specific information for highlighting,
indentation, and folding.

!parser

[`styleTags`](https://lezer.codemirror.net/docs/ref/#highlight.styleTags)
is a helper that attaches highlighting information. We give it an
object mapping node names (or space-separated lists of node names) to
[highlighting
tags](https://lezer.codemirror.net/docs/ref/#highlight.tags). These
tags describe the syntactic role of the elements, and are used by
[highlighters](##language.HighlightStyle) to style the text.

The information added by `@detectDelim` would already allow the
automatic indentation to do a reasonable job, but because Lisps tend
to indent continued lists one unit beyond the start of the list, and
the default behavior is similar to how you'd indent parenthesized
things in C or JavaScript, we'll have to override it.

The [`indentNodeProp`](##language.indentNodeProp) prop associates
functions that compute an indentation with node types. The function is
passed a [context object](##language.TreeIndentContext) holding the
relevant values and some indentation-related helper methods. In this
case, the function computes the column position at the start of the
application node and adds one [indent unit](##language.indentUnit) to
that. The [language package](##language) exports a number of helpers
to easily implement common indentation styles.

Finally, [`foldNodeProp`](##language.foldNodeProp) associates folding
information with node types. We allow application nodes to be folded
by hiding everything but their delimiters.

That gives us a parser with enough editor-specific information encoded
in its output to use it for editing. Next we wrap that in a
[`Language`](##language.Language) instance, which wraps a parser and
adds a language-specific [facet](##state.Facet) that can be used by
external code to register language-specific metadata.

!language

That code provides one piece of metadata (line comment syntax) right
away, and allows us to do something like this to add additional
information, such as the an [autocompletion
source](##autocomplete.CompletionSource) for this language.

!completion

Finally, it is convention for language packages to export a main
function (named after the language, so it's called `css` in
`@codemirror/lang-css` for example) that takes a configuration object
(if the language has anything to configure) and returns a
[`LanguageSupport`](##language.LanguageSupport) object, which bundles
a `Language` instance with any additional supporting extensions that
one might want to enable for the language.

!support

The result looks like this:

<div id=editor></div>
<script defer src="../../codemirror.js"></script>
<script defer src="index.js"></script>
