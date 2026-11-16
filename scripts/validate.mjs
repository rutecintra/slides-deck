import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const expected = {'sip-ai-workshop':29,'early-childhood':27};
for (const [name,count] of Object.entries(expected)) {
 const directory = `decks/${name}`;
 const deck = JSON.parse(await readFile(`${directory}/deck.json`,'utf8'));
 assert.equal(deck.id,name); assert.equal(deck.slides.length,count);
 assert.equal(new Set(deck.slides.map(slide=>slide.id)).size,count);
 for (const slide of deck.slides) {
  if (slide.video) assert(/^[A-Za-z0-9_-]{11}$/.test(slide.video.youtubeId), `${slide.id}: invalid video ID`);
  assert(slide.title && slide.html && slide.notes.length, `${slide.id}: incomplete content`);
  assert(!/<script\b|\bon\w+\s*=/i.test(slide.html), `${slide.id}: unexpected inline script`);
  for (const [,path] of slide.html.matchAll(/src=["']([^"']+)["']/g)) if (!/^(https?:|data:)/.test(path)) await access(`${directory}/${path}`);
 }
 await access(`${directory}/index.html`); await access(`${directory}/theme.css`);
 console.log(`${name}: ${count} slides with notes and valid local assets`);
}
const workshop = JSON.parse(await readFile('decks/sip-ai-workshop/deck.json','utf8'));
assert(workshop.slides[19].notes.some(note=>note.html?.includes('Ocultação')), 'Slide 20 examples must be preserved');
for (const file of ['assets/player.js','assets/library.js']) execFileSync(process.execPath,['--check',file]);
console.log('JavaScript syntax and content integrity checks passed');
