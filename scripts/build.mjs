import { mkdir, rm, cp } from 'node:fs/promises';
await rm('dist', { recursive:true, force:true });
await mkdir('dist');
for (const path of ['index.html','assets','decks']) await cp(path, `dist/${path}`, {recursive:true});
await cp('.nojekyll','dist/.nojekyll');
console.log('Static website built in dist/');
