// Tiny static server for dist/ (no dependencies):  npm run preview
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

export function serve(port = 4173, host = '127.0.0.1') {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      let rel = decodeURIComponent(url.pathname);
      if (rel.endsWith('/')) rel += 'index.html';
      let file = path.join(ROOT, rel);
      if (!file.startsWith(ROOT)) {
        res.statusCode = 403;
        return res.end('forbidden');
      }
      let info = await stat(file).catch(() => null);
      if (info?.isDirectory()) {
        res.writeHead(301, { location: `${url.pathname}/` });
        return res.end();
      }
      if (!info) {
        file = path.join(ROOT, '404.html');
        res.statusCode = 404;
      }
      res.setHeader('content-type', TYPES[path.extname(file)] ?? 'application/octet-stream');
      res.setHeader('cache-control', 'no-store');
      res.end(await readFile(file));
    } catch (err) {
      res.statusCode = 500;
      res.end(String(err.message));
    }
  });
  server.listen(port, host, () => console.log(`preview: http://${host}:${port}/`));
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  serve(Number(process.env.PORT) || 4173);
}
