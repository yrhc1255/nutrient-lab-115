const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
const context=vm.createContext({});vm.runInContext(fs.readFileSync('gas/Code.gs','utf8')+'\nthis.api={validate_,merge_,studentKey_,text_,challengeLeaders_,doGet};',context);const api=context.api;
function payload(){return {courseId:'nutrient-lab-115',eventId:'test-event-0001',sessionId:'test-session-001',revision:1,identity:{classroom:'測試',seat:'1',name:'測試同學'},scores:{assessmentOne:80,assessmentTwo:null,gameOne:40,gameOneBest:50,gameTwo:null,gameTwoBest:null,challenge:2000,learning:3},completed:1,shortAnswer:''};}
test('GAS 驗證分數範圍、身分與課程代碼',()=>{assert.ok(api.validate_(payload()));for(const change of [{courseId:'other'},{identity:{classroom:'',seat:'1',name:'A'}},{scores:{...payload().scores,learning:118}},{scores:{...payload().scores,challenge:60001}},{revision:0}])assert.throws(()=>api.validate_({...payload(),...change}));});
test('首次評量保留、遊戲最高分提高、未作答欄位不變成零',()=>{const p=payload();const first=api.merge_(null,p);const next=api.merge_(first,{...p,revision:2,scores:{...p.scores,assessmentOne:100,gameOne:60,gameOneBest:60,challenge:1000,learning:6}});assert.equal(next.scores.assessmentOne,80);assert.equal(next.scores.gameOne,40);assert.equal(next.scores.gameOneBest,60);assert.equal(next.scores.challenge,2000);assert.equal(next.scores.learning,6);assert.equal(next.scores.assessmentTwo,undefined);});
test('較舊及重送版本不覆蓋較新資料',()=>{const p=payload();const latest=api.merge_(null,{...p,revision:9,shortAnswer:'最新回答'});const stale=api.merge_(latest,{...p,shortAnswer:'舊回答',scores:{...p.scores,gameOneBest:60}});assert.equal(stale.shortAnswer,'最新回答');assert.equal(stale.scores.gameOneBest,50);assert.equal(JSON.stringify(api.merge_(latest,{...p,revision:9})),JSON.stringify(latest));});
test('同一學生合併新場次，另一位學生鍵不同',()=>{const p=payload();const old=api.merge_(null,p);const next=api.merge_(old,{...p,sessionId:'test-session-002',scores:{...p.scores,challenge:3000}});assert.equal(next.scores.challenge,3000);assert.equal(Object.keys(next.sessions).length,2);assert.notEqual(api.studentKey_(p.identity),api.studentKey_({...p.identity,name:'另一位'}));});
test('試算表文字不執行公式',()=>{assert.equal(api.text_('=IMPORTXML("https://example.org","//a")').startsWith("'="),true);assert.equal(api.text_('一般回答'),'一般回答');});
function leaderRow(classroom,seat,score,name='不應公開的姓名'){return ['private-key',JSON.stringify({identity:{classroom,seat,name},scores:{challenge:score,assessmentOne:80},shortAnswer:'不應公開的簡答'})];}
test('排行榜依最高分取全體前十位，僅公開名次班級座號分數',()=>{
 const rows=Array.from({length:12},(_,i)=>leaderRow('701',String(i+1),i*100));
 const top=JSON.parse(JSON.stringify(api.challengeLeaders_(rows)));
 assert.equal(top.length,10);assert.equal(top[0].score,1100);assert.equal(top[9].score,200);
 assert.deepEqual(Object.keys(top[0]).sort(),['classroom','rank','score','seat']);assert.equal(top[9].seat,'03');
 assert.ok(!JSON.stringify(top).includes('不應公開'));assert.deepEqual(top.map(r=>r.rank),[1,2,3,4,5,6,7,8,9,10]);
});
test('排行榜同班座號只取最高分，零分可入榜，同分並列且排序穩定',()=>{
 const rows=[leaderRow('702','01',1000),leaderRow('701','02',1000),leaderRow('701','1',500),leaderRow('701','01',1000,'另一種拼字'),leaderRow('703','01',0)];
 const top=JSON.parse(JSON.stringify(api.challengeLeaders_(rows)));
 assert.deepEqual(top.map(r=>[r.rank,r.classroom,r.seat,r.score]),[[1,'701','01',1000],[1,'701','02',1000],[1,'702','01',1000],[4,'703','01',0]]);
 assert.equal(JSON.stringify(api.challengeLeaders_([...rows].reverse())),JSON.stringify(top));
});
test('未挑戰者、發布測試與無效成績不入榜',()=>{
 const rows=[leaderRow('701','01',null),leaderRow('701','02',undefined),leaderRow('701','03',-1),leaderRow('701','04',60001),leaderRow('701','05','100'),leaderRow('發布驗證刪除','999',60000),['bad','not-json'],['bad','null']];
 assert.equal(api.challengeLeaders_(rows).length,0);
});
test('GAS 排行榜讀取不寫入試算表，原健康檢查維持相同格式',()=>{
 context.ContentService={MimeType:{JSON:'json'},createTextOutput:text=>({setMimeType:()=>JSON.parse(text)})};
 context.PropertiesService={getScriptProperties:()=>({getProperty:()=> 'private-sheet'})};
 context.SpreadsheetApp={openById:()=>({getSheetByName:()=>({getLastRow:()=>2,getRange:()=>({getValues:()=>[leaderRow('701','01',300)]})})})};
 assert.equal(api.doGet({parameter:{action:'leaderboard'}}).leaders[0].score,300);
 assert.equal(api.doGet().ready,true);assert.equal(api.doGet().leaders,undefined);
 context.SpreadsheetApp.openById=()=>{throw Error('offline');};assert.equal(api.doGet({parameter:{action:'leaderboard'}}).ok,false);
});
test('測試資料清理入口只接受固定課程與固定動作',()=>{const code=fs.readFileSync('gas/Code.gs','utf8');assert.match(code,/input\?\.courseId===COURSE_ID&&input\?\.action==='cleanupTestData'/);assert.match(code,/values\[i\]\[0\]==='發布驗證刪除'/);assert.match(code,/startsWith\('release-test-'\)/);});
