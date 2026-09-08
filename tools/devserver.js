/* ============================================================================
 * tools/devserver.js - Optional. Serves the app over http for development.
 * ---------------------------------------------------------------------------
 * EN: You do NOT need this to use the calculator - it runs from a file, which
 *     is the whole point. This exists only because browser developer tools are
 *     easier to use over http://, and because some browsers restrict what a
 *     file:// page may do.
 *
 *         node tools/devserver.js          then open http://localhost:8733/
 *
 * RU: Для работы калькулятора это НЕ нужно - он запускается из файла, в этом
 *     весь смысл. Скрипт нужен только для разработки: инструменты разработчика
 *     удобнее по http://, и некоторые браузеры ограничивают страницы file://.
 *
 *         node tools/devserver.js          затем откройте http://localhost:8733/
 * ==========================================================================*/
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 8733;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8'
};

http.createServer((req, res) => {
  let p = decodeURIComponent(url.parse(req.url).pathname);

  // Redirect rather than serve index.html at "/", so the page's relative
  // script and stylesheet paths resolve against /app/ the same way they do
  // when the file is opened directly.
  if (p === '/' || p === '') {
    res.writeHead(302, { Location: '/app/index.html' });
    res.end();
    return;
  }
  if (p === '/app' || p === '/app/') p = '/app/index.html';

  // Keep the server inside the project, whatever the request says.
  const full = path.join(ROOT, path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
  if (!full.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.readFile(full, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found: ' + p);
      return;
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(full).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log('Vic3 Calculator dev server: http://localhost:' + PORT + '/');
  console.log('(the app itself needs no server - this is only for devtools)');
});
