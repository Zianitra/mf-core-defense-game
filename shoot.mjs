// Dev-only helper (not part of the entry): renders the ?shot= scenes headlessly and saves
// screenshots/1-start.jpg, 2-play.jpg, 3-end.jpg.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve('game');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = resolve(join(root, normalize(p)));
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  try { statSync(file); } catch { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((ok) => server.listen(8123, '127.0.0.1', ok));

const exe = process.env.HOME + '/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE:', m.text()); });

const shots = [
  ['1-start.jpg', '?shot=start&seed=1'],
  ['2-play.jpg', '?shot=play&seed=1'],
  ['3-late.jpg', '?shot=late&seed=1'],
  ['4-end.jpg', '?shot=end&seed=1'],
];
for (const [name, query] of shots) {
  await page.goto('http://127.0.0.1:8123/index.html' + query);
  await page.waitForFunction('window.__shotReady === true', { timeout: 30000 });
  await page.screenshot({ path: 'screenshots/' + name, type: 'jpeg', quality: 85 });
  console.log('wrote screenshots/' + name);
}
await browser.close();
server.close();
