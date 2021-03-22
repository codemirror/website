!{"type": "examples", "title": "CodeMirror Styling Example"}

# Example: Styling

CodeMirror uses a CSS-in-JS system to be able to include its styles
directly in the script files. This means you don't have to include a
library CSS file in your page for the editor to work—both the editor
view's own styling and any styling defined for dependencies are
automatically pulled in through the JavaScript module system.

[Themes](##view.EditorView^themes) are simply extensions that tell the
editor to mount an additional [style
module](https://github.com/marijnh/style-mod#documentation) and add
the (generated) class name that enables those styles to its outer DOM
element.

## Old-Fashioned CSS

The important elements in the editor have regular (non-generated) CSS
class names, which can be targeted with manually written style sheets.
For example, the outer element has class `cm-editor`.

However, the CSS rules injected by the library will be prefixed with
an extra generated class name, so that they only apply when explicitly
enabled. That means that if you need to override them, you must take
care to make your own rules at least as specific as the injected
rules, for example by prefixing them with `.cm-editor`. They only need
to be _as_ specific, not more specific, because the injected rules are
placed before any other style sheets, and will thus have a lower
default precedence than your rules.

```text/css
.cm-editor.cm-focused { outline: 2px solid cyan }
.cm-editor .cm-content { font-family: "Consolas" }
```

Note that the `cm-focused` rule applies directly to the element
that'll have the `cm-editor` class, and thus needs no space between
the selectors, whereas the `cm-content` rule does need one because it
applies to a node inside the editor.

## Things you can Style

An editor (with a [gutter](##gutter) and
[`drawSelection`](##view.drawSelection) enabled) has a DOM structure
like this:

```html
<div class="cm-editor [cm-focused] [generated classes]">
  <div class="cm-scroller">
    <div class="cm-gutters">
      <div class="cm-gutter [...]">
        <!-- One gutter element for each line -->
        <div class="cm-gutterElement">...</div>
      </div>
    </div>
    <div class="cm-content" contenteditable="true">
      <!-- The actual document content -->
      <div class="cm-line">Content goes here</div>
      <div class="cm-line">...</div>
    </div>
    <div class="cm-selectionLayer">
      <!-- Positioned rectangles to draw the selection -->
      <div class="cm-selectionBackground"></div>
    </div>
    <div class="cm-cursorLayer">
      <!-- Positioned elements to draw cursors -->
      <div class="cm-cursor"></div>
    </div>
  </div>
</div>
```

Of course, there are limits to how you can style the editor. Things
like making the editor lines `display: inline` or the cursor
`position: fixed` will just break stuff. But within reasonable bounds,
the library tries to be robust when it comes to styling.

 * You can style content text with varying fonts, size, color, etc.
   The editor does not expect a monospace font or a fixed line height.

 * You can add vertical padding to `cm-content` and horizontal padding
   to `cm-line`.

 * By default, the editor adjusts to the height of its content, but
   you can make `cm-scroller` `overflow: auto`, and assign a `height`
   or `max-height` to `cm-editor, to make the editor scrollable.

 * Colors can be adjusted throughout, but when adding background
   colors to content, it is recommended to use partially transparent
   colors. That way such a style doesn't hide other styling behind it
   (including the selection).

 * [Whitespace](https://developer.mozilla.org/en-US/docs/Web/CSS/white-space)
   behavior inside the editor can be `pre` or `pre-wrap` to control
   line wrapping. (The [line wrapping
   extension](##view.EditorView^lineWrapping) simply sets it to
   `pre-wrap`.)

 * The editor's [text direction](##view.EditorView.textDirection) is
   automatically derived from the `direction` style of the content
   DOM.

## Themes

Themes are defined with [`EditorView.theme`](##view.EditorView^theme).
That function takes an object whose properties are CSS selectors and
whose values are
[styles](https://github.com/marijnh/style-mod#documentation), and
returns an extension that installs the theme.

```javascript
import {EditorView} from "@codemirror/view"

let myTheme = EditorView.theme({
  "&": {
    color: "white",
    backgroundColor: "#034"
  },
  ".cm-content": {
    caretColor: "#0e9"
  },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: "#0e9"
  },
  "&.cm-focused .cm-selectionBackground, ::selection": {
    backgroundColor: "#074"
  },
  ".cm-gutters": {
    backgroundColor: "#045",
    color: "#ddd",
    border: "none"
  }
}, {dark: true})
```

There's a few things going on here. Firstly, some of the rules contain
“`&`” placeholders. This indicates the position of the outer editor
element in the rule. By default, a generated class name is prefixed to
the rules, with a space after it (so `".cm-content"` becomes `".gen001
.cm-content"`). But in rules that directly target the outer element
(which gets the generated class), that doesn't work, and you have to
place a `&` character to indicate where to insert the class selector.

Secondly, because there are two ways of showing the selection in
CodeMirror (the native selection and the
[`drawSelection`](##view.drawSelection) extension), themes will
usually want to style both—the `caret-color` and `::selection` rules
apply to the native selection, whereas the `.cm-cursor` and
`.cm-selectionBackground` rules style the library-drawn selection.

Lastly, since this is a dark theme, it passes a `dark: true` option,
so that the editor will enable its dark default styles for things not
explicitly styled by the theme.

A real theme will want to style a few more things, including elements
created by extensions (such as [panels](##panel) and
[tooltips](##tooltips)). You'll also usually want to include a
[highlight style](##highlight.HighlightStyle) in your theme. You can
see the [One Dark theme](https://github.com/codemirror/theme-one-dark)
for an example, and possibly copy and modify it to create your own
theme.

## Base Themes

When you create an extension that adds some new DOM structure to the
editor, you'll usually want to include a [base
theme](##view.EditorView^baseTheme) that provides a default style for
the elements. Base themes act a lot like regular themes, except that
they are mounted with lower precedence and can provide separate rules
for dark and light themes.

For example, a hypothetical extension that replaces all instances of
the letter o with blue circles might want to include a base theme like
this...

```javascript
import {EditorView} from "@codemirror/view"

let baseTheme = EditorView.baseTheme({
  ".cm-o-replacement": {
    display: "inline-block",
    width: ".5em",
    height: ".5em",
    borderRadius: ".25em"
  },
  "&light .cm-o-replacement": {
    backgroundColor: "#04c"
  },
  "&dark .cm-o-replacement": {
    backgroundColor: "#5bf"
  }
})
```

The `&dark` and `&light` placeholders act much like `&`, except that
they expand to a class that is only enabled when the editor's theme is
light or dark. In this case, the base theme gives its circles a
brighter color in a dark theme (on the assumption that the background
will be darker there).

The extension returned by `baseTheme` must be added to the editor
configuration to (reliably) take effect—the style rules will only be
mounted in the DOM when an editor that uses them is created. It is
usually bundled up in an array with other related extensions and
returned from the exported function that produces the extensions for
the feature (see for example the [zebra stripes example](../zebra/)).

## Highlighting

Code highlighting uses a somewhat different system from editor-wide
theming. Code styles are also created with JavaScript and enabled with
an editor extension. But by default they don't use stable,
non-generated class names. A [highlight
style](##highlight.HighlightStyle) directly returns the class names
for the syntactic tokens.

Highlight associate [highlighting tags](##highlight.Tag) with styles.
For example, this one assigns styles to keywords and comments.

```javascript
import {tags, HighlightStyle} from "@codemirror/highlight"

const myHighlightStyle = HighlightStyle.define([
  {tag: tags.keyword, color: "#fc6"},
  {tag: tags.comment, color: "#f5d", fontStyle: "italic"}
])
```

Each of the objects given to
[`HighlightStyle.define`](##highlight.HighlightStyle^define) mentions
a [tag](##highlight.tags) (which are assigned to tokens by [language
packages](../lang-package/)), and otherwise contains style properties
just like the objects in a theme.

When defining an editor theme, you'll usually want to provide both a
theme extension and a highlight style that looks good with it.

If you need to style tokens with plain old CSS, you can enable the
[`classHighlightStyle`](##highlight.classHighlightStyle), which just
adds a static class (for example `cmt-keyword`) to tokens, without actually
defining any rules for that class.
