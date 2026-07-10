# Recovery Seeding Harness

This folder contains a local-only harness for starting Neanes against an isolated Electron `userData` directory.

## Default profile path

Each scenario seeds into:

```text
/tmp/neanes-recovery-scenarios/<scenario>/userData
```

The Electron main process reads `NEANES_DEV_USER_DATA_DIR` only in dev mode, so production and packaged builds keep using the normal profile path.

## Scripts

- `seed-recovery.mjs` creates the chosen user-data directory, clears any existing contents, and writes recovery envelopes into `recovery/`.
- `run-scenario.sh` seeds a scenario, exports `NEANES_DEV_USER_DATA_DIR`, and launches `npm run dev`.

## Scenarios

- `untitled-auto` - one untitled unsaved snapshot. It should auto-open on startup.
- `saved-source-matches` - one saved-file snapshot whose source metadata still matches the source file. It should auto-open on startup.
- `saved-source-changed` - one saved-file snapshot whose source file changed after the snapshot was taken. It should appear in the recovery dialog.
- `saved-source-missing` - one saved-file snapshot whose source file is missing. It should appear in the recovery dialog.
- `two-files-to-recover` - two different saved-file snapshots with missing sources. The recovery dialog should show both files as separate recoverable candidates.
- `current-and-previous` - writes both `.json` and `.prev.json` for the same workspace. The recovery dialog should show both and default-select the newest.
- `corrupt-current` - writes a corrupt current snapshot and a valid `.prev.json`. The store should recover from the previous file.
- `stale-temp` - writes an abandoned `.tmp.json` older than 24 hours. Startup should clean it up.
- `recent-temp` - writes a recent `.tmp.json`. Startup should leave it alone and show no recovery candidate.

## Examples

Run a scenario directly:

```sh
scripts/recovery/run-scenario.sh saved-source-changed
```

Allow deleting an out-of-tree user-data directory:

```sh
node scripts/recovery/seed-recovery.mjs --force --user-data-dir /tmp/custom-neanes-profile saved-source-missing
```
