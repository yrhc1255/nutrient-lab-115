// Build a file:// compatible, self-contained course from the same React source.
const fs = require('node:fs/promises');
const path = require('node:path');
const ts = require('typescript');
const { webpack } = require('next/dist/compiled/webpack/webpack');
const postcss = require('postcss');
const tailwind = require('@tailwindcss/postcss');

async function main() {
  const project = path.resolve(__dirname, '..');
  const app = path.join(project, 'app');
  const work = path.join(project, '.offline-build');
  await fs.mkdir(work, { recursive: true });
  const art = {};
  for (const name of ['home', 'guide', 'lesson', 'game', 'reading', 'results']) {
    art[name] = 'data:image/png;base64,' + (await fs.readFile(path.join(project, 'public', 'art', `${name}-reference.png`))).toString('base64');
  }
  const modules = ['course-app', 'course-art', 'course-data', 'course-state', 'course-questions', 'course-explorations', 'course-games', 'design-elements', 'score-sync', 'score-sync-panel', 'sync-config'];
  for (const name of modules) {
    const filename = name + (['course-data', 'course-state', 'score-sync', 'sync-config'].includes(name) ? '.ts' : '.tsx');
    let source = await fs.readFile(path.join(app, filename), 'utf8');
    if (name === 'course-art') {
      const original = 'src={`/art/${f.src}-reference.png`}';
      if (!source.includes(original)) throw new Error('Image source format changed; update offline asset mapping.');
      source = source.replace(original, 'src={OFFLINE_ART[f.src]}');
      source += '\nconst OFFLINE_ART: Record<string, string> = ' + JSON.stringify(art) + ';\n';
    }
    if (name === 'design-elements') {
      const original = 'href="/art/game-reference.png"';
      if (!source.includes(original)) throw new Error('Game source format changed; update offline asset mapping.');
      source = source.replace(original, 'href={' + JSON.stringify(art.game) + '}');
    }
    const output = ts.transpileModule(source, { fileName: filename, compilerOptions: {
      target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX,
    }}).outputText;
    await fs.writeFile(path.join(work, name + '.js'), output, 'utf8');
  }
  await fs.writeFile(path.join(work, 'entry.js'), "import {createRoot} from 'react-dom/client';\nimport {createElement} from 'react';\nimport CourseApp from './course-app';\ncreateRoot(document.getElementById('root')).render(createElement(CourseApp));\n");
  await new Promise((resolve, reject) => {
    const compiler = webpack({
      mode: 'production', target: ['web', 'es2020'], context: project,
      entry: path.join(work, 'entry.js'), output: { path: work, filename: 'course.bundle.js' },
      devtool: false, optimization: { minimize: false, splitChunks: false, runtimeChunk: false },
      performance: { hints: false },
    });
    compiler.run((error, stats) => compiler.close(closeError => {
      if (error || closeError) return reject(error || closeError);
      if (stats.hasErrors()) return reject(new Error(stats.toString({ all: false, errors: true })));
      resolve();
    }));
  });
  const css = await postcss([tailwind({ base: app, optimize: true })]).process(
    await fs.readFile(path.join(app, 'course.css'), 'utf8'), { from: path.join(app, 'course.css') }
  );
  const styles = css.css + '\n' + await fs.readFile(path.join(app, 'faithful-design.css'), 'utf8');
  const script = (await fs.readFile(path.join(work, 'course.bundle.js'), 'utf8')).replace(/[\t ]+$/gm, '');
  // Inline both assets and runtime: no module imports, fetches, or server needed.
  const html = '<!doctype html>\n<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>食物中的養分與能量｜離線試用版</title><style>' + styles.replace(/<\/style/gi, '<\\/style') + '</style></head><body><div id="root"><p style="padding:30px">正在打開養分研究所……</p></div><noscript>請啟用瀏覽器 JavaScript，才能操作課程。</noscript><script>' + script.replace(/<\/script/gi, '<\\/script') + '</script></body></html>\n';
  const destination = path.join(project, '..', 'index.html');
  await fs.writeFile(destination, html, 'utf8');
  console.log(`Created ${destination} (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(1)} MB)`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
