# Rendering regressions

Build the Electron target with `npx vite build`, then run:

```sh
node tests/integration/rendering/background-pdf-smoke.mjs /absolute/output/directory
```

The script launches real Electron renderers using a temporary profile. It checks
concurrent PDF output, rich-text readiness, snapshot immutability, cancellation,
owner closure, failure cleanup, and successful export after failure. Output PDFs
are retained for visual inspection. No MCP server, mocks, or DOM emulation is used.

The settling regression starts with incorrect saved heights for plain text,
rich text, and repeated multipanel footers. It checks actual DOM geometry at the
export readiness boundary, two-page reflow, page-number tokens, and footer
non-overlap. It then exports snapshots with measured and excessively large saved
heights through the PDF exporter and compares their native PDF drawing commands.
The three `settling-*.pdf` files and `settling-geometry.json` are retained. This
check uses readiness signals rather than fixed delays and needs no PDF utilities.

The same run exports PNGs from real hidden renderers, checking page selection,
empty ranges, 96/192 DPI dimensions, transparent and opaque backgrounds, visible
rich-text/RTL content, partial cancellation, file-write failure and recovery, and
snapshot immutability. PNG artifacts are retained beside the PDFs.

Native-print checks verify settled page geometry, canonical zoom, document title,
parent-window association, source snapshot preservation, and renderer cleanup.
`native-print-prepared.pdf` captures the prepared pages without sending a print
job. Unit tests cover named paper and inch-to-micron conversion for custom and
half-size paper.

Before merging, also check the real native print dialog: preview, paper size,
orientation, cancellation/retry, and a physical print or system Save as PDF.
Leave the dialog open for more than 45 seconds to verify that choosing printer
settings is not subject to the rendering deadline. PNG overwrite, skip, and
cancel prompts should retain their existing behavior.

On macOS, agents must run this command outside their command sandbox, as described
in AGENTS.md. It does not disable Electron's security sandbox.
