!{"type": "examples", "title": "CodeMirror Split View Example", "injectCode": "./split.ts"}

# Example: Split View

Though it is possible to create multiple [views](##view.EditorView)
from a single [editor state](##state.EditorState), those views will
not, by themselves, stay in sync. States are immutable values, and
their updated forms held in the different views will simply diverge.

Thus, to keep the content of two views in sync, you'll have to forward
changes made in one view to the other. A good place to do this is
either an overridden [`dispatch`
function](##view.EditorView.constructor^config.dispatch), or an
[update listener](##view.EditorView^updateListener). In this example,
we'll use the former.

To make sure there's only one undo history, we'll set up one state
_with_ the history extension, and one without. The state for the main
editor is set up as normal.

!startState

The state for the second editor doesn't track history state, and binds
history-related keys to perform undo/redo in the main editor.

!otherState

Next comes the code that will be responsible for broadcasting changes
between the editors.

In order to be able to distinguish between regular transactions caused
by the user and synchronizing transactions from the other editor, we
define an [annotation](##state.Annotation) that will be used to tag
such transactions. Whenever a transaction that makes document changes
and isn't a synchronizing transaction comes in, it is also dispatched
to the other editor.

!syncDispatch

Now we can create the views, and see them in action ([sandbox](!!split.ts)).

!setup

The first editor:

<style>
  .cm-editor { height: 100px }
</style>
<div id=editor1></div>

And the second:

<div id=editor2></div>
<script defer src="../../codemirror.js"></script>
<script defer src="split.js"></script>

Note that non-document state (like selection) isn't shared between the
editors. For most such state, it wouldn't be appropriate to share it.
But there might be cases where additional elements (such as, say,
breakpoint information) needs to be shared. You'll have to set up your
syncing code to forward updates to that shared state (probably as
[effects](##state.StateEffect)) alongside the document changes.
