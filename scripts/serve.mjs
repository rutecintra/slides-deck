import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const args = process.argv.slice(2);
const value = (flag, fallback) => args.includes(flag) ? args[args.indexOf(flag) + 1] : fallback;
const host = value('--host','0.0.0.0');
const port = Number(value('--port','3000'));
const root = process.cwd();
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpeg':'image/jpeg','.jpg':'image/jpeg'};
http.createServer(async (request,response) => {
 try {
  const pathname = decodeURIComponent(new URL(request.url,'http://localhost').pathname);
  let path = resolve(root, '.' + pathname);
  if (path !== root && !path.startsWith(root + sep)) throw new Error('Invalid path');
  if ((await stat(path)).isDirectory()) {
   if (!pathname.endsWith('/')) { response.writeHead(302,{Location:pathname+'/'}); response.end(); return; }
   path = resolve(path,'index.html');
  }
  response.writeHead(200,{'Content-Type':mime[extname(path)] || 'application/octet-stream','Cache-Control':'no-store'});
  response.end(await readFile(path));
 } catch { response.writeHead(404); response.end('Not found'); }
}).listen(port,host,()=>console.log(`Preview available at http://${host}:${port}`));
