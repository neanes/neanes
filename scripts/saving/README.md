# Save revision integration checks

Run on macOS or Linux with a desktop session:

```sh
node scripts/saving/revision-smoke.mjs /absolute/output/directory
```

The harness starts the real Vite editor and Electron main/preload processes with
an isolated temporary profile. It accesses the development Vue component state
to invoke actual editor operations, and enters rich text through Chromium's
`webContents.insertText` input API into a real CKEditor instance.

POSIX FIFOs hold actual filesystem operations open at deterministic boundaries.
No app methods, IPC handlers, or filesystem functions are replaced; there are no
mocks, spies, or DOM emulation. The checks cover:

- Buffered rich text flushed before saving and repeated unchanged saves.
- Typing while the score write is pending, retaining dirty state and recovery.
- Editing and undoing during a write or recovery cleanup, returning to clean.
- Undoing a written edit before completion, then returning to clean through redo.
- Undoing newer rich text after save completion, recognizing the written state.
- Branching history without confusing a reused undo position with saved content.
- Overlapping saves, with the later save writing the latest editor content.
- Derived height changes during saving without a content revision or dirty flag.
- Typing after the score write while recovery cleanup is pending, recreating
  recovery with the newer content.
- Lyrics-manager edits, undo/redo, and noHistory annotation/alternate-line insertion.
- Full persisted notation restoration after a quantitative-neume setter clears
  secondary fthora, comparing the undone note against the score written to disk.
- Edit-mode copy/paste followed by undo/redo when layout generates a fthora carry,
  comparing the entire undone score against disk before accepting clean status.
- Toggling a manual martyria to Auto and undoing, comparing the entire score
  against disk to verify restoration of its manual note and scale; redo is checked
  against the automatic notation as well.
- Saving recovered content with newer edits, then undoing and immediately closing
  without leaving stale current, previous, or temporary recovery candidates.
- An intentional directory write failure, retaining changes and allowing retry.

The intentional failure logs `EISDIR`; the harness must then report that retry
passed and exit successfully. Score files and an editor screenshot remain in the
output directory for inspection. The ordinary user profile is never used.

On macOS, agents must run this command outside their command sandbox as required
by the repository's AGENTS.md. Electron's own sandbox remains enabled.
