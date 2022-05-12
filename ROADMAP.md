# Roadmap

## Nice-to-haves

- Custom Martyrias (is this really necessary?)
- Advanced neumes (e.g. ties)
- Header Images
- Headers/Footers/Page Numbers
- Configurable Neume Keyboard
- Better styling
- Right-align option for tempo
- Right align for multiple elements grouped together (e.g. tempo followed by martyria). Does this maybe become a "paragraph option", where a paragraph can consist of neumes, small text-boxes that fit to the width of their contents, and have an alignment?
- Fix neume justification routine when a text box is entered in the middle of a line
- Score checker that points out potential issues by using Fr. Ephraim's style rules (and other sources).
- Investigate the feasibility of image recognition, allowing users to upload an image of a score that would be transformed into a file in our program.
- Export to HTML

## Tech Debt

- Need to explicitly map between save file neumes and view model neumes. This will prevent errors due to mismatched or missing neumes in the save model.

- All editor elements should probably be their own components.
