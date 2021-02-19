!{"type": "examples", "title": "CodeMirror Language Package Example", "injectCode": "./lang-package.js"}

# Example: Writing a Language Package

Language support in CodeMirror takes the form of specific packages
(with names like `@codemirror/lang-python`) that implement the support
features for working with that language. Those may be...

 * A parser for the language.

 * Additional syntax-related metadata, such as highlighting,
   indentation, and folding information.

 * Optionally various language-specific extensions and commands, such
   as autocompletion support or language-specific keybindings.

In this example, we'll go through implementing a language package for
a very minimal Lisp-like language. A similar project, with build tool
configuration and such set up for you, is available as an example Git
repository at [FIXME]. It may be useful to start from that when
building your own package.

## Parsing

There are several ways to implement a parser for CodeMirror.

 * Using a [Lezer](https://lezer.codemirror.net) grammar. This is a
   parser generator system that converts a declarative description of
   a grammar into an efficient parser. It's what we'll be using in
   this example.

 * Using a CodeMirror 5-style [stream parser](##stream-parser), which
   is mostly just a tokenizer. This can be easier for very basic
   highlighting, but doesn't produce a structured syntax tree, and
   quickly breaks down when you need more than tokenizing, for example
   to distinguish type names from variable names.

 * Writing a completely custom parser. This can be the only recourse
   for some awkward languages like
   [Markdown](https://github.com/codemirror/lang-markdown), but tends
   to be quite a lot of work.

You can generally not use existing parsers, written for a different
purpose, to parse editor content. The way the editor parses code needs
to be incremental, so that it can quickly update its parse when the
document changes, without re-parsing the entire text. It also needs to
be error-tolerant, so that highlighting doesn't break when you have a
syntax error somewhere in your file. And finally, it is practical when
it produces a syntax tree in a
[format](https://lezer.codemirror.net/docs/ref/#tree) that the
highlighter can consume. Very few parsers can easily be integrated to
work like.

If your language defines a formal [context-free
grammar](https://en.wikipedia.org/wiki/Context-free_language), you may
be able to base a Lezer grammar on that with relative ease (depending
on how much dodgy tricks the language uses—they almost always do
something that doesn't fit the context-free formalism, but Lezer has
some mechanisms to deal with that).

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

This first rule means that a document should be parsed as any number
of `expression`s, and the top node should be called `Program`.

```null
@top Program { expression* }
```

The next rule is a bit more involved. It declares that an expression
can either be an identifier, a string, a boolean literal, or an
application, which is any number of expressions wrapped in
parentheses. The choice for `Application` uses an _inline rule_ to
combine the definition of the rule with its only use.

```null
expression {
  Identifier |
  String |
  Boolean |
  Application { "(" expression* ")" }
}
```

Rule names that start with a capital letter will end up in the syntax
tree produced by the parser. Other rules, such as `expression`, which
are only there to structure the grammar, will be left out (to keep the
tree small and clean).

Next, we define our tokens.

```null
@tokens {
  LineComment { ";" ![\n]* }

  Identifier { $[a-zA-Z_0-9]+ }

  String { '"' (!["\\] | "\\" _)* '"' }

  Boolean { "#t" | "#f" }

  space { $[ \t\n\r]+ }

  "(" ")"
}
```

These use a syntax similar to the rule definitions, but can only
express a _regular_ language, which roughly mean they can't be
recursive. Quoted literals match exactly the text in the quotes, sets
of characters can be specified with `$[]` syntax, and `![]` is used to
match all characters _except_ the ones between the brackets.

By default, tokens implicitly created by using literal strings in the
(non-token) grammar won't be part of the syntax tree. By mentioning
such tokens (like `"("` and `")"`) explicitly in the `@tokens` block,
we indicate that they should be included.

Skippable tokens, like space and comments, are declared in the same
way as other tokens, and declared as skippable with a declaration like
this.

```null
@skip { space | LineComment }
```

And finally, the parser generator can be asked to automatically infer
matching delimiters with a `@detectDelim` directive. This will cause
it to add
[metadata](https://lezer.codemirror.net/docs/ref/#tree.NodeProp^closedBy)
to those node types, which the editor can use for things like bracket
matching and automatic indentation.

```null
@detectDelim
```

If that grammar lives in `example.grammar`, you can run
`lezer-generator example.grammar` to create a JavaScript module
holding the parse tables.

## CodeMirror integration

Lezer is a generic parser tool, and our grammar so far doesn't know
anything about highlighting or other editor-related functionality.

A Lezer parser comes with a number of [node
types](https://lezer.codemirror.net/docs/ref/#tree.NodeType), each of
which can have
[props](https://lezer.codemirror.net/docs/ref/#tree.NodeProp) with
extra metadata added to them. We'll store node-specific information
for highlighting, indentation, and folding, by creating a copy of the
parser which has additional node props inected.

!parser

[`styleTags`](##highlight.styleTags) is a helper that attaches
highlighting information. We give it an object mapping node names (or
space-separated lists of node names) to [highlighting
tags](##highlight.tags).

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
that.

Finally, [`foldNodeProp`](##language.foldNodeProp) associates folding
information with node types. We allow application nodes to be folded
by hiding everything but their delimiters.

That gives us a parser with enough editor-specific information encoded
in its output to use it for editing. Next we wrap that in a
[`Language`](##language.Language) instance, which wraps a parser and
adds a language-specific [facet](##state.Facet) that can be used by
external code to attach additional language-wide metadata.

!language

That code provides one piece of metadata (line comment syntax) right
away, and allows us to do something like this to add additional
information, such as the an [autocompletion
source](##autocomplete.CompletionSource) for this language.

!completion

Finally, it is convention for language packages to export a main
function (named after the language, so it's called `css` in
`@codemrirror/lang-css` for example) that takes a configuration object
(if the language has anything to configure) and returns a
[`LanguageSupport`](##language.LanguageSupport) object, which bundles
a `Language` instance with any additional supporting extensions that
one might want to enable for the language.

!support

The result looks like this:

<div id=editor></div>
<script defer src="../../codemirror.js"></script>
<script defer src="index.js"></script>
