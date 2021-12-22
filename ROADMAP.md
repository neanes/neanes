# Roadmap

## Must-haves

- Right-align option for martyria and tempos. Does this maybe become a "paragraph option", where a paragraph can consist of neumes, small text-boxes that fit to the width of their contents, and have an alignment?
- More adjustments and replacements. Generate test files with every quantitative neume and different combinations of other neumes. Should we support ridiculous combinations?
- Save file menu item (only Save As works right now)
- App Icon
- App Name?
- Better error handling
- Detect unsaved changes and warn user before opening or clicking new
- Text boxes and mode keys should not be able to be replaced by a neume. They should be deleted. This means logic needs to be updated both for auto entry mode and non-auto entry mode.
- Documentation
- Contribution guide / style guide (use prettier)
- Decide on a license

## Nice-to-haves

- Document Settings Dialog
- Microtonal Sharps and Flats
- Custom Martyrias
- Note Indicators
- Ison Neumes
- Header Images
- Headers/Footers/Page Numbers
- Add empty neume box at end of score if missing (e.g. due to corrupted save file)
- Copy/Cut/Paste elements
- Allow multiple elements to be selected (and copy/cut/pasted)
- Undo / redo
- Configurable Neume Keyboard
- Icons (e.g. for page break and line break)
- Better styling
- Graceful handling of bad martyrias
- Score checker that points out potential issues by using Fr. Ephraim's style rules.

## Tech Debt

- Need to explicitly map between save file neumes and view model neumes. This will prevent errors due to mismatched or missing neumes in the save model.

- Lyrics should be absolutely aligned.

- Not all lyrics should be center-aligned. For example, lyrics under neumes with a vareia or a running elaphron should be shifted to the right.

- Neume Adjustments should happen in the model layer, instead of the presentation layer.

- We'll probably never support alternate fonts, but if we did, the internal Neume enum needs to be separate from the EZ Font neume list. In general the map will be App Neumes => Font Neumes => Keyboard Code.
