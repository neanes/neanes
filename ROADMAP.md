# Roadmap

## Must-haves

- Better error handling

## Must-haves but lower priority

- The app is currently very slow when there are many pages. Add a way to view one page at a time with backwards/forwards buttons. Also figure out how to improve the speed for many pages.

## Nice-to-haves

- Custom Martyrias (is this really necessary?)
- Advanced neumes (connecting heteron, ties, et al)
- Header Images
- Headers/Footers/Page Numbers
- Configurable Neume Keyboard
- Better styling
- Right-align option for tempo
- Right align for multiple elements grouped together (e.g. tempo followed by martyria). Does this maybe become a "paragraph option", where a paragraph can consist of neumes, small text-boxes that fit to the width of their contents, and have an alignment?
- Fix neume justification routine when a text box is entered in the middle of a line
- Score checker that points out potential issues by using Fr. Ephraim's style rules (and other sources).
- Investigate the feasibility of image recognition, allowing users to upload an image of a score that would be transformed into a file in our program.

## Tech Debt

- Need to explicitly map between save file neumes and view model neumes. This will prevent errors due to mismatched or missing neumes in the save model.

- All editor elements should probably be their own components.
