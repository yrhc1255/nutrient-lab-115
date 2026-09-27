'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Icon } from './illustrations';
import { ReferenceArt, DetailedExperiment } from './reference-art';

type Page = 'home' | 'guide' | 'lesson';
type Identity = { classroom: string; seat: string; name: string };
type RecordState = { identity: Identity; started: boolean; guideDone: boolean; experimentDone: boolean; questionDone: boolean; attempts: number };
const EMPTY: RecordState = { identity: { classroom: '', seat: '', name: '' }, started: false, guideDone: false, experimentDone: false, questionDone: false, attempts: 0 };
const KEY = 'nutrient-lab-115:local-preview:v1';
const OPTIONS = ['碘液', '本氏液', '水'];
const MAP = ['食物中的養分與能量', '今天的食物任務', '食物裡有哪些養分', '能量與身體材料', '不供能也不可少', '養分理解檢查', '養分任務闖關', '用碘液找澱粉', '用本氏液找糖分', '怎樣比較才公平', '食物樣本鑑定所', '檢測推理檢查', '檢測判斷挑戰', '紙張也有澱粉嗎', '把線索串起來', '養分極限挑戰', '我的學習成果'];
function shuffled() {
  const result = [...OPTIONS];
  for (let i=result.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [result[i],result[j]]=[result[j],result[i]]; }
  return result;
}
function readSaved(): RecordState {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!value || !value.identity || !['classroom','seat','name'].every(k=>typeof value.identity[k]==='string') || typeof value.started!=='boolean') return EMPTY;
    return {identity:value.identity,started:value.started,guideDone:value.guideDone===true,experimentDone:value.experimentDone===true,questionDone:value.questionDone===true,attempts:Number.isSafeInteger(value.attempts)&&value.attempts>=0?value.attempts:0};
  } catch { return EMPTY; }
}

