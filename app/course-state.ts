import {PAGES, type Question} from './course-data';
export type Identity={classroom:string;seat:string;name:string};
export type AnswerRecord={attempts:number;done:boolean;points:number;answer:string[];pending?:boolean};
export type ActivityResult={score:number;answers:string[];correct:boolean[];at:string;practice?:boolean};
export type AttemptEvent={id:string;questionId:string;answer:string[];correct:boolean|null;points:number;attempt:number;at:string};
export type CourseState={version:2;sessionId:string;identity:Identity;answers:Record<string,AnswerRecord>;explored:string[];activities:Record<string,ActivityResult[]>;events:AttemptEvent[];started:boolean};
export const STORAGE_KEY='nutrient-lab-115:full-course:v2';
export function fresh(identity:Identity={classroom:'',seat:'',name:''}):CourseState{return {version:2,sessionId:'',identity,answers:{},explored:[],activities:{},events:[],started:false};}
export function totalPoints(s:CourseState){return Object.values(s.answers).reduce((n,a)=>n+a.points,0);}
export function recordAnswer(s:CourseState,q:Question,answer:string[],correct:boolean|null,eventId:string):CourseState{
 const old=s.answers[q.id];if(old?.done||old?.pending||s.events.some(e=>e.id===eventId))return s;
 const attempt=(old?.attempts||0)+1;const points=correct?Math.max(1,4-attempt):0;
 const result:AnswerRecord={attempts:attempt,done:correct===true,points,answer:correct||correct===null?answer:[],pending:correct===null};
 return {...s,answers:{...s.answers,[q.id]:result},events:[...s.events,{id:eventId,questionId:q.id,answer,correct,points,attempt,at:new Date().toISOString()}]};
}
export function pageComplete(s:CourseState,id:string){
 const page=PAGES.find(p=>p.id===id);if(!page)return false;
 if(id==='home')return s.started;if(id==='results')return false;
 if(page.kind==='assessment'||page.kind==='game'||page.kind==='challenge')return !!s.activities[id]?.length;
 if(page.questions)return s.explored.includes(id)&&page.questions.every(q=>s.answers[q.id]?.done);
 return s.explored.includes(id);
}
export const REQUIRED=PAGES.filter(p=>!['home','results'].includes(p.id));
// Navigation completion is separate from mastery: a submitted short answer
// may advance while its teacher-confirmed score remains pending.
export function pageReadyForNext(s:CourseState,id:string){
 const page=PAGES.find(p=>p.id===id);if(!page)return false;
 if(page.kind==='reading')return s.explored.includes(id)&&!!page.questions?.every(q=>{
  const answer=s.answers[q.id];
  return answer?.done||(q.kind==='short'&&answer?.pending&&answer.answer.some(value=>value.trim()));
 });
 return pageComplete(s,id);
}
export function canAccessPage(s:CourseState,id:string,teacher=false){
 const index=PAGES.findIndex(p=>p.id===id);if(index<0)return false;
 return teacher||PAGES.slice(0,index).every(p=>pageReadyForNext(s,p.id));
}
export function resolvePage(s:CourseState,id:string,teacher=false){
 if(!PAGES.some(p=>p.id===id))return 'home';
 if(canAccessPage(s,id,teacher))return id;
 return PAGES.find(p=>!pageReadyForNext(s,p.id))?.id||'results';
}
export function completedCount(s:CourseState){return REQUIRED.filter(p=>pageComplete(s,p.id)).length;}
export function readLocal():CourseState{
 try{
  const x=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
  if(x?.version!==2||typeof x.sessionId!=='string'||!x.identity||!['classroom','seat','name'].every(k=>typeof x.identity[k]==='string')||typeof x.started!=='boolean'||!x.answers||typeof x.answers!=='object'||!Array.isArray(x.explored)||!x.activities||!Array.isArray(x.events))return fresh();
  const ids=new Set(PAGES.flatMap(p=>p.questions?.map(q=>q.id)||[]));
  for(const [id,a] of Object.entries(x.answers) as [string,AnswerRecord][]){if(!ids.has(id)||!a||!Number.isInteger(a.attempts)||a.attempts<1||a.attempts>10000||!Number.isInteger(a.points)||a.points<0||a.points>3||typeof a.done!=='boolean'||!Array.isArray(a.answer)||!a.answer.every(v=>typeof v==='string'))return fresh();}
  for(const [id,list] of Object.entries(x.activities) as [string,ActivityResult[]][]){if(!PAGES.some(p=>p.id===id)||!Array.isArray(list)||list.some(r=>!r||!Number.isFinite(r.score)||r.score<0||!Array.isArray(r.answers)||!r.answers.every(a=>typeof a==='string')||!Array.isArray(r.correct)||!r.correct.every(a=>typeof a==='boolean')||typeof r.at!=='string'))return fresh();}
  if(x.events.some((e:AttemptEvent)=>!e||typeof e.id!=='string'||!ids.has(e.questionId)||!Array.isArray(e.answer)||!e.answer.every(v=>typeof v==='string')||typeof e.at!=='string'))return fresh();
  return {...x,explored:x.explored.filter((id:unknown)=>typeof id==='string'&&PAGES.some(p=>p.id===id))};
 }catch{return fresh();}
}
