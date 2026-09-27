const COURSE_ID = 'nutrient-lab-115';
const HEADERS = ['班級','座號','姓名','形成性一（首次）','形成性二（首次）','遊戲一（最高）','遊戲二（最高）','極限挑戰（最高）','學習得分','遊戲一（首次）','遊戲二（首次）','完成頁數','閱讀簡答（待教師確認）','最後更新'];

// Run once from the bound spreadsheet's editor, under the teacher's account.
function setup() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  if (!book) throw new Error('請從成績總表的繫結指令碼執行 setup');
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', book.getId());
  prepare_(book);
  console.log('成績表初始化完成');
}
function prepare_(book) {
  const sheet = book.getSheetByName('成績總表') || book.insertSheet('成績總表');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([...HEADERS,'學生鍵']); sheet.setFrozenRows(1); sheet.hideColumns(15);
    sheet.getRange(1,1,1,HEADERS.length).setBackground('#276f7b').setFontColor('#ffffff').setFontWeight('bold');
    sheet.setColumnWidths(1,3,95); sheet.setColumnWidths(4,9,130); sheet.setColumnWidth(13,360); sheet.setColumnWidth(14,180);
  }
  ['同步狀態','同步事件'].forEach(name => {
    let s=book.getSheetByName(name);
    if(!s){s=book.insertSheet(name);s.appendRow(name==='同步狀態'?['學生鍵','狀態']:['事件ID','接收時間']);}
    s.hideSheet();
  });
  const starter = book.getSheetByName('工作表1');
  if (starter && starter.getLastRow() === 0 && !starter.isSheetHidden()) starter.hideSheet();
  return sheet;
}
function book_(){const id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');if(!id)throw new Error('尚未初始化');return SpreadsheetApp.openById(id);}
function json_(value){return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);}
function doGet(){return json_({ok:true,courseId:COURSE_ID,ready:!!PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')});}
function validate_(p){
  if(!p||p.courseId!==COURSE_ID||typeof p.eventId!=='string'||typeof p.sessionId!=='string'||!/^[-\w]{8,100}$/.test(p.eventId)||!/^[-\w]{8,100}$/.test(p.sessionId)||!Number.isInteger(p.revision)||p.revision<1||p.revision>1000000)throw new Error('格式錯誤');
  if(!p.identity||!['classroom','seat','name'].every(k=>typeof p.identity[k]==='string'&&p.identity[k].trim().length>0&&p.identity[k].length<=24))throw new Error('資料不完整');
  const ranges={assessmentOne:100,assessmentTwo:100,gameOne:60,gameOneBest:60,gameTwo:60,gameTwoBest:60,challenge:60000,learning:117};
  if(!p.scores||Object.keys(ranges).some(k=>p.scores[k]!==null&&(!Number.isInteger(p.scores[k])||p.scores[k]<0||p.scores[k]>ranges[k])))throw new Error('分數超出範圍');
  if(!Number.isInteger(p.completed)||p.completed<0||p.completed>15||typeof p.shortAnswer!=='string'||p.shortAnswer.length>5000)throw new Error('學習資料格式錯誤');
  return p;
}
function studentKey_(identity){return JSON.stringify(['classroom','seat','name'].map(k=>identity[k].trim().normalize('NFKC')));}
function merge_(old,p){
  const next=old?JSON.parse(JSON.stringify(old)):{identity:p.identity,scores:{},sessions:{},completed:0,shortAnswer:''};
  if((next.sessions[p.sessionId]||0)>=p.revision)return next;
  ['assessmentOne','assessmentTwo','gameOne','gameTwo'].forEach(k=>{if(next.scores[k]==null&&p.scores[k]!=null)next.scores[k]=p.scores[k];});
  ['gameOneBest','gameTwoBest','challenge','learning'].forEach(k=>{if(p.scores[k]!=null)next.scores[k]=Math.max(next.scores[k]||0,p.scores[k]);});
  next.completed=Math.max(next.completed,p.completed);
  if(p.shortAnswer)next.shortAnswer=p.shortAnswer;
  next.sessions[p.sessionId]=p.revision;return next;
}
function text_(value){const s=String(value||'');return /^[=+\-@\t\r]/.test(s)?"'"+s:s;}
function row_(s){const v=k=>s.scores[k]??'';return [text_(s.identity.classroom),text_(s.identity.seat),text_(s.identity.name),v('assessmentOne'),v('assessmentTwo'),v('gameOneBest'),v('gameTwoBest'),v('challenge'),v('learning'),v('gameOne'),v('gameTwo'),s.completed,text_(s.shortAnswer),new Date()];}
function cleanupTestData_(){
  const book=book_();const sheet=prepare_(book);let rows=0,statesRemoved=0,eventsRemoved=0;
  if(sheet.getLastRow()>1){const values=sheet.getRange(2,1,sheet.getLastRow()-1,1).getDisplayValues();for(let i=values.length-1;i>=0;i--)if(values[i][0]==='發布驗證刪除'){sheet.deleteRow(i+2);rows++;}}
  const states=book.getSheetByName('同步狀態');
  if(states.getLastRow()>1){const values=states.getRange(2,2,states.getLastRow()-1,1).getDisplayValues();for(let i=values.length-1;i>=0;i--)if(values[i][0].includes('發布驗證刪除')){states.deleteRow(i+2);statesRemoved++;}}
  const events=book.getSheetByName('同步事件');
  if(events.getLastRow()>1){const values=events.getRange(2,1,events.getLastRow()-1,1).getDisplayValues();for(let i=values.length-1;i>=0;i--)if(values[i][0].startsWith('release-test-')){events.deleteRow(i+2);eventsRemoved++;}}
  return {ok:true,cleanup:true,rows,states:statesRemoved,events:eventsRemoved};
}
function doPost(e){
  const lock=LockService.getScriptLock();
  try{
    if(!e.postData||e.postData.contents.length>20000)throw new Error('請求過大');
    const input=JSON.parse(e.postData.contents);
    if(input?.courseId===COURSE_ID&&input?.action==='cleanupTestData')return json_(cleanupTestData_());
    const p=validate_(input);
    lock.waitLock(20000);
    const book=book_();const sheet=prepare_(book);const events=book.getSheetByName('同步事件');
    if(events.getRange('A:A').createTextFinder(p.eventId).matchEntireCell(true).findNext())return json_({ok:true,eventId:p.eventId,duplicate:true});
    const states=book.getSheetByName('同步狀態');const key=studentKey_(p.identity);
    const match=states.getRange('A:A').createTextFinder(key).matchEntireCell(true).findNext();
    const stateRow=match?match.getRow():states.getLastRow()+1;
    const old=match?JSON.parse(states.getRange(stateRow,2).getValue()):null;
    const next=merge_(old,p);
    // Re-find the row after teacher sorting; each write remains an upsert on retry.
    const found=sheet.getRange('O:O').createTextFinder(key).matchEntireCell(true).findNext();
    const targetRow=found?found.getRow():sheet.getLastRow()+1;
    states.getRange(stateRow,1,1,2).setValues([[key,JSON.stringify(next)]]);
    sheet.getRange(targetRow,1,1,HEADERS.length+1).setValues([[...row_(next),key]]);
    SpreadsheetApp.flush();
    events.appendRow([p.eventId,new Date()]);
    return json_({ok:true,eventId:p.eventId,duplicate:false});
  }catch(error){return json_({ok:false,error:'成績未寫入，請稍後重試或聯絡老師。'});}
  finally{if(lock.hasLock())lock.releaseLock();}
}
