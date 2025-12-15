!{"type": "examples", "title": "CodeMirror Internationalization Example", "injectCode": "./translate.ts"}

# Example: Internationalization

Code editor plugins usually don't need to show a _lot_ of UI text, but
some of them can't get by without showing (or
[speaking](##view.EditorView^announce)) some human-language text. In
order to be able to this without being stuck with hard-coded text that
might be in the wrong language, CodeMirror contains rudimentary
functionality for translatable phrases.

This support is not up to par with what real internationalization
libraries support, because that would be overkill for this purpose. It
just allows you to use the [`phrases`
facet](##state.EditorState^phrases) to provide translated strings for
specific fixed strings, and provides a [`phrase`
method](##state.EditorState.phrase) which will return the translated
form of the string you give it if one is available, or the original
string otherwise.

Thus, reusable components are encouraged to put a call to
`state.phrase` around every human-language string they show to the
user.

You are also strongly encouraged to make sure your calls match a
pattern like `/\bphrase\(/`, so that they are relatively easy to
find—in order to translate your component, people will first need to
figure out which phrases it uses.

There is not, at this point, a repository of translations for the
strings in the core modules. The only thing to work with is the
example below, which will be kept up to date to cover the phrases
needed to translate a basic CodeMirror setup.

## German CodeMirror

This is a map of phrases translating the phrases used in the core
packages from English to German. You could base your own translations
for other languages on it.

!germanPhrases

Given that, you can include an expression like
`EditorState.phrases.of(germanPhrases)` in your configuration to
enable the translation ([sandbox link](!!translate.ts)).

<div id=editor></div>
<script defer src="../../codemirror.js"></script>
<script defer src="translate.js"></script>
