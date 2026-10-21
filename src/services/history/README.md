# Content changes and undo history

Each workspace shares a `ContentChangeTracker` with its `CommandService`.
The revision is runtime state; it is never written to score files.

- Execute content edits through the workspace's command service. Execute, undo,
  and redo advance the revision and mark the workspace dirty. A batch advances
  it once. Empty operations do neither.
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

Saving captures the content revision, score identity, and source path beside the
payload. It compares those values after file I/O and again after recovery cleanup,
flushing buffered editors before each check. Saves for one workspace are queued
through recovery completion; different workspaces can save independently.

Revisions always increase, including on undo. Editing and undoing during a save
therefore conservatively leaves the workspace dirty. This tracker does not
implement an undo-stack clean marker.
