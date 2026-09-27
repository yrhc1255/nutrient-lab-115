const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const html = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1];
const css = html.match(/<style>([\s\S]*)<\/style>/)?.[1];
assert.ok(script && css, 'Inline JavaScript and CSS must exist');
new vm.Script(script);
assert.equal((html.match(/<script[^>]+src=/g) || []).length, 0, 'No external scripts');
assert.equal((html.match(/<link[^>]+stylesheet/g) || []).length, 0, 'No external stylesheets');
assert.equal((css.match(/@import/g) || []).length, 0, 'No CSS imports');
assert.equal((script.match(/["'`]\/art\//g) || []).length, 0, 'No server-root image references');
assert.equal(html.includes('這位同學的作答紀錄'), false, 'Removed teacher panel must stay removed');
for (const name of ['home', 'guide', 'lesson', 'game', 'reading', 'results']) {
  const png = fs.readFileSync(path.resolve(__dirname, '../public/art', `${name}-reference.png`)).toString('base64');
  assert.ok(html.includes(png), `${name} original image embedded`);
}
console.log('PASS: inline JavaScript parses, styles are bundled, all 6 image assets embedded, no external asset tags or /art paths, corrected teacher mode included.');
console.log(`File size: ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(1)} MB`);
