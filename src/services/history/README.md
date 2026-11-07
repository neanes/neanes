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
- Ordinary property updates record only the requested fields that change.
  They do not discover other fields or inspect model backing storage.
- Musical property updates use `createNoteUpdateCommand` and
  `createMartyriaUpdateCommand` from `elementEditing`. Inject these into the
  corresponding `CommandFactory` so the existing `update-properties` interface
  uses the editing layer's explicit notation-state contract.
- `NoteElement` and `MartyriaElement` own typed capture/restore methods for their
  notation, including setter normalization, visible fthoras and carries, and
  manual martyria pitch. Restore these together before layout runs again.
  Rendering caches, lyrics, formatting, and child collections remain outside
  that state. Extend the typed contract when notation gains new dependencies.
- `StateEditCommand` records and replays an editing layer's capture/apply/restore
  contract. A composite combines notation and ordinary property changes into
  one undo step, omitting empty operations. History has no musical model imports
  or knowledge of layout dependencies.
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
Successful persistence also clears recovered status for that same document;
newer unsaved edits retain recovery until saved or undone, while closing a clean
workspace removes its recovery files normally.

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

History availability is instance-scoped. `CommandService.subscribe` immediately
publishes the current Undo/Redo availability and returns an unsubscribe function.
The editor observes only the selected workspace's history and owns toolbar and
native-menu publication. Background and private histories need no UI suppression
or compensating publication. Selection changes flush pending edits before
switching the subscription; editor teardown removes the subscription.

## Rich text and footnotes: intentional separate histories

Decision: preserve master's separate-history behavior rather than merge CKEditor
history with score history. These are accepted product compromises, not missing
history coordination to reintroduce during review:

- Rich-text keyboard shortcuts and toolbar Undo/Redo use CKEditor's native
  history only. Exhausting it does not fall back to score history.
- Clicking the application Undo/Redo menu uses score history, even when a text
  editor is focused. Menu availability reflects score history only.
- Flushed HTML remains in score history. Native and score histories are not a
  single chronological timeline. Fresh buffered typing does not eagerly discard
  score Redo; recording a score command discards it normally.
- Save and blur do not clear native history for an echoed content commit.
  External replacement and score replay can reset native history or remount the
  editor. Historical caret/selection restoration and native Redo survival across
  those replacements are not guaranteed.
- Pending text detection compares stored HTML directly with CKEditor's output,
  as on master. CKEditor normalization alone can therefore produce a content
  command on blur or flush (for example, imported `<b>` markup). This pre-existing
  behavior is intentionally outside the footnote feature's scope; no separate
  normalized-data baseline is maintained here.
- There is no checkpoint graph, native batch replay, shared history action
  injection, or commit boundary imposed on CKEditor's undo stack.

Footnote consistency uses IDs instead. A score-scoped weak map retains complete
footnote bodies, including deleted ones, for the score's lifetime. There is no
expiry timer and retained bodies are not serialized. Closing/replacing the score
allows the cache to be collected; native Undo across close/reopen is not supported.
This deliberately trades memory for predictable restoration without searching
undo history. Active bodies take precedence over retained versions.

Interactive rich-text editors observe data changes. Plain text insertions,
deletions, and formatting skip reference scanning; structural edits and changes
to footnote IDs compare the marker IDs. A changed marker sequence commits the
current HTML and body additions/removals together using ordinary score commands.
Native Undo that reinstates a marker restores its retained body immediately.
Marker edits can therefore also commit surrounding pending text and invalidate
score Redo. Ordinary typing remains buffered. Programmatic model synchronization
updates the marker baseline without creating another edit.

Serialization, export, clipboard and navigation still flush pending text. The
same footnote planner resolves retained IDs there, validates ownership, and
rejects genuinely unknown, duplicate or unsupported nested references. Incoming
model synchronization and stale-editor flush guards remain necessary independently
of undo policy. Do not remove those safeguards when simplifying history.
