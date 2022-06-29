!{"type": "examples", "title": "CodeMirror Mixed-Language Parsing Example", "injectCode": "./mixed.ts"}

# Example: Mixed-Language Parsing

A lot of file formats contain other formats inside them—things like
JavaScript inside HTML `<script>` tags, HTML inside template literals
in that JavaScript, or template languages that wrap processing
instructions around some other language.

The way [Lezer](https://lezer.codemirror.net), and thus CodeMirror,
handle this is by treating the composite language as a combination of
an outer language (which parses the entire document) and one or more
inner languages (which parse only some regions, determined by the
structure of the outer parse tree).

## Hierarchical Nesting

For example, in HTML with CSS and JavaScript, HTML provides the outer
structure, and the content of `<style>` and `<script>` tags in that
structure are given to the CSS and JavaScript parsers. In a template
language, the outer parser would parse the directive syntax, since
that determines the structure of the document, and then the space
between the directives would be given to the target language (often
HTML).

The feature that handles this kind of parsing is
[`parseMixed`](https://lezer.codemirror.net/docs/ref/#common.parseMixed),
which can be
[attached](https://lezer.codemirror.net/docs/ref/#lr.ParserConfig.wrap)
to the outer parser to manage the inner parsing.

Let's pretend the
[@codemirror/lang-html](https://github.com/codemirror/lang-html)
package doesn't already provide mixed-language parsing, and implement
parsing of `<script>` tags ourselves:

!html

The function given to `parseMixed` will be called on the outer tree's
nodes, and determines whether their content should be parsed with a
nested parser. The HTML parser conveniently emits a syntax tree node
`ScriptText` for the content of `<script>` tags, and here we're
telling the mixed parser to parse the content of such nodes using the
JavaScript parser, and
“[mount](https://lezer.codemirror.net/docs/ref/#common.NodeProp^mounted)”
the resulting tree in place of the script text node.

As you can see, the highlighting works for both languages. (Lots of
functionality is missing though, since this code completely bypasses
the things, like folding information and autocompletion, defined in
@codemirror/lang-html and @codemirror/lang-javascript.)

<div id=html-editor></div>

## Overlay Nesting

In the situation above, the nested region neatly matches the structure
of the outer language—the script text is a single node, covering the
content of an HTML tag. In some other mixed-language systems, the
nesting isn't quite so straightforward. For example, in the
[Twig](https://twig.symfony.com/) templating language, the nesting of
the templating directives might not match the nesting of the the HTML
in the template, as in this somewhat odd template:

```
<div>
  {{ content }}
{% if extra_content %}
  <hr></div><div class=extra>{{ extra_content }}
{% endif %}
  <hr>
</div>
```

We could use the template syntax as outer language, parsing that
document like this:

```
Template(
  Text("<div>"),
  Insert("content"),
  Conditional(
    ConditionalOpen("extra_content"),
    Text("<hr></div><div class=extra>"),
    Insert("extra_content"),
    ConditionalClose),
  Text("<hr></div>"))
```

But to parse the HTML text, there's no single node in this tree to
target—it is spread out over multiple nodes, with different parent
nodes.

The way Lezer models nesting like this is with an “overlay” mounted
tree. Instead of replacing a given node, an overlay _overlays_
parts of it with the content from a different tree.

Assuming we have a [grammar](./twig.grammar.txt) for our outer parser,
we could define a mixed parser like this.

!twig

Here we set up mixed parsing for the template's top node, but also
include an `overlay` property in the object returned from the
callback. This can be an array of ranges to parse, or a further
function that is called for each descendent node. The latter is
preferable when the target node might be large, because it allows more
efficient incremental reparsing.

<div id=twig-editor></div>

Note that, since we used the HTML parser from @codemirror/lang-html,
parsing inside `<script>` and `<style>` tags just works in
this editor. Mixed parsers can be nested.

## Support Extensions

CodeMirror's
[`languageDataAt`](../../docs/ref/#state.EditorState.languageDataAt)
feature can be used to look up values associated with the language
active at a given point in the document. If you define things like
autocompletion using this mechanism, it will automatically look up the
proper completion source in a mixed-language document.

!twigCompletion

It is recommended for mixed-language extensions to include any support
extensions for their nested languages—extensions have to be loaded
into an editor to take effect. For example, the editor above doesn't
load the HTML support extensions, and thus doesn't have HTML
autocompletion. Here's a `twig` function that exposes both the
language and the support extensions.

!twigExtension

Loading that into an editor gives you HTML (and JavaScript, and CSS)
completion support.

<div id=twig2-editor></div>

<script defer src="../../codemirror.js"></script>
<script defer src="mixed.js"></script>
