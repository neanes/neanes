# Roadmap

## Must-haves

- More adjustments and replacements. Generate test files with every quantitative neume and different combinations of other neumes. Should we support ridiculous combinations? (partly done)
- App Icon (proposed "neanes" symbol, change official app title to "Neanes")
- Better error handling
- Detect unsaved changes and warn user before opening or clicking new
- Documentation
- Contribution guide / style guide (use prettier)
- Decide on a license

## Must-haves but lower priority

- The app is currently very slow when there are many pages. Add a way to view one page at a time with backwards/forwards buttons. Also figure out how to improve the speed for many pages.

## Nice-to-haves

- Right-align option for martyria and tempos. Does this maybe become a "paragraph option", where a paragraph can consist of neumes, small text-boxes that fit to the width of their contents, and have an alignment?
- Document Settings Dialog
- Microtonal Sharps and Flats
- Custom Martyrias
- Note Indicators
- Ison Neumes
- Dotted digorgon neumes et al
- Advanced neumes (connecting heteron, ties, et al)
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
- Score checker that points out potential issues by using Fr. Ephraim's style rules (and other sources).
- Investigate the feasibility of image recognition, allowing users to upload an image of a score that would be transformed into a file in our program.

## Tech Debt

- Need to explicitly map between save file neumes and view model neumes. This will prevent errors due to mismatched or missing neumes in the save model.

- Lyrics should be absolutely aligned.

- Not all lyrics should be center-aligned. For example, lyrics under neumes with a vareia or a running elaphron should be shifted to the right.

- Neume Adjustments should happen in the model layer, instead of the presentation layer.

- We'll probably never support alternate fonts, but if we did, the internal Neume enum needs to be separate from the EZ Font neume list. In general the map will be App Neumes => Font Neumes => Keyboard Code.

- All editor elements should probably be their own components.
