// Build from the target checkout. Inject the same test-only capture into both
// editor versions, at publication before visibility and measured heights change.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const { build } = await import(pathToFileURL(require.resolve('vite')).href);

function captureLayout(workspace, pages) {
  const path = workspace.filePath;
  const previous = window.__neanesParitySnapshot;
  const generated = window.__neanesParityGenerated;
  if (generated ? previous : !path || previous?.path === path) {
    return;
  }
  const { score } = workspace;
  const elements = [
    ...score.staves.flatMap((staff) => staff.elements),
    ...score.headersAndFooters,
  ];
  const positions = new Map(elements.map((element, index) => [element, index]));
  const encode = (_, value) => {
    if (positions.has(value)) {
      return { $element: positions.get(value) };
    }
    if (typeof value === 'number' && !Number.isFinite(value)) {
      return { $number: String(value) };
    }
    return value;
  };
  window.__neanesParitySnapshot = {
    path,
    records: [
      JSON.stringify(pages, encode),
      ...elements.map((element) => JSON.stringify({ ...element }, encode)),
    ],
  };
}

await build({
  plugins: [
    {
      name: 'layout-parity-capture',
      enforce: 'pre',
      transform(source, id) {
        if (id.endsWith('/src/utils/TestFileGenerator.ts')) {
          // Random uses UUIDs as lyrics. Supply deterministic UUID-shaped text
          // without changing its lengths or replacing the generator.
          const randomLyric = 'note.lyrics = uuidv4();';
          assert.ok(source.includes(randomLyric), 'Missing random test lyric');
          return source.replace(
            randomLyric,
            "note.lyrics = '00000000-0000-4000-8000-' + ((i + 1) * 2654435761 >>> 0).toString(16).padStart(12, '0');",
          );
        }
        if (!id.endsWith('/src/components/TheEditor.vue')) {
          return;
        }
        const entry = /function publishLayout\([\s\S]*?\n\) \{\n/;
        assert.match(source, entry, 'Missing parity capture point');
        return source.replace(
          entry,
          (signature) =>
            signature +
            `  (${captureLayout})(toRaw(selectedWorkspace.value), processedPages);\n`,
        );
      },
    },
  ],
});
