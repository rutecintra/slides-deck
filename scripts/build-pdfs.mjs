import { execFile } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const printStyles = `
  @page { size: 1600px 900px; margin: 0; }
  html { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  body { margin: 0; }
  .print-page { width: 1600px; height: 900px; overflow: hidden; break-inside: avoid; }
  .print-page + .print-page { break-before: page; }
  .video-slide .body { align-self: center; margin-top: 0; }
  .pdf-video-link { display: block; margin-top: 24px; color: inherit; font-size: 24px; }
`;

export async function buildPdfs() {
  const temporary = await mkdtemp(join(tmpdir(), 'slide-pdf-'));
  const browser = process.env.PDF_BROWSER || 'google-chrome';
  try {
    for (const entry of await readdir('dist/decks', { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const directory = resolve('dist/decks', entry.name);
      const [source, theme] = await Promise.all([
        readFile(join(directory, 'deck.json'), 'utf8'),
        readFile(join(directory, 'theme.css'), 'utf8'),
      ]);
      const deck = JSON.parse(source);
      const slides = deck.slides.map(slide => {
        const content = slide.video
          ? slide.html.replace('</p></div></div><div class="folio">', `</p><a class="pdf-video-link" href="https://www.youtube.com/watch?v=${slide.video.youtubeId}">Assistir no YouTube ↗</a></div></div><div class="folio">`)
          : slide.html;
        return `<div class="print-page">${content}</div>`;
      });
      const html = join(temporary, `${entry.name}.html`);
      await writeFile(html, `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><base href="${pathToFileURL(directory + '/')}"><style>${theme}\n${printStyles}</style></head><body>${slides.join('')}</body></html>`);
      await run(browser, [
        '--headless', '--no-sandbox', '--disable-dev-shm-usage',
        '--allow-file-access-from-files', '--no-pdf-header-footer',
        `--user-data-dir=${join(temporary, 'profile')}`,
        `--print-to-pdf=${join(directory, 'slides.pdf')}`,
        pathToFileURL(html).href,
      ], { timeout: 60000 });
      console.log(`Generated ${entry.name}/slides.pdf`);
    }
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
