# Releasing

At a high level, `electron-builder --publish always` uploads artifacts to the GitHub release whose name matches the `version` field in `package.json`.
The Git tag is only a bookmark.

## When to release

Avoid releasing anything on weekends unless it is a major bug fix.
Users often finalize scores last-minute for Saturday-night and Sunday-morning services, and bad weekend releases tend to draw almost immediate bug reports.

## Smoke test

Run through a couple of scores, particularly multi-page scores, and make sure:

- The score looks correct in the app.
- Scrolling works.
- Neume entry works (click a few neumes or toolbar buttons).
- Lyric entry works.
- Export to PDF and make sure the score looks fine.

The biggest source of regressions is Electron version changes, especially major ones.
The checklist above catches the worst problems these bumps introduce, usually a change in how Chromium interprets some CSS rule.
This is infrequent.

## Local update testing

For renderer-only testing, start the app with `FAKE_UPDATE_AVAILABLE=1`. This bypasses `electron-updater` and simulates the same update IPC flow that the toast UI listens for.

## Bump and tag

```sh
npm version patch   # or `minor` / `major`
git push origin master --follow-tags
```

`npm version` updates `package.json`, creates a commit named `X.Y.Z`, and tags it `vX.Y.Z`.

## Run the release workflows

`publish.yml` and `publish-web.yml` are triggered via `workflow_dispatch`.
Select the tag in the "Use workflow from" dropdown rather than `master` for these workflows:

- `publish.yml` runs an Ubuntu/Windows/macOS matrix and uploads the installers, AppImage, and DMG to the GitHub release matching `package.json`. The macOS job builds for both x86-64 and ARM64.
- `publish-web.yml` builds the web app and force-pushes `dist/` to `gh-pages` on `neanes/neanes-web-app`. It requires the `PAT` secret.

`docs.yml` uses the same trigger, but the `github-pages` environment is gated to the `master` branch.
Run this workflow from `master` rather than the tag:

- `docs.yml` rebuilds the VitePress docs and is only needed when they have changed.

## Publish the release draft

Once `publish.yml` has attached all assets:

- Open the draft on the GitHub releases page.
- Tidy up the release notes.
- Set the tag to `vX.Y.Z`.
- Publish the draft.
