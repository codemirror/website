!{"type": "examples", "title": "Basic Editor Example"}

# Example: Basic Editor

To create a CodeMirror editor, you instantiate an object of the
[`EditorView`](##view.EditorView) class. Usually, you'll want to
specify a parent element to put the editor in right away, but it is
also possible to place `view.dom` into the document after
initialization.

```javascript
import {basicSetup} from "codemirror"
import {EditorView} from "@codemirror/view"

const view = new EditorView({
  doc: "Start document",
  parent: document.body,
  extensions: [basicSetup]
})
```

This will put a text editor with the content “Start document” at the
end of the page.

At any point, [`view.state`](##view.EditorView.state) will hold the
current editor state. `state.doc.toString()` will give you the
document as a string.

The `extensions` field configures the extensions loaded into the
editor. Most functionality—even basic stuff like key bindings, a line
number gutter and syntax highlighting—is implemented as extension. It
is possible to create an editor without extensions, but that'd be a
rather useless editor. The [`basicSetup`](##codemirror.basicSetup)
value bundles together a collection of extensions that make a good
default. If you want to more precisely configure your editor, you
could start by inlining its content, as in the example below, and
tweak the result.

```javascript
import {Extension, EditorState} from "@codemirror/state"
import {
  EditorView, keymap, highlightSpecialChars, drawSelection,
  highlightActiveLine, dropCursor, rectangularSelection,
  crosshairCursor, lineNumbers, highlightActiveLineGutter
} from "@codemirror/view"
import {
  defaultHighlightStyle, syntaxHighlighting, indentOnInput,
  bracketMatching, foldGutter, foldKeymap
} from "@codemirror/language"
import {
  defaultKeymap, history, historyKeymap
} from "@codemirror/commands"
import {
  searchKeymap, highlightSelectionMatches
} from "@codemirror/search"
import {
  autocompletion, completionKeymap, closeBrackets,
  closeBracketsKeymap
} from "@codemirror/autocomplete"
import {lintKeymap} from "@codemirror/lint"

const view = new EditorView({
  doc: "Start document",
  parent: document.body,
  extensions: [
    // A line number gutter
    lineNumbers(),
    // A gutter with code folding markers
    foldGutter(),
    // Replace non-printable characters with placeholders
    highlightSpecialChars(),
    // The undo history
    history(),
    // Replace native cursor/selection with our own
    drawSelection(),
    // Show a drop cursor when dragging over the editor
    dropCursor(),
    // Allow multiple cursors/selections
    EditorState.allowMultipleSelections.of(true),
    // Re-indent lines when typing specific input
    indentOnInput(),
    // Highlight syntax with a default style
    syntaxHighlighting(defaultHighlightStyle),
    // Highlight matching brackets near cursor
    bracketMatching(),
    // Automatically close brackets
    closeBrackets(),
    // Load the autocompletion system
    autocompletion(),
    // Allow alt-drag to select rectangular regions
    rectangularSelection(),
    // Change the cursor to a crosshair when holding alt
    crosshairCursor(),
    // Style the current line specially
    highlightActiveLine(),
    // Style the gutter for current line specially
    highlightActiveLineGutter(),
    // Highlight text that matches the selected text
    highlightSelectionMatches(),
    keymap.of([
      // Closed-brackets aware backspace
      ...closeBracketsKeymap,
      // A large set of basic bindings
      ...defaultKeymap,
      // Search-related keys
      ...searchKeymap,
      // Redo/undo keys
      ...historyKeymap,
      // Code folding bindings
      ...foldKeymap,
      // Autocompletion keys
      ...completionKeymap,
      // Keys related to the linter system
      ...lintKeymap
    ])
  ]
})
```

Extensions are also the way you load additional functionality, such as
a language mode or your own custom code, into your editor. There's a
[list of extensions](../../docs/extensions/) provided by the library
that you can scan through to look for a specific feature. Most
language packages expose a main function, named after the language,
that takes a configuration object and returns the extension that
provides the language support.

```javascript
import {javascript} from "@codemirror/lang-javascript"
import {EditorView, basicSetup} from "codemirror"

const view = new EditorView({
  doc: "Start document",
  parent: document.body,
  extensions: [
    basicSetup,
    javascript({typescript: true})
  ]
})
```

By default, a CodeMirror editor is just a borderless element that will
grow to match its content. You can [style](../styling/) it to match
your desired look.
