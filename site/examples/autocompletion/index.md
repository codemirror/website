!{"type": "examples", "title": "CodeMirror Autocompletion Example", "injectCode": ["./autocompletion.ts", "./jsdoc.ts"]}

# Example: Autocompletion

The [@codemirror/autocomplete](##autocomplete) package provides
functionality for displaying input suggestions in the editor. This
example shows how to enable it and how to write your own completion
sources.

## Setting Up

Autocompletion is enabled by including the
[`autocompletion`](##autocomplete.autocompletion) extension (which is
included in the basic setup) in your configuration. Some language
packages come with support for proper autocompletion built in, such as
the [HTML package](https://github.com/codemirror/lang-html/).

<div id="editor-html"></div>

By default, the plugin will look for completions whenever the user
types something, but you can
[configure](##autocomplete.autocompletion^config.activateOnTyping) it
to only run when activated explicitly via a
[command](##autocomplete.startCompletion).

The default [completion keymap](##autocomplete.completionKeymap) binds
Ctrl-Space to start completion, arrows to select a completion, Enter
to pick it, and Escape to close the tooltip. It is activated by
default when you add the extension, but you can
[disable](##autocomplete.autocompletion^config.defaultKeymap) that if
you want to provide your own bindings.

The default bindings do _not_ bind Tab to
[`acceptCompletion`](##autocomplete.acceptCompletion), for reasons
outlined in [the Tab-handling example](../tab/).

## Providing Completions

The completions that the extension shows come from one or more
[completion sources](##autocomplete.CompletionSource), which are
functions that take a [completion
context](##autocomplete.CompletionContext)—an object with information
about the completion being requested—and return an
[object](##autocomplete.CompletionResult) that describes the range
that's being completed and the [options](##autocomplete.Completion) to
show. Sources may run asynchronously by returning a promise.

The easiest way to connect a completion source to an editor is to use
the [`override`
option](##autocomplete.autocompletion^config.override).

<div id="editor-override"></div>

This editor uses the following completion function:

!override

This is a very crude way to provide completions, without really
looking at the editing context at all. But it demonstrates the basic
things a completion function must do.

 - Figure out which bit of text before the cursor could be completed.
   Here we use the
   [`matchBefore`](##autocomplete.CompletionContext.matchBefore)
   method to determine it with a regular expression.

 - Check whether completion is appropriate at all. The
   [`explicit`](##autocomplete.CompletionContext.explicit) flag
   indicates whether the completion was started explicitly, via the
   [command](##autocomplete.startCompletion), or implicitly, by
   typing. You should generally only return results when the
   completion happens explicitly or the completion position is after
   some construct that can be completed.

 - Build up a list of completions and return it, along with its start
   position. (The end position defaults to the position where
   completion happens.)

[Completions](##autocomplete.Completion) themselves are objects with a
`label` property, which provides both the text to show in the options
list and the text to insert when the completion is picked.

By default, the completion list shows only the label. You'll usually
also want to provide a [`type`
property](##autocomplete.Completion.type), which determines the icon
shown next to the completion.
[`detail`](##autocomplete.Completion.detail) can be given to show a
short string after the label, and
[`info`](##autocomplete.Completion.info) can be used for longer text,
shown in a window to the side of the list when the completion is
selected.

To override what happens when a completion is picked, you can use the
[`apply`](##autocomplete.Completion.apply) property, which can be
either a string to replace the completion range with, or a function
that will be called to apply an arbitrary action.

When you are providing your completion source as a generic extension,
or working with mixed-language documents, setting a global source is
not practical. When no override is given, the plugin uses
[`EditorState.languageDataAt`](##state.EditorState.languageDataAt)
with the name `"autocomplete"` to look up language-appropriate
completion functions. Registering those is done with a
[language](##language.Language) object's
[`data`](##language.Language.data) facet. For example by including
something like this in your state configuration:

```
myLanguage.data.of({
  autocomplete: myCompletions
})
```

You can also directly put an array of [completion
objects](##autocomplete.Completion) in this property, which will cause
the library to simply use those (wrapped by
[`completeFromList`](##autocomplete.completeFromList)) as a source.

## Sorting and Filtering

The trivial completion source used above didn't have to filter
completions against the input—the plugin will take care of that. It
uses a form of fuzzy matching to filter and rank completions against
the currently typed text, and will highlight the letters in each
completion that match.

To influence the ranking of completions, you can give completion
objects a [`boost`](##autocomplete.Completion.boost) property, which
adds to or subtracts from their match score.

If you really do want to filter and order completions yourself, you
can include a [`filter:
false`](##autocomplete.CompletionResult.filter) property in your
result object to disable the built-in filtering.

## Completion Result Validity

Some sources need to recompute their results on every keypress, but
for many of them, this is unnecessary and inefficient. They return a
full list of completions for a given construct, and as long as the
user is typing (or backspacing) inside that construct, that same list
can be used (filtered for the currently typed input) to populate the
completion list.

This is why it is very much recommended to provide a
[`validFor`](##autocomplete.CompletionResult.validFor) property on
your completion result. It should contain a function or regular
expression that tells the extension that, as long as the updated input
(the range between the result's `from` property and the completion
point) matches that value, it can continue to use the list of
completions.

In the `myCompletions` function above, since all its completions are
simple words, a value like `validFor: /^\w*$/` would be appropriate.

## Completing from Syntax

To make a completion source a bit more intelligent, it is often useful
to inspect the [syntax tree](##language.syntaxTree) around the
completion point, and use that to get a better picture of what kind of
construct is being completed.

As an example, this completion source for JavaScript will complete
(some) [JSDoc](https://jsdoc.app/) tags in block comments.

!completeJSDoc

The function starts by
[finding](https://lezer.codemirror.net/docs/ref/#common.Tree.resolveInner)
the syntax node directly in front of the completion position. If that
is not a block comment, or it is a block comment without a `/**` start
marker, it returns null to indicate it has no completions.

If the completion _does_ happen in a block comment, we check whether
there is an existing tag in front of it. If there is, that is included
in the completion (see the `from` property in the returned object). If
there isn't, we only complete if the completion was explicitly
started.

You can now use an extension like this to enable this completion
source for JavaScript content.

!jsDocCompletions

Try it out ([sandbox link](!!jsdoc.ts)):

<div id="editor-javascript"></div>

<script defer src="../../codemirror.js"></script>
<script defer src="autocompletion.js"></script>
<script defer src="jsdoc.js"></script>
