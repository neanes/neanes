# Layout ownership

`LayoutService.processPages` prepares line dimensions and footnote bodies, calls
`buildContentPages`, then positions main content and bottom-aligned footnotes.
The page builder accepts only prepared heights, footnote IDs, explicit breaks,
drop-cap continuation requirements, and measured page reservations. It returns
line membership and offsets, whole-footnote ownership, and overflow. It does not
measure DOM content, position score elements, or read previous element pages.

Inline rich-text marker widths are measured before page selection. Continuous,
section, and custom labels use their rendered width. For page restart, each
automatic marker fits the widest rendered label through its ordinal since the
last explicit page break. Final labels come from the new page assignments and
render left-aligned in those slots. Body gutters are fixed at 2.2 times the body
marker font size (a 1.8em marker area plus a 0.4em gap). Labels align against the
body boundary and may extend outward for long markers.

Header/footer overflow reservations retain the existing timing: a reservation
is frozen before the first line is added to its physical page. At that point the
page has no chapter marker, so the reservation uses ordinary header/footer
selection. Rendering can still select chapter-opening headers for completed
pages. This refactor does not change that limitation.

# Measurement

Editor automation, private workers, and visual exports use
`LayoutReconciliation` to repeat layout and DOM measurement until the measured
heights settle. Each operation retains the largest height for repeated
header/footer templates and for page-capped main-score rich-text boxes at their
current width. This lets a box grow after moving to a page with a larger cap and
prevents a smaller cap from moving it back. Footnote bodies use natural height,
including rich-text boxes with a stored scrollable setting.

Settlement rejects stale measurements and fails on the twelfth changed pass.
The measurement and rendering lifecycles handle cancellation. Overflow remains
editable and visual export validation rejects it.

The live editor retains its debounced DOM height callbacks.
