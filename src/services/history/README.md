# Content changes and undo history

Each workspace shares a `ContentChangeTracker` with its `CommandService`.
The revision and content-state identities are runtime state; they are never
written to score files. The revision always increases when content changes.
The state identity can return to an earlier value through undo or redo.

- Execute content edits through the workspace's command service. Execute, undo,
  and redo advance the revision. The workspace is dirty when its current state
  differs from its saved state. A batch advances the revision once and records
  one undo step. Empty operations do neither.
- `noHistory` only suppresses the undo entry. It does not suppress content
  tracking. Use it for meaningful edits that should not be independently undone.
- Route content edits through commands even when they do not need undo history.
  The lyrics-manager operations on `Workspace` are examples. Do not increment
  revisions manually at UI call sites.
- Derived measurements, rendering invalidations, selection, and other UI state
  do not advance the content revision. Write measured heights directly rather
  than passing them through content commands. Heights included alongside a
  content edit may remain in that edit's undo step.
- Extracting unlocked staff lyrics from notes is derived synchronization. Editing
  the lyrics-manager text or lock state is a content change.
- Initialize scores before exposing their workspace to the editor. Replacing a
  score advances the revision without changing its dirty-state baseline, so a
  loaded file can be clean while a recovered draft keeps its restored flag.

Saving captures the revision, state identity, score identity, and source path
beside the payload. It compares the state and context after file I/O and again
after recovery cleanup, flushing buffered editors before each check. On success,
the written state becomes the saved state even if newer edits are present. Undo
can then return to it without another write. The revision still records all
intervening edits for operations that require strict concurrency checks.

Each history entry records unique before/after state identities. Undo/redo can
restore an identity only when starting from the corresponding known endpoint.
A noHistory edit or partial failure creates a fresh state. Replaying older
commands from that unknown endpoint also creates a fresh state: those commands
may overwrite content changed outside history, so returning to an old stack
position cannot establish cleanliness. New commands recorded after that edit
can recognize their saved states normally. Branches never reuse state identities.

Layout and recovery scheduling must not set the dirty flag. Explicit dirty-flag
assignments establish loaded/recovered/imported document baselines or invalidate
a saved marker after a save context change. Derived rendering changes remain
outside this tracking. Replacing a score clears commands for the previous score.

Saves for one workspace are queued through recovery completion; different
workspaces can save independently.
