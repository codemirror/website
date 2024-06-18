!{"type": "examples", "title": "CodeMirror Tab Handling Example", "injectCode": "./tab.ts"}

# Example: Tab Handling

By default, CodeMirror _does not_ handle the Tab key. This isn't an
oversight—it is an intentional decision to make the default
configuration pass the ["no keyboard
trap"](https://www.w3.org/TR/WCAG21/#no-keyboard-trap) criterion of
the W3C Web Content Accessibility Guidelines.

Some users browse the web without access to a pointing device, and it
is really unfriendly towards such users to have focusable inputs that
they cannot escape from.

_However_, I understand that people expect the Tab key do something
indentation-related in code editor controls. To that purpose,
CodeMirror has a built-in escape hatch: If you press the Escape key,
and then press Tab directly after it, the editor never handles the Tab
press, so that you can use that to move focus. In addition, the
default keymap binds Ctrl-m (or Shift-Alt-m) on macOS to the
[`toggleTabFocusMode` command](#commands.toggleTabFocusMode), which
toggles a similar behavior.

Unfortunately, since CodeMirror doesn't have a built-in help feature
(and probably shouldn't, since it's just a component, not an
application), users won't know this.

So if you _really_ want to bind Tab, please start by making sure you
mention one of these escape hatches somewhere in your documentation.
Next, you can [add](##view.keymap) your own [key
binding](##view.KeyBinding) that binds Tab to some command, or use
[`indentWithTab`](##commands.indentWithTab) from the
[commands](##commands) package.

!editor

Try it out:

<div id=editor></div>
<textarea style="width: 100%">Press Escape, then Tab to move to this field. Or Escape, Shift-Tab to move to the field before the editor.</textarea>
<script defer src="../../codemirror.js"></script>
<script defer src="tab.js"></script>
