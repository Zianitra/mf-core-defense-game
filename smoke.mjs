// Dev-only smoke test: plays the real loop with scripted input and checks determinism.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve('game');
const MIME = { '.html': 'text/html', '.js': 'text/javascript' };
const server = createServer((q, r) => {
  let p = q.url.split('?')[0];
  if (p.endsWith('/')) p += 'index.html';
  const f = resolve(join(root, normalize(p)));
  try { statSync(f); } catch { r.writeHead(404).end(); return; }
  r.writeHead(200, { 'content-type': MIME[extname(f)] ?? 'application/octet-stream' });
  r.end(readFileSync(f));
});
await new Promise((ok) => server.listen(8125, '127.0.0.1', ok));

const exe = process.env.HOME + '/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message));

await page.goto('http://127.0.0.1:8125/index.html?seed=7');
await page.waitForTimeout(600);
// Click to start (audio unlock path exercises without a real device).
await page.mouse.click(640, 360);
await page.waitForTimeout(1500);
let state = await page.evaluate(() => document.getElementById('status').textContent);
console.log('after click:', state);
// Arrow key steering for 2 seconds.
await page.keyboard.down('ArrowRight');
await page.waitForTimeout(1500);
await page.keyboard.up('ArrowRight');
// Mouse steering.
await page.mouse.move(1000, 200);
await page.waitForTimeout(300);
await page.mouse.move(300, 550);
await page.waitForTimeout(400);
// Pause and resume.
await page.keyboard.press('KeyP');
await page.waitForTimeout(300);
console.log('paused text:', await page.evaluate(() => document.getElementById('status').textContent));
await page.screenshot({ path: '/tmp/shot-paused.jpg', type: 'jpeg' });
await page.keyboard.press('KeyP');
await page.waitForTimeout(25000);
console.log('after 25s play:', await page.evaluate(() => document.getElementById('status').textContent));
// Restart instantly with Space.
await page.keyboard.press('Space');
await page.waitForTimeout(500);
console.log('after restart:', await page.evaluate(() => document.getElementById('status').textContent));

// Determinism: two identical staged shots must give identical canvases.
async function hashOf(query) {
  const p2 = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await p2.goto('http://127.0.0.1:8125/index.html' + query);
  await p2.waitForFunction('window.__shotReady === true');
  const h = await p2.evaluate(() => {
    const c = document.getElementById('game');
    const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let acc = 0;
    for (let i = 0; i < data.length; i += 997) acc = (acc * 31 + data[i]) | 0;
    return String(acc);
  });
  await p2.close();
  return h;
}
const a = await hashOf('?shot=play&seed=42');
const b = await hashOf('?shot=play&seed=42');
const c = await hashOf('?shot=play&seed=43');
console.log('determinism same-seed:', a === b, 'diff-seed differs:', a !== c);

await browser.close();
server.close();
console.log('smoke test done');
