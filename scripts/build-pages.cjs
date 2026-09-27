const fs=require('node:fs');const path=require('node:path');const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
execFileSync(process.execPath,[path.join(__dirname,'build-offline.cjs')],{cwd:root,stdio:'inherit'});
fs.mkdirSync(path.join(root,'docs'),{recursive:true});
const html=fs.readFileSync(path.join(root,'..','index.html'),'utf8').replace('食物中的養分與能量｜離線試用版','食物中的養分與能量｜養分研究所');
fs.writeFileSync(path.join(root,'docs','index.html'),html);fs.writeFileSync(path.join(root,'docs','.nojekyll'),'');
console.log('GitHub Pages files ready in docs/');
