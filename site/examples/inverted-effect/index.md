!{"type": "examples", "title": "CodeMirror Undoable Effects Example", "injectCode": "./inverted-effect.ts"}

# Example: Undoable Effects

By default, the [history](##commands.history) extension only tracks
changes to the document and selection, and undoing will only roll back
those, not any other part of the editor state.

Sometimes, you do need other actions on that state to be undoable. If
you model those actions as [state effects](##state.StateEffect), it is
possible to wire such functionality into the core history module. The
way you do that is by registering your effect to be
[invertable](##commands.invertedEffects). When the history sees a
transaction with such an effect, it'll store its inverse, and apply
that when the transaction is undone.

Let's go through an example of an extension that allows the user to
highlight parts of the document, and undo that highlighting.

We'll keep the information about highlighted ranges in a [state
field](##state.StateField), and define effects to add and remove such
ranges.

!effect

Such effects can be added to a transaction, and inspected up by code
looking at the transaction. Since the effect contain document
positions, they need to define a mapping function in order to be
adjusted properly when, for example, a change is made with the
[`addToHistory`](##state.Transaction^addToHistory) flag set to false,
causing an undone effect to be applied to a different document than
the one it was originally made for.

We define a state field holding a [range set](##state.RangeSet) of
decorations representing the highlighted ranges. Whenever a
transaction that with highlighter-related effects comes in, the
field's `update` function applies those effects.

!field

In order to make sure our range set doesn't contain overlapping or
needlessly fragmented ranges, these helper methods clear or add a
range by replacing all the highlights that touch the given range with
either a single continuous range, when adding, or only the pieces of
the old ranges that stuck out of the cleared region, when removing.

!cutRange

Now we can define our effect-inversion logic. The function we give to
[`invertedEffects`](##commands.invertedEffects) is called for every
transaction, and returns an array of effects that the history should
store alongside the inverse of that transaction.

So this function turns effects that add highlights into effects that
remove them, and vice versa.

And because deleting a region around a highlight also deletes the
highlight, and we might want to restore them when undoing the
deletion, the function also iterates over all replaced ranges and
creates a highlight effect for any covered highlight in them.

!invert

These two commands apply our effects to any selected ranges.

!command

Note that `unhighlightSelection` only creates effects for previously
highlighted ranges that overlap the selection. If we had simply
created them for the entire selected ranges, inverting those effects
could cause things to be highlighted that were not previously
highlighted.

!extension

If we tie all that together into an extension, it makes an editor
behave like this:

<div id="editor"></div>
<script defer src="../../codemirror.js"></script>
<script defer src="inverted-effect.js"></script>
