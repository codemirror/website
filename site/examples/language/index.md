!{"type": "examples", "title": "CodeMirror Language Config Example", "injectCode": "./language.ts"}

# Example: Language Configuration

Language-related functionality in CodeMirror has a number of forms.
The main thing you'll probably associate with language support is
syntax highlighting. But there's also language-aware
[indentation](##state.EditorState^indentation), [code
folding](##fold), [autocompletion](##autocomplete),
[commenting](##comment), and so on.

The recommended way to distribute language support for CodeMirror is
as a package that exports a
[language](##lang-javascript.javascriptLanguage) (usually with some
low-overhead metadata like comment, indentation, and folding metadata
included), an optional [“support”
extension](##lang-javascript.javascriptSupport) (which holds optional
additions like [completion](##autocomplete) and [linting](##lint)
functionality), and a [convenience
function](##lang-javascript.javascript) that returns both of those,
and is the default way for users to include in the configuration of an
editor for this language.

This example sets up an editor that dynamically changes its language
setup in response to the (auto-detected) language of the editor
content.

Like other state changes, changing the editor configuration is done
through a [transaction](##state.TransactionSpec.reconfigure). You may
completely [replace](##state.ReconfigurationSpec.full) the state's
configuration, but also replace just parts of this, which have to be
[tagged](##state.tagExtension) in advance.

That is the mechanism we'll use here.

In order to be able to affect transactions as they are being created
(as opposed to dispatching a separate language-changing one after the
change), we'll use a [transaction
extender](##state.EditorState^transactionExtender) that, whenever the
document content changs, does a crude check (whether the doc starts
with a `<` character) to determine whether to enable HTML or
JavaScript syntax.

When the detected language disagrees with the (primary) language
configured for the state, the transaction is extended with a
[`reconfigure`](##state.TransactionSpec.reconfigure) field that
switches the language extensions to the appropriate ones. Since
`languageTag` is always used as tag, if the extension previously set a
language, that language is overwritten.

!autoLanguage

If we specify an initial language configuration, we must be careful to
[tag](##state.tagExtension) it with our `languageTag` value, so that
when the extension updates the language, that part of the
configuration gets replaced.

!enable

The result acts like this:

<div id=editor></div>
<script defer src="../../codemirror.js"></script>
<script defer src="language.js"></script>
