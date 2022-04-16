!{"type": "examples", "title": "CodeMirror Split View Example", "injectCode": "./split.ts"}

# Example: Split View

Though it is possible to create multiple [views](##view.EditorView)
from a single [editor state](##state.EditorState), those views will
not, by themselves, stay in sync. States are just immutable values,
and their updated forms will simply diverge.

Thus, to keep the content of two views in sync, you'll have to forward
changes made in one view to the other. A good place to do this is
either an overridden [`dispatch`
function](##view.EditorView.constructor^config.dispatch), or an
[update listener](##view.EditorView^updateListener). In this example,
we'll use the former.

We'll simply use a single start state in this example—though that
isn't necessary, as long as both states have the same document. It
might help, if the document can be big, to give both states the same
[`Text`](##state.Text) instance as starting
[document](##state.EditorStateConfig.doc), so that most of the
document tree structure can be shared.

!state

Next comes the code that will be responsible for broadcasting changes
between the editors. To work around some cyclic reference issues (the
dispatch functions need access to the view, but are passed when
initializing the view), the code stores the views in an array and
refers to them by index.

In order to be able to distinguish between regular transactions caused
by the user and synchronizing transactions from the other editor, we
define an [annotation](##state.Annotation) that will be used to tag
such transactions. Whenever a transaction that makes document changes
and isn't a synchronizing transaction comes in, it is also dispatched
to the other editor.

!syncDispatch

Now we can create the views, and see them in action.

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
