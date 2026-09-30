import {useEffect,useRef,useState} from 'react';
import {type CourseState} from './course-state';
import {SYNC_ENDPOINT} from './sync-config';
import {scoreSnapshot,enqueue,readQueue,acknowledge,sendScore} from './score-sync';

export function ScoreSyncPanel({state,teacher}:{state:CourseState;teacher:boolean}){
 const [message,setMessage]=useState('成績會自動傳送給老師。');
 const [busy,setBusy]=useState(false);const active=useRef(false);const teacherRef=useRef(teacher);teacherRef.current=teacher;
 const flush=async()=>{
  if(active.current||teacherRef.current||!SYNC_ENDPOINT)return;
  active.current=true;setBusy(true);
  try{
   let queue=readQueue();if(!queue.length)return;
   if(queue.length&&!navigator.onLine)throw new Error('離線');
   while(queue.length&&!teacherRef.current){setMessage('正在上傳成績……');await sendScore(SYNC_ENDPOINT,queue[0]);acknowledge(queue[0]);queue=readQueue();}
   if(!teacherRef.current){setMessage('成績已上傳至老師的成績表。');window.dispatchEvent(new Event('nutrient-score-uploaded'));}
  }catch{setMessage('成績尚未上傳，已保留在本機；連線後會重試。');}
  finally{active.current=false;setBusy(false);}
 };
 const flushRef=useRef(flush);flushRef.current=flush;
 useEffect(()=>{
  if(teacher||!state.started||Object.values(state.identity).some(x=>!x.trim())||!SYNC_ENDPOINT)return;
  try{enqueue(scoreSnapshot(state));}catch{setMessage('瀏覽器無法保存待上傳成績，請先下載本機紀錄。');return;}
  const timer=setTimeout(()=>void flushRef.current(),1200);return()=>clearTimeout(timer);
 },[state,teacher]);
 useEffect(()=>{if(teacher||!state.started||!SYNC_ENDPOINT)return;const retry=()=>void flushRef.current();window.addEventListener('online',retry);const timer=setInterval(retry,30000);return()=>{clearInterval(timer);window.removeEventListener('online',retry);};},[teacher,state.started]);
 if(!SYNC_ENDPOINT||!state.started||teacher)return null;
 return <div className="score-sync-status"><span role="status">{message}</span><button className="text-button" disabled={busy} onClick={()=>{try{enqueue(scoreSnapshot(state));void flushRef.current();}catch{setMessage('無法保存待上傳資料，請下載本機紀錄。');}}}>{busy?'傳送中':'重新上傳成績'}</button></div>;
}
