# Recovery Notes

This note summarizes the recovery snapshot system in Neanes as it exists in the
Electron app today. It is meant for future AI agents and developers who need to
understand how recovery files are created, shown, kept, and removed.

## High-level model

Each workspace can have its own recovery data under Electron `app.getPath('userData')`:

- `recovery/<workspaceId>.json`
- `recovery/<workspaceId>.prev.json`
- `recovery/<workspaceId>.tmp.json`

For the local recovery harness, the seeded profile lives under the OS temp
directory, at `<os-temp-dir>/neanes-recovery-scenarios/<scenario>/userData`.

The recovery data is a JSON envelope that contains:

- the workspace id
- the original file path, if any
- the temp filename
- whether the workspace had unsaved changes
- the score payload
- source file metadata when the workspace was saved from disk
- timestamps, app version, and a content checksum

The envelope is validated on read. The `score` string must match the stored
`contentLength` and `contentSha256`, otherwise the file is ignored.

## When recovery snapshots are made

Recovery snapshots are written from the renderer, not from the save-file path.
The editor periodically serializes the current workspace state and sends it to
the Electron recovery store.

The main write path is:

- when the workspace has unsaved changes, `save()` schedules a background
  recovery snapshot
- the snapshot is typically written on a debounce timer rather than on every
  single edit
- explicit save actions still go through the normal save path first, then clean
  up recovery data after a successful save

Important detail:

- normal dirty workspaces use the regular rotate path
- recovered workspaces use a preserve path so the chosen recovery snapshot is
  not immediately thrown away during close/save churn

The recovery snapshot always records the latest score state the editor had when
the snapshot was taken, which may lag the live rich-text editor by one flush if
the editor has not blurred yet. The authoritative save path flushes all live
content before writing the score file.

## When recovery snapshots are discarded

Recovery data is removed in these cases:

- a normal save or save-as succeeds
- a workspace closes cleanly and is not a recovered workspace
- a recovered workspace is successfully saved
- the user explicitly discards recovered workspaces from the recovery dialog
- the user explicitly discards a workspace from the alert confirmation flow
- abandoned `.tmp.json` files older than 24 hours are cleaned up when recovery
  candidates are listed

Recovery data is usually removed by deleting all three files for the workspace:

- current `*.json`
- previous `*.prev.json`
- temp `*.tmp.json`

The store also has a grouped discard path that removes matching snapshots by
recovery id, including current, previous, and temp files.

## When snapshots show up in dialogs

At startup, the Electron main process asks the recovery store for candidates.
The store scans the recovery directory, may clean abandoned temp files, and
prefers the newest readable snapshot for each recovery group.

The editor then classifies candidates into two buckets:

- auto-recovery candidates
- pending candidates that should be shown in the recovery dialog

Auto-open happens for:

- untitled workspaces
- a saved workspace when there is only one candidate and the source file still
  matches the metadata stored in the snapshot

Pending dialog behavior happens for:

- a saved workspace whose source file is missing
- a saved workspace whose source file changed since the snapshot was taken
- any multi-snapshot group where the app needs to recover a single newest copy
  for the workspace/file group

The dialog now shows only the newest valid snapshot per workspace/file group. It
does not expose `current` versus `previous` in the UI anymore.

## How the recovery dialog works

The dialog is intentionally simple:

- each row shows only the file name, not the full path
- the list defaults to all rows checked
- `Recover Selected` and `Discard Selected` are disabled when nothing is checked
- `Skip` closes the dialog
- the dialog stays open after recover or discard if there are still unrecovered
  workspaces left in the list

Discard flow:

- pressing `Discard Selected` opens a confirmation alert
- the alert says the action is permanent
- confirming discard removes the checked recovery entries from the list and
  discards the corresponding recovery files from disk

Recover flow:

- pressing `Recover Selected` opens the selected recovery snapshots as
  workspaces
- the selected entries are removed from the dialog list
- sibling snapshots from the same recovery group are also discarded so the
  group is consumed deterministically
- the dialog remains open if other recovery candidates are still present

The dialog is therefore a queue, not a one-shot modal. The user can process
multiple recovery workspaces in a single session.

## File grouping and selection rules

Recovery candidates are grouped by a stable key:

- untitled snapshots group by workspace id
- saved-file snapshots group by file path

Within a group, the candidates are sorted newest-first by `updatedAt`.

Default selection behavior:

- the newest candidate in each group is selected by default
- when the dialog opens, every displayed item is checked

This grouping matters because the store can surface both `current` and
`previous` files for the same workspace. The editor removes sibling recovery ids
when one candidate from the same group is recovered so the same group does not
keep reappearing.

## Real-life scenarios

### Untitled auto-recovery

This is the common crash case for a new unsaved score:

- you create a new score
- you type or edit
- Neanes writes a recovery snapshot
- the app crashes or is force-quit before a normal save happens

On restart, the untitled snapshot auto-opens because there is no source file to
compare against.

### Saved-source-matches

This means the recovery snapshot matches the current saved file metadata.

Real-life cases:

- Neanes crashed, but the on-disk file was not changed afterward
- the app wrote a recovery snapshot for a saved file, then relaunched before
  the file changed

This can auto-open because there is no conflict between the snapshot and the
current file on disk.

### Saved-source-changed

This means the source file still exists, but the file size or mtime no longer
matches the snapshot metadata.

Real-life cases:

- the file was changed by another editor
- the file was replaced by a sync client
- the repository switched branches or the file was regenerated externally

This appears in the dialog because Neanes cannot assume the snapshot should
overwrite the current file automatically.

### Saved-source-missing

This means the recovery snapshot points to a file path that no longer exists.

Real-life cases:

- the file was deleted or renamed
- the file was moved by a sync or cleanup tool
- the working tree or mount point disappeared

The recovery data may still be the only copy of the work, so the dialog lets the
user recover it manually.

### Current and previous together

This occurs when the app has both generations of recovery files for the same
workspace:

- the latest snapshot is in `*.json`
- the earlier generation is in `*.prev.json`

That usually means the app had time to write multiple recovery snapshots before
it stopped or the cleanup step never ran. The UI now only shows the newest valid
candidate, but the store still understands both files.

### Corrupt current with valid previous

If the current file cannot be read but the previous file can, the previous one
can still be used. This is why `prev.json` is kept in the store even though the
dialog does not expose it as a separate choice.

### Stale temp and recent temp

Temporary files are used during recovery writes. The store cleans up abandoned
temp files only when it is safe to do so:

- old temp files can be removed during candidate listing
- recent temp files are left alone

This keeps active writes from being destroyed during startup recovery scanning.

## Crash-safety notes

The preserve path for recovered workspaces is designed to avoid deleting all
durable recovery copies before the replacement snapshot exists.

Still, the recovery system is best-effort rather than transactional. Future work
should keep in mind:

- temp files are used as the write buffer
- the store syncs the directory after writes or destructive cleanup steps
- startup cleanup should be conservative around recent temp files
- the dialog should not assume a `current` / `previous` distinction is a user
  concern

## Browser mode

In browser/PWA mode, the recovery logic does not use the Electron recovery
store. Workspace state is stored in localStorage instead. The note above is
specifically about the Electron recovery flow and dev harness behavior.

## Related files

- `src/components/TheEditor.vue`
- `src/components/RecoveryDialog.vue`
- `src/services/recovery/RecoveryStore.ts`
- `src/services/recovery/recoveryCandidates.ts`
- `src/ipc/ipcChannels.ts`

If you are changing this feature, inspect the editor save/close paths together
with the recovery store. The interesting bugs usually come from the seam
between “background snapshot writes” and “what gets discarded on close.”
