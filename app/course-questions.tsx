'use client';
import {useEffect,useRef,useState} from 'react';
import {grade,shuffle,type Question} from './course-data';
import type {ActivityResult,AnswerRecord} from './course-state';
import {CellDiagram} from './course-art';

function QuestionInputs({q,value,onChange,disabled,options,fieldOptions}:{q:Question;value:string[];onChange:(a:string[])=>void;disabled:boolean;options:string[];fieldOptions:string[][]}){
 if(q.kind==='short')return <label className="short-label">用自己的話回答<textarea rows={4} maxLength={1200} value={value[0]||''} onChange={e=>onChange([e.target.value])} disabled={disabled} placeholder="說明試劑檢測的項目，以及結論能到哪裡。"/><small>最多 1,200 字；保留原文，待教師確認。</small></label>;
 if(q.kind==='hotspot')return <CellDiagram selected={value[0]} onSelect={disabled?undefined:x=>onChange([x])}/>;
 if(q.fields)return <div className={`field-grid ${q.kind==='diagnosis'?'diagnosis-fields':''}`}>{q.fields.map((f,i)=><label key={f.label}>{f.label}<select disabled={disabled} value={value[i]||''} onChange={e=>{const next=q.fields!.map((_,j)=>value[j]||'');next[i]=e.target.value;onChange(next);}}><option value="">請選擇</option>{(fieldOptions[i]||f.options).map(o=><option key={o}>{o}</option>)}</select></label>)}</div>;
 if(q.kind==='sort'){
  const items=value.length?value:options;
  const move=(i:number,d:number)=>{const next=[...items];[next[i],next[i+d]]=[next[i+d],next[i]];onChange(next);};
  return <div className="sort-control"><p className="helper">使用上下按鈕調整順序，完成後勾選確認。</p><ol>{items.map((o,i)=><li key={o}><span>{i+1}</span><p>{o}</p><button type="button" className="outline" disabled={disabled||i===0} onClick={()=>move(i,-1)} aria-label={`${o}，上移`}>↑</button><button type="button" className="outline" disabled={disabled||i===items.length-1} onClick={()=>move(i,1)} aria-label={`${o}，下移`}>↓</button></li>)}</ol></div>;
 }
 return <div className="choice-grid">{options.map(o=><label key={o} className={value.includes(o)?'selected':''}><input disabled={disabled} type={q.kind==='multi'?'checkbox':'radio'} name={q.id} checked={value.includes(o)} onChange={()=>onChange(q.kind==='multi'?(value.includes(o)?value.filter(x=>x!==o):[...value,o]):[o])}/><span>{o}</span></label>)}</div>;
}

export function PracticeQuestion({q,index,record,onSubmit}:{q:Question;index:number;record?:AnswerRecord;onSubmit:(q:Question,a:string[],correct:boolean|null)=>void}){
 const [value,setValue]=useState<string[]>([]);const [options,setOptions]=useState(q.options||[]);const [fieldOptions,setFieldOptions]=useState<string[][]>([]);const [status,setStatus]=useState<'blank'|'wrong'>('blank');const [ordered,setOrdered]=useState(false);const [ready,setReady]=useState(false);const sent=useRef(false);
 useEffect(()=>{let mixed=shuffle(q.options||[]);if(q.kind==='sort'&&mixed.join('|')===q.answer?.join('|'))mixed=[...mixed.slice(1),mixed[0]];setOptions(mixed);setFieldOptions(q.fields?.map(f=>shuffle(f.options))||[]);setReady(true);},[q]);
 const complete=q.kind==='short'?!!value[0]?.trim():q.fields?q.fields.every((_,i)=>!!value[i]):q.kind==='sort'?ordered:value.length>0;
 const locked=!!record?.done||!!record?.pending||status==='wrong';
 const retry=()=>{sent.current=false;setValue([]);setStatus('blank');setOrdered(false);setOptions(shuffle(q.options||[]));setFieldOptions(q.fields?.map(f=>shuffle(f.options))||[]);};
 const submit=()=>{if(sent.current||!complete||locked)return;sent.current=true;const answer=q.kind==='sort'?(value.length?value:options):value;const correct=q.kind==='short'?null:grade(q,answer);onSubmit(q,answer,correct);if(correct===false)setStatus('wrong');};
 return <section id={`q-${q.id}`} className={`question-card ${record?.done?'correct':status==='wrong'?'incorrect':record?.pending?'pending-review':''}`} aria-labelledby={`title-${q.id}`}>
  <div className="question-top"><span className="question-number">{String(index+1).padStart(2,'0')}</span><span className="type-tag">{q.type}</span><span className="question-record">{record?.done?`已掌握 ＋${record.points} 分`:record?.pending?'待教師確認':`尚未完成${record?.attempts?`・已嘗試 ${record.attempts} 次`:''}`}</span></div>
  <h3 id={`title-${q.id}`}>{q.prompt}</h3>{q.context&&<p className="question-context">{q.context}</p>}
  {record?.done?<div className="feedback success" role="status"><strong>答對了！</strong><p>{q.explanation}</p><p className="saved-answer">你的答案：{record.answer.join(' → ')}</p></div>:record?.pending?<div className="feedback review" role="status"><strong>已保存回答，待教師確認</strong><p className="student-answer">{record.answer[0]}</p><p>{q.explanation}</p><p>尚未計入學習得分與精熟完成，不會自動判為正確。</p></div>:<form onSubmit={e=>{e.preventDefault();submit();}}>
   <fieldset disabled={locked||!ready}><legend className="sr-only">{q.prompt}</legend><QuestionInputs q={q} value={value} onChange={setValue} disabled={locked||!ready} options={options} fieldOptions={fieldOptions}/>{q.kind==='multi'&&<p className="helper">可選多項，請選出所有符合的敘述。</p>}{q.kind==='sort'&&<label className="check-order"><input type="checkbox" checked={ordered} onChange={e=>setOrdered(e.target.checked)}/>我已檢查排列順序</label>}</fieldset>
   <div className="question-actions"><button className="primary" disabled={!ready||!complete||locked}>{q.kind==='short'?'保存回答，交由教師確認':'檢查答案'}</button>{status==='wrong'&&<button type="button" className="outline" onClick={retry}>重新作答</button>}</div>
   {status==='wrong'&&<div className="feedback error" role="alert"><strong>再想一想</strong><p>{q.explanation}</p></div>}
  </form>}
 </section>;
}

