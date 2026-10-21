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
- Overlapping saves, with the later save writing the latest editor content.
- Derived height changes during saving without a content revision or dirty flag.
- Typing after the score write while recovery cleanup is pending, recreating
  recovery with the newer content.
- Lyrics-manager edits, undo/redo, and noHistory annotation/alternate-line insertion.
- An intentional directory write failure, retaining changes and allowing retry.

The intentional failure logs `EISDIR`; the harness must then report that retry
passed and exit successfully. Score files and an editor screenshot remain in the
output directory for inspection. The ordinary user profile is never used.

On macOS, agents must run this command outside their command sandbox as required
by the repository's AGENTS.md. Electron's own sandbox remains enabled.
