# Layout ownership

`LayoutService.processPages` prepares line dimensions and footnote bodies, calls
`buildContentPages`, then positions main content and bottom-aligned footnotes.
The page builder works with prepared heights, footnote IDs, explicit and
remembered breaks, drop-cap continuation requirements, and measured page
reservations. It returns line membership, offsets, and whole-footnote ownership,
and reports overflow and the lines that triggered it.

Fill-width inline rich text takes the remaining width after musical line
breaking, up to a following right-aligned martyria or the end of the line.
Rich-text reference widths come from the labels assigned to the current pages.
Body gutters are fixed at 2.2 times the body marker font size (a 1.8em marker
area plus a 0.4em gap). Labels align against the body boundary and may extend
outward for long markers.

Page fitting uses the appropriate header and footer reservations for ordinary
and chapter-opening pages. It accounts for the first chapter marker in each
candidate group before placing those lines.

# Measurement

The editor, private worker, and visual exports use
`WorkspaceLayoutSettlement` to repeat layout and DOM measurement. Eligible
page-restarted references start with fresh heights and widths based on the
starting label. Once that geometry settles, each pass uses the widths of its
assigned labels. When measured growth among elements sharing a page in the
previous pass causes an overflow break, settlement remembers the first score
element of the movable line or group. It retains the
break even if a subsequent label is narrower and clears it after publication.
`LayoutReconciliation` applies the measured heights. Each operation retains the
largest height for repeated header/footer templates. In scores with footnotes,
it also retains the largest height for page-capped main-score rich-text boxes
at their current box and marker widths. This lets a box grow after moving to
a page with a larger cap. In footnote-free scores, main-score boxes can shrink
between passes. Footnote bodies use natural height, including rich-text boxes
with a stored scrollable setting.

Settlement rejects stale measurements and fails on the twelfth changed pass.
The measurement and rendering lifecycles handle cancellation. Overflow remains
editable and visual export validation rejects it.

The live editor measures eligible page-restarted layouts offscreen and
publishes only the settled result. Other live layouts retain their debounced
DOM height callbacks.