export function Assessment({questions,first,onFinish}:{questions:Question[];first?:ActivityResult;onFinish:(r:ActivityResult)=>void}){
 const [answers,setAnswers]=useState<Record<string,string>>({});const [options,setOptions]=useState<string[][]>(questions.map(q=>q.options!));const [practice,setPractice]=useState(false);const [practiceResult,setPracticeResult]=useState<ActivityResult>();const submitLock=useRef(false);
 useEffect(()=>{setOptions(questions.map(q=>shuffle(q.options!)));},[questions]);
 const result=practice?practiceResult:first;const count=Object.keys(answers).length;
 const submit=()=>{if(count!==questions.length||result||submitLock.current)return;submitLock.current=true;const values=questions.map(q=>answers[q.id]);const correct=questions.map((q,i)=>grade(q,[values[i]]));const r={answers:values,correct,score:correct.filter(Boolean).length*10,at:new Date().toISOString(),practice};if(practice)setPracticeResult(r);else onFinish(r);};
 return <section><div className="assessment-intro card"><span className="label">10 題・每題 10 分</span><h2>{practice?'複習練習':'先想清楚，再統一交卷'}</h2><p>答完全部題目才可交卷。首次結果會保留，不需要全對才能完成。{practice?'這次練習不覆蓋首次成績。':''}</p>{result?<div className="assessment-score"><strong>{result.score}</strong><span>／ 100 分</span><p>{practice?'本次練習':'首次結果'}：答對 {result.correct.filter(Boolean).length}／10 題</p></div>:<p>已回答 {count}／10 題</p>}</div>
 {questions.map((q,i)=><section className={`question-card ${result?(result.correct[i]?'correct':'incorrect'):''}`} key={q.id}><div className="question-top"><span className="question-number">{String(i+1).padStart(2,'0')}</span><span className="type-tag">單選</span></div><h3>{q.prompt}</h3><QuestionInputs q={q} value={result?[result.answers[i]]:answers[q.id]?[answers[q.id]]:[]} onChange={a=>setAnswers(prev=>({...prev,[q.id]:a[0]}))} disabled={!!result} options={options[i]} fieldOptions={[]}/>{result&&<div className={`feedback ${result.correct[i]?'success':'error'}`}><strong>{result.correct[i]?'答對了':'需要複習'}：{q.answer?.[0]}</strong><p>{q.explanation}</p></div>}</section>)}
 <div className="assessment-submit">{!result?<><p>已回答 {count}／10 題</p><button className="primary" disabled={count!==10} onClick={submit}>全部完成，提交評量</button></>:<button className="outline" onClick={()=>{setPractice(true);setPracticeResult(undefined);setAnswers({});setOptions(questions.map(q=>shuffle(q.options!)));submitLock.current=false;window.scrollTo({top:0});}}>重新練習（保留首次成績）</button>}</div></section>;
}
