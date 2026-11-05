# Layout ownership

`LayoutService.processPages` prepares line dimensions and footnote bodies, calls
`buildContentPages`, then positions main content and bottom-aligned footnotes.
The page builder accepts only prepared heights, footnote IDs, explicit breaks,
drop-cap continuation requirements, and measured page reservations. It returns
line membership and offsets, whole-footnote ownership, and overflow. It does not
measure DOM content, position score elements, or read previous element pages.

Footnote preparation uses an explicit snapshot of the previous pass's reference
page assignments. Final numbering uses assignments produced by the new page
selection. `orderedFootnotes` retains its current-page default for UI and
discovery callers. Numbering changes can request another pass for rich-text
references. Body gutters are fixed at 2.2 times the body marker font size (a 1.8em marker
area plus a 0.4em gap), independent of marker labels and page assignments.
Labels align against the body boundary and may extend outward for long markers.
This removes numbering-dependent body widths without changing the fit policy.

Header/footer overflow reservations retain the existing timing: a reservation
is frozen before the first line is added to its physical page. At that point the
page has no chapter marker, so the reservation uses ordinary header/footer
selection. Rendering can still select chapter-opening headers for completed
pages. This refactor does not change that limitation.

# Measurement and retries

`layoutReservations` owns operation-scoped maximum inline widths for boxes with
footnote references, measured heights at matching widths in documents with
footnotes. Content, font, page setup, and paragraph style
changes invalidate those reservations. Live typing can release an owner's
height maximum so content can shrink. Documents without footnotes accept shrinking
body measurements; explicit settlement retains only header/footer template maxima,
as before footnote support.

`WorkspaceLayoutSettlement` starts a fresh explicit operation and shares
supersession checks and `LayoutReconciliation` between `settleWorkspace` (workers
and automation) and `SettledScorePages` (print and visual exports). Reconciliation
aggregates repeated template measurements, rejects stale widths, checks pending
marker work, and retains the existing limit of 12 changed passes.
Cancellation remains with each caller's measurement/render lifecycle.

The editor's `save` and text-height callbacks remain event-driven and debounced.
They share reservation storage and pending-marker bookkeeping with explicit
settlement, but do not synchronously measure the DOM or adopt the explicit pass
limit. Combining their execution loops would require changing live component
measurement, focus, and rendering lifecycles. Overflow remains editable; visual
export validation continues to reject it.
