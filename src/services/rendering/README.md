# Layout ownership

`LayoutService.processPages` assigns footnote labels in score order and prepares score lines and footnote bodies. The page builder
fits prepared lines into pages and reserves space for whole footnote bodies on
their anchor page. It accounts for explicit page breaks, drop-cap continuation
lines, and measured header and footer reservations before content is positioned.

Fill-width inline rich text takes the remaining width after musical line
breaking, up to a following right-aligned martyria or the end of the line.
Footnote body gutters are fixed at 2.2 times the body marker font size (a 1.8em
marker area plus a 0.4em gap). Long labels can extend outward from the gutter.

Pagination reserves header and footer overflow before the first line is added
to a page. This uses ordinary header and footer selection because chapter
opening status is resolved after the page's content is known.

# Measurement

The live editor uses its debounced DOM height callbacks. Existing automation
and export measurement paths also measure footnote bodies at their natural
height, including rich text with a stored scrollable setting. Each reconciliation
retains the largest observed height for repeated header and footer templates.
In scores with footnotes it also retains the largest measured height for
page-capped main-score rich text at the current width, so moving to a smaller
page cap cannot move the box back again.

Oversized footnotes remain editable. Settled page discovery and visual export
reject pages with footnote overflow.
