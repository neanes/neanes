# Roadmap

## Must-haves

- More adjustments and replacements. Generate test files with every quantitative neume and different combinations of other neumes. Should we support ridiculous combinations? (partly done)
- Better error handling

## Must-haves but lower priority

- The app is currently very slow when there are many pages. Add a way to view one page at a time with backwards/forwards buttons. Also figure out how to improve the speed for many pages.

## Nice-to-haves

- Gorthmikon and pelastikon (part of Oxeia fonts, but need to figure out best way to insert into lyrics box)
- Custom Martyrias (is this really necessary?)
- Note Indicators
- Ison Neumes
- Advanced neumes (connecting heteron, ties, et al)
- Header Images
- Headers/Footers/Page Numbers
- Copy/Cut/Paste elements
- Allow multiple elements to be selected (and copy/cut/pasted)
- Configurable Neume Keyboard
- Better styling
- Right-align option for tempo
- Right align for multiple elements grouped together (e.g. tempo followed by martyria). Does this maybe become a "paragraph option", where a paragraph can consist of neumes, small text-boxes that fit to the width of their contents, and have an alignment?
- Fix neume justification routine when a text box is entered in the middle of a line
- Score checker that points out potential issues by using Fr. Ephraim's style rules (and other sources).
- Investigate the feasibility of image recognition, allowing users to upload an image of a score that would be transformed into a file in our program.

## Tech Debt

- Need to explicitly map between save file neumes and view model neumes. This will prevent errors due to mismatched or missing neumes in the save model.

- Neume Adjustments should happen in the model layer, instead of the presentation layer.

- We'll probably never support alternate fonts, but if we did, the internal Neume enum needs to be separate from the EZ Font neume list. In general the map will be App Neumes => Font Neumes => Keyboard Code.

- All editor elements should probably be their own components.
