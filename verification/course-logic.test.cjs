const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const cache={};
function load(name){if(cache[name])return cache[name];const filename=path.resolve(__dirname,'../app',name+'.ts');const output=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const exports={};new Function('require','exports',output)(id=>load(id.replace('./','')),exports);cache[name]=exports;return exports;}
const D=load('course-data'),S=load('course-state');
function completePage(s,p){
 if(p.id==='home')return {...s,started:true};
 if(['assessment','game','challenge'].includes(p.kind))return {...s,activities:{...s.activities,[p.id]:[{score:0,answers:[],correct:[],at:'2026-09-27T00:00:00Z'}]}};
 s={...s,explored:[...s.explored,p.id]};
 for(const q of p.questions||[])s=S.recordAnswer(s,q,q.kind==='short'?['支持本次檢出澱粉，不推論其他養分']:q.fields?q.fields.map(f=>f.answer):q.answer,q.kind==='short'?null:true,q.id);
 return s;
}
test('17 頁依序解鎖：完成本頁只開放下一頁；全部完成後開成果',()=>{
 let s=S.fresh();
 for(let i=0;i<D.PAGES.length;i++){
  for(let j=0;j<D.PAGES.length;j++)assert.equal(S.canAccessPage(s,D.PAGES[j].id),j<=i,`${i}: ${D.PAGES[j].id}`);
  assert.equal(S.resolvePage(s,'results'),D.PAGES[i].id);
  s=completePage(s,D.PAGES[i]);
 }
 assert.equal(S.canAccessPage(s,'results'),true);
});
test('不能利用後段舊紀錄或網址跳過尚未完成的前頁',()=>{
 let s=S.fresh();s.started=true;s=completePage(s,D.PAGES.find(p=>p.id==='iodine'));
 assert.equal(S.canAccessPage(s,'benedict'),false);
 assert.equal(S.resolvePage(s,'benedict'),'guide');
 global.localStorage={getItem:()=>JSON.stringify(s)};
 assert.equal(S.resolvePage(S.readLocal(),'results'),'guide');
 assert.equal(S.resolvePage(s,'unknown'),'home');
});
test('探索與答題都必要；閱讀簡答待確認可前進但不加分或標精熟',()=>{
 const p=D.PAGES.find(p=>p.id==='nutrients');let s=S.fresh();
 for(const q of p.questions)s=S.recordAnswer(s,q,q.fields?q.fields.map(f=>f.answer):q.answer,true,q.id);
 assert.equal(S.pageReadyForNext(s,p.id),false);
 s.explored.push(p.id);assert.equal(S.pageReadyForNext(s,p.id),true);
 delete s.answers[p.questions[0].id];assert.equal(S.pageReadyForNext(s,p.id),false);
 const reading=D.PAGES.find(p=>p.id==='reading');s=completePage(S.fresh(),reading);
 assert.equal(S.pageReadyForNext(s,'reading'),true);assert.equal(S.pageComplete(s,'reading'),false);
 assert.equal(s.answers['R01-5'].points,0);assert.equal(s.answers['R01-5'].pending,true);
 s.answers['R01-5'].answer=['  '];assert.equal(S.pageReadyForNext(s,'reading'),false);
});
test('教師狀態才可略過進度；退出或重新載入後恢復學生限制',()=>{
 const s=S.fresh();for(const p of D.PAGES)assert.equal(S.canAccessPage(s,p.id,true),true);
 assert.equal(S.resolvePage(s,'results',true),'results');
 assert.equal(S.resolvePage(s,'results',false),'home');
 assert.equal(S.canAccessPage(s,'invalid',true),false);
 global.localStorage={getItem:()=>JSON.stringify(s)};
 assert.equal(S.resolvePage(S.readLocal(),'results'),'home');
});
test('核定的頁數、題數、識別碼與遊戲回合完整',()=>{assert.equal(D.PAGES.length,17);assert.equal(new Set(D.PAGES.map(p=>p.id)).size,17);const practice=D.PAGES.filter(p=>['lesson','reading'].includes(p.kind));assert.equal(practice.length,8);assert.ok(practice.every(p=>p.questions.length===5));const assessments=D.PAGES.filter(p=>p.kind==='assessment');assert.equal(assessments.length,2);assert.ok(assessments.every(p=>p.questions.length===10));const all=D.PAGES.flatMap(p=>p.questions||[]);assert.equal(all.length,60);assert.equal(new Set(all.map(q=>q.id)).size,60);assert.equal(all.filter(q=>q.kind==='short').length,1);assert.equal(D.GAME_ONE.length,6);assert.equal(D.GAME_TWO.length,6);assert.equal(D.CHALLENGE.length,12);});
test('59 題自動批改題都能以內容判正確；空白不通過',()=>{for(const q of D.PAGES.flatMap(p=>p.questions||[]).filter(q=>q.kind!=='short')){const answer=q.fields?q.fields.map(f=>f.answer):q.answer;assert.ok(D.grade(q,answer),q.id);assert.equal(D.grade(q,[]),false,q.id);if(q.options)assert.ok(q.answer.every(a=>q.options.includes(a)),q.id);}});
test('複選拒絕遺漏、多選、重複選項；排序不能倒置',()=>{const q=D.L01.find(q=>q.kind==='multi');assert.equal(D.grade(q,q.answer.slice(1)),false);assert.equal(D.grade(q,[...q.answer,'不存在的選項']),false);assert.equal(D.grade(q,Array(q.answer.length).fill(q.answer[0])),false);assert.equal(D.grade(q,[...q.answer].reverse()),true);const sort=D.L04.find(q=>q.kind==='sort');assert.equal(D.grade(sort,[...sort.answer].reverse()),false);});
test('3/2/1 分、不額外扣分，正確後不可重複得分',()=>{for(let misses=0;misses<5;misses++){let s=S.fresh();for(let i=0;i<misses;i++)s=S.recordAnswer(s,D.L01[0],['錯誤'],false,`miss-${i}`);assert.equal(S.totalPoints(s),0);s=S.recordAnswer(s,D.L01[0],['正確'],true,'correct');assert.equal(s.answers[D.L01[0].id].points,Math.max(1,3-misses));const repeat=S.recordAnswer(s,D.L01[0],['正確'],true,'another');assert.equal(repeat,s);assert.equal(s.events.length,misses+1);}});
test('刷新持久化保留錯誤嘗試、去重事件；新身份不攜分',()=>{let s=S.fresh({classroom:'測試',seat:'0',name:'測試甲'});s=S.recordAnswer(s,D.L01[0],['wrong'],false,'a');assert.equal(S.recordAnswer(s,D.L01[0],['wrong'],false,'a'),s);global.localStorage={getItem:()=>JSON.stringify(s)};const loaded=S.readLocal();assert.equal(loaded.answers[D.L01[0].id].attempts,1);assert.equal(S.recordAnswer(loaded,D.L01[0],['right'],true,'b').answers[D.L01[0].id].points,2);const next=S.fresh({classroom:'測試',seat:'1',name:'測試乙'});assert.equal(S.totalPoints(next),0);assert.deepEqual(next.events,[]);assert.deepEqual(next.activities,{});});
test('簡答原文保留、零分待確認；不誤標全課精熟',()=>{let s=S.fresh();for(const p of D.PAGES.filter(p=>['lesson','reading'].includes(p.kind))){s.explored.push(p.id);for(const q of p.questions)s=S.recordAnswer(s,q,q.kind==='short'?['原文：不是沒有其他物質']:q.fields?q.fields.map(f=>f.answer):q.answer,q.kind==='short'?null:true,q.id);}assert.equal(S.totalPoints(s),117);assert.equal(s.answers['R01-5'].pending,true);assert.equal(s.answers['R01-5'].answer[0],'原文：不是沒有其他物質');assert.equal(S.pageComplete(s,'reading'),false);assert.equal(S.pageComplete(s,'iodine'),true);});
test('不完整或損壞的本機資料可安全開啟',()=>{for(const value of ['broken','null','{}',JSON.stringify({...S.fresh(),version:1})]){global.localStorage={getItem:()=>value};assert.deepEqual(S.readLocal(),S.fresh());}});