export default function LearningLab() {
  const [record, setRecord] = useState<RecordState>(EMPTY);
  const [page, setPage] = useState<Page>('home');
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [options, setOptions] = useState(OPTIONS);
  const [selected,setSelected] = useState('');
  const [wrong,setWrong] = useState(false);
  const [predictions,setPredictions] = useState({starch:'',water:''});
  const [observed,setObserved] = useState(false);
  const [dialog,setDialog] = useState<'map'|'teacher'|'finish'|null>(null);
  const [password,setPassword] = useState('');
  const [passwordError,setPasswordError] = useState(false);
  const [teacher,setTeacher] = useState(false);
  const [notice,setNotice] = useState('');
  const titleRef = useRef<HTMLHeadingElement>(null);
  const modalRef = useRef<HTMLDialogElement>(null);
  const guideDone=record.guideDone;
  const complete=record.experimentDone&&record.questionDone;

  useEffect(()=>{
    setRecord(readSaved());
    const hash=window.location.hash.slice(1);
    if(hash==='guide'||hash==='lesson')setPage(hash);
    setOptions(shuffled());setReady(true);
  },[]);
  useEffect(()=>{
    if(!ready)return;
    try {localStorage.setItem(KEY,JSON.stringify(record));setStorageError(false);}catch{setStorageError(true);}
  },[record,ready]);
  useEffect(()=>{
    const handle=()=>{const hash=window.location.hash.slice(1);setPage(hash==='guide'||hash==='lesson'?hash:'home');setSelected('');setWrong(false);setPredictions({starch:'',water:''});setObserved(false);};
    window.addEventListener('hashchange',handle);return()=>window.removeEventListener('hashchange',handle);
  },[]);
  useEffect(()=>{if(ready){titleRef.current?.focus({preventScroll:true});document.querySelector('[aria-current="step"]')?.scrollIntoView({inline:'center',block:'nearest'});}},[page,ready]);
  useEffect(()=>{if(dialog)modalRef.current?.showModal();else modalRef.current?.close();},[dialog]);

  function go(next: Page) { if(next!==page){window.location.hash=next;setPage(next);setSelected('');setWrong(false);setObserved(false);setPredictions({starch:'',water:''});setNotice('');window.scrollTo({top:0});} }
  function updateIdentity(key: keyof Identity,value:string) {
    setRecord(r=>({...EMPTY,identity:{...r.identity,[key]:value}}));
    setSelected('');setWrong(false);setObserved(false);setPredictions({starch:'',water:''});setTeacher(false);setNotice('資料已變更，先前的體驗紀錄已清除。');
  }
  function start(e:FormEvent) { e.preventDefault();setRecord(r=>({...r,started:true}));go('guide'); }
  function observe() {setObserved(true);setRecord(r=>({...r,experimentDone:true}));setNotice('觀察完成。請比較兩個樣本的顏色與你的預測。');}
  function submitAnswer(e:FormEvent) {
    e.preventDefault();if(!selected||wrong||record.questionDone)return;
    const correct=selected==='碘液';
    setRecord(r=>({...r,attempts:r.attempts+1,questionDone:correct}));setWrong(!correct);
    setNotice(correct?'答對了！你已完成這道練習。':'再想一想：這次要找的是澱粉，哪種試劑適合？');
  }
  const valid=Object.values(record.identity).every(v=>v.trim().length>0);
  const progress=(Number(guideDone)+Number(record.experimentDone)+Number(record.questionDone));

  return <>
    <a href="#main" className="skip">跳至主要內容</a>
    <div className="preview-note">操作預覽 <span>首頁・導讀・碘液探索</span><span>體驗紀錄僅保留在此瀏覽器，不計正式成績。</span></div>
    <header className="site-header"><button className="brand" onClick={()=>go('home')} aria-label="養分研究所，回到首頁"><span className="brand-icon"><Icon name="leaf" size={29}/></span><span>食物中的養分與能量<small>養分研究所・探索生活中的科學</small></span></button>
      <div className="header-actions"><button className="text-button" onClick={()=>{setDialog('teacher');setPasswordError(false);setPassword('');}}><Icon name="lock" size={16}/>{teacher?'教師瀏覽中':'教師模式'}</button><button className="outline small" onClick={()=>setDialog('map')}><Icon name="book" size={17}/>課程地圖</button></div>
    </header>
    <nav className="step-nav" aria-label="本次體驗頁面">{([{id:'home',name:'首頁',icon:'home'},{id:'guide',name:'今天的任務',icon:'book'},{id:'lesson',name:'用碘液找澱粉',icon:'flask'}] as const).map((step,i)=><button key={step.id} onClick={()=>go(step.id)} aria-current={page===step.id?'step':undefined}><span className="step-icon"><Icon name={step.id==='guide'&&guideDone?'check':step.id==='lesson'&&complete?'check':step.icon} size={20}/></span>{step.name}<span className="sr-only">第 {i+1} 頁</span></button>)}</nav>
    {storageError&&<p role="alert" className="storage-alert">目前無法保存體驗紀錄，重新整理後可能需要重新開始。</p>}
    <main id="main" className={`main-shell page-${page}`}>
      {page==='home'&&<>
        <section className="hero"><div className="hero-copy"><p className="eyebrow"><span/>從生活出發的科學探索</p><h1 ref={titleRef} tabIndex={-1}>食物中的<br/><span className="accent">養分與能量</span></h1><p className="hero-description">從餐桌出發，用證據認識養分。</p><div className="hero-tags"><span>自主學習</span><span>虛擬探索</span><span>即時回饋</span></div></div><div className="hero-art"><div className="art-label"><Icon name="flask" size={17}/>今日任務：找出澱粉</div><ReferenceArt kind="home"/><span className="art-caption">一種食物，可能含有多種養分。</span></div></section>
        <section className="card entry-card"><div><p className="eyebrow">準備好了嗎？</p><h2>開始你的學習</h2><p className="muted">填寫資料，或使用自訂代稱體驗操作。</p></div><form onSubmit={start} className="entry-form">{([{key:'classroom',label:'班級',placeholder:'例如：701'},{key:'seat',label:'座號',placeholder:'例如：05'},{key:'name',label:'姓名',placeholder:'你的名字或代稱'}] as const).map(field=><label key={field.key}>{field.label}<input autoComplete="off" maxLength={field.key==='name'?20:12} value={record.identity[field.key]} onChange={e=>updateIdentity(field.key,e.target.value)} placeholder={field.placeholder} required/></label>)}<button className="primary" disabled={!ready||!valid}>{record.started?'繼續探索':'開始學習'}<Icon name="arrow" size={18}/></button></form>{notice&&<p className="entry-notice" role="status">{notice}</p>}</section>
        <section className="objective-row" aria-label="學習目標">{[{n:'01',title:'認識養分',text:'了解食物中的六大養分。',icon:'leaf'},{n:'02',title:'動手找線索',text:'在虛擬實驗中比較變化。',icon:'flask'},{n:'03',title:'用證據說明',text:'讓觀察支持你的結論。',icon:'book'}].map(o=><div key={o.n}><span className="objective-icon"><Icon name={o.icon as 'leaf'|'flask'|'book'} size={25}/></span><div><small>{o.n} / EXPLORE</small><h3>{o.title}</h3><p>{o.text}</p></div></div>)}</section>
      </>}
      {page==='guide'&&<>
        <div className="page-heading"><p className="eyebrow">先知道怎麼學，再開始探索</p><h1 ref={titleRef} tabIndex={-1}>今天的食物任務</h1><p>用觀察、實驗與證據，認識食物中的養分。</p><ReferenceArt kind="scientist"/></div>
        <div className="guide-grid"><section className="card guide-tasks"><h2><Icon name="book" size={30}/>三個學習任務</h2>{[{title:'認識食物中的養分',text:'養分不只有供能的用途。一種食物也可能含有多種養分。',icon:'leaf'},{title:'預測，再用試劑觀察',text:'先想想澱粉液和水可能如何變色，再操作虛擬碘液。',icon:'flask'},{title:'比較結果，說明理由',text:'哪個樣本發生變化？水的結果能幫助我們判斷什麼？',icon:'book'}].map((task,i)=><article className="task-item" key={task.title}><span className="task-number">0{i+1}</span><div><h3>{task.title}</h3><p>{task.text}</p></div><ReferenceArt kind={i===0?'food':i===1?'lab':'evidence'}/></article>)}</section><aside className="card guide-aside"><span className="label">操作小提醒</span><h2>答錯，也是學習的一部分。</h2><ol><li>先完成選擇，再按「檢查答案」。</li><li>讀完回饋，用「重新作答」修正。</li><li>觀察與練習都完成，再結束體驗。</li></ol><div className="gentle-note"><Icon name="check"/><p>這次可以自由切換三個體驗頁。完整課程會在後續確認後製作。</p></div></aside></div>
        <footer className="page-footer"><button className="outline" onClick={()=>go('home')}><Icon name="home" size={18}/>回到首頁</button><button className="primary" onClick={()=>{setRecord(r=>({...r,guideDone:true}));go('lesson');}}>我準備好了，開始探索<Icon name="arrow" size={18}/></button></footer>
      </>}
      {page==='lesson'&&<>
        <div className="lesson-heading"><div><p className="eyebrow">觀察兩個樣本，找到變色的線索</p><h1 ref={titleRef} tabIndex={-1}>用碘液找澱粉</h1></div><span className="label"><Icon name="flask" size={17}/>虛擬實驗</span></div>
        <section className="concept"><p>黃褐色的<span>碘液</span>遇到<span>澱粉</span>，可呈現<span>藍黑色或紫紅色</span>；沒有澱粉時，維持黃褐色。</p><small>依教材第 74 頁整理</small></section>
        <div className="experiment-grid"><section className="card lab-panel"><div className="section-heading"><span className="section-number">01</span><div><h2>先預測，再觀察</h2><p>滴入碘液後，兩個樣本會變成什麼顏色？</p></div></div><DetailedExperiment revealed={observed}/><div className="prediction-fields">{([{key:'starch',label:'澱粉液的預測'},{key:'water',label:'水的預測'}] as const).map(p=><label key={p.key}>{p.label}<select disabled={observed} value={predictions[p.key]} onChange={e=>setPredictions(prev=>({...prev,[p.key]:e.target.value}))}><option value="">請選擇顏色</option><option>黃褐色</option><option>藍黑色或紫紅色</option></select></label>)}</div><div className="lab-actions"><button className="primary" disabled={!predictions.starch||!predictions.water||observed} onClick={observe}><Icon name="flask" size={18}/>{observed?'已滴入碘液':'滴入碘液'}</button>{observed&&<button className="text-button" onClick={()=>{setObserved(false);setPredictions({starch:'',water:''});}}>重新觀察</button>}</div><p className="helper">這是虛擬操作。實際使用試劑，請由老師指導。</p></section>
        <section className="card observation-panel"><div className="section-heading"><span className="section-number">02</span><div><h2>留下觀察紀錄</h2><p>比一比：結果和你的預測相同嗎？</p></div></div><div className="table-wrap"><table><caption className="sr-only">碘液檢測的預測與觀察</caption><thead><tr><th>樣本</th><th>我的預測</th><th>觀察結果</th></tr></thead><tbody><tr><th>澱粉液</th><td>{predictions.starch||'—'}</td><td>{observed?<span className="result-color"><i style={{background:'#36305e'}}/>藍黑色</span>:<span className="pending">尚未操作</span>}</td></tr><tr><th>水</th><td>{predictions.water||'—'}</td><td>{observed?<span className="result-color"><i style={{background:'#ba8736'}}/>黃褐色</span>:<span className="pending">尚未操作</span>}</td></tr></tbody></table></div><div className="evidence-note"><Icon name="book" size={23}/><h3>{observed?'你找到的證據':'觀察時，留意這件事'}</h3><p>{observed?'水加碘液後沒有出現相同的藍黑色變化。比較兩個樣本，可以支持變色與澱粉有關。':'兩個樣本都加入碘液。如果只有其中一個變色，差異可能來自什麼？'}</p></div>{observed&&<p className="observation-feedback" role="status">{predictions.starch==='藍黑色或紫紅色'&&predictions.water==='黃褐色'?'你的預測與這次觀察一致。':'有不同也沒關係，請對照紀錄表修正原來的想法。'} 澱粉也可能呈紫紅色，本次以藍黑色示意。</p>}{!observed&&record.experimentDone&&<p className="helper">先前已完成觀察；重新整理後，可再次預測與操作。</p>}</section></div>
        <section className={`card quiz ${record.questionDone?'correct':wrong?'incorrect':''}`}><div className="section-heading"><span className="section-number">03</span><div><h2>把觀察用在問題上</h2><p>本次先體驗一道單選題。</p></div><span className="question-status">{record.questionDone?'已掌握':'尚未完成'}</span></div>{record.questionDone?<div className="feedback success" role="status"><Icon name="check"/><div><h3>答對了！碘液可以用來檢測澱粉。</h3><p>藍黑色或紫紅色是本教材中的陽性現象。這不表示試劑能檢測所有養分。</p></div></div>:<form onSubmit={submitAnswer}><fieldset disabled={wrong||!ready}><legend>想知道未知樣本是否含有澱粉，應選哪一種試劑？</legend><div className="answer-options">{options.map(option=><label key={option} className={selected===option?'selected':''}><input type="radio" name="reagent" value={option} checked={selected===option} onChange={()=>setSelected(option)}/>{option}</label>)}</div></fieldset><div className="quiz-actions"><button className="primary" disabled={!selected||wrong||!ready}>檢查答案</button>{wrong&&<button type="button" className="outline" onClick={()=>{setWrong(false);setSelected('');setOptions(shuffled());setNotice('');}}>重新作答</button>}</div>{wrong&&<div className="feedback error" role="alert"><span>再想一想</span><p>{selected==='本氏液'?'本氏液用於本課的糖分檢測；這一題要找的是澱粉。':'水在本次實驗中提供對照，不能取代用來檢測澱粉的試劑。'} 請回看上方課文，再重新作答。</p></div>}</form>}</section>
        <footer className="page-footer"><button className="outline" onClick={()=>go('guide')}>← 上一頁</button><p className="completion-hint">{complete?'觀察與練習都完成了！':!record.experimentDone?'先完成預測與觀察。':'再答對下方練習，就完成本次體驗。'}</p><button className="primary" disabled={!complete} onClick={()=>setDialog('finish')}>{complete?<Icon name="check" size={18}/>:<Icon name="lock" size={18}/>}完成體驗</button></footer>
      </>}
    </main>
    <footer className="site-footer"><span>養分研究所 · 用觀察支持想法</span><span>本次體驗進度 {Math.round(progress/3*100)}% <span className="footer-divider">／</span> {progress} 個步驟完成</span></footer>
    <span className="sr-only" role="status" aria-live="polite">{notice}</span>
    <dialog ref={modalRef} onCancel={()=>setDialog(null)} onClick={e=>{if(e.target===e.currentTarget)setDialog(null);}} aria-labelledby="modal-title"><div className="modal-heading"><h2 id="modal-title">{dialog==='map'?'完整課程地圖':dialog==='teacher'?'教師瀏覽模式':'這次的探索完成了'}</h2><button className="close-button" onClick={()=>setDialog(null)} aria-label="關閉視窗">×</button></div>
      {dialog==='map'&&<><p className="muted">本次可操作首頁、導讀與碘液課程，其餘頁面為後續規劃。</p><ol className="course-map">{MAP.map((name,i)=>{const target:Page|null=i===0?'home':i===1?'guide':i===7?'lesson':null;return <li key={name}><span>{String(i+1).padStart(2,'0')}</span>{target?<button onClick={()=>{setDialog(null);go(target);}}>{name}<Icon name="arrow" size={16}/></button>:<span className="planned">{name}<small>規劃中</small></span>}</li>;})}</ol></>}
      {dialog==='teacher'&&<form onSubmit={e=>{e.preventDefault();if(password==='55688'){setTeacher(true);setDialog(null);setPassword('');}else setPasswordError(true);}}><p className="muted">此模式僅供切換體驗頁，沒有學生總表或資料管理權限。本次三頁已開放自由瀏覽。</p><label>教師瀏覽密碼<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="off" required/></label>{passwordError&&<p role="alert" className="error-text">密碼不正確，請再試一次。</p>}<button className="primary modal-submit">開啟教師瀏覽</button></form>}
      {dialog==='finish'&&<div className="finish-content"><span className="finish-icon"><Icon name="check" size={36}/></span><p>你已比較澱粉液與水的變化，並選出能檢測澱粉的試劑。</p><p className="muted">這次是操作體驗，不計正式分數。</p><button className="primary" onClick={()=>{setDialog(null);go('home');}}>回到首頁<Icon name="home" size={18}/></button></div>}
    </dialog>
  </>;
}
