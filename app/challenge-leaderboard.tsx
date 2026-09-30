'use client';
import {useEffect,useRef,useState} from 'react';
import {COURSE_ID,SYNC_ENDPOINT} from './sync-config';

type Leader={rank:number;classroom:string;seat:string;score:number};
export function ChallengeLeaderboard(){
 const [leaders,setLeaders]=useState<Leader[]|null>(null);
 const [busy,setBusy]=useState(true);const [error,setError]=useState('');
 const [refresh,setRefresh]=useState(0);const controller=useRef<AbortController|null>(null);
 useEffect(()=>{
  let disposed=false;
  const load=async()=>{
   controller.current?.abort();const request=new AbortController();controller.current=request;
   const timeout=setTimeout(()=>request.abort(),20000);setBusy(true);setError('');
   try{
    if(!navigator.onLine||!SYNC_ENDPOINT)throw new Error('offline');
    const response=await fetch(`${SYNC_ENDPOINT}?action=leaderboard`,{signal:request.signal,cache:'no-store',redirect:'follow'});
    const data=await response.json();
    if(!response.ok||data.ok!==true||data.courseId!==COURSE_ID||!Array.isArray(data.leaders)||data.leaders.length>10||data.leaders.some((r:Leader)=>!r||!Number.isInteger(r.rank)||r.rank<1||r.rank>10||typeof r.classroom!=='string'||typeof r.seat!=='string'||!Number.isInteger(r.score)||r.score<0||r.score>60000))throw new Error('invalid');
    if(!disposed&&controller.current===request)setLeaders(data.leaders);
   }catch{if(!disposed&&controller.current===request)setError('排行榜暫時無法更新，請確認網路連線後再試。');}
   finally{clearTimeout(timeout);if(!disposed&&controller.current===request)setBusy(false);}
  };
  const update=()=>void load();void load();
  window.addEventListener('nutrient-score-uploaded',update);window.addEventListener('online',update);
  return()=>{disposed=true;controller.current?.abort();window.removeEventListener('nutrient-score-uploaded',update);window.removeEventListener('online',update);};
 },[refresh]);
 return <div className="card local-leaderboard"><span className="label">全體學生・前 10 名</span><h2>極限挑戰英雄榜</h2><p>每位同學取已上傳的最高分，同一班級、座號只列一次。同分並列名次，依班級、座號排序，最多顯示 10 位。</p><button className="outline" disabled={busy} onClick={()=>setRefresh(v=>v+1)}>{busy?'讀取排行榜中……':'更新排行榜'}</button><p role="status">{error?(leaders?'以下保留上次載入的排名。':'')+error:busy?'正在讀取最新排名……':leaders?.length?'完成挑戰並成功上傳後，排行榜會自動更新。':'目前還沒有已上傳的挑戰成績。'}</p>{!!leaders?.length&&<div className="table-scroll"><table aria-label="全體學生極限挑戰前十名"><thead><tr><th scope="col">名次</th><th scope="col">班級</th><th scope="col">座號</th><th scope="col">最高分</th></tr></thead><tbody>{leaders.map(r=><tr key={JSON.stringify([r.classroom,r.seat])}><td>{r.rank}</td><td>{r.classroom}</td><td>{r.seat}</td><td>{r.score.toLocaleString()}</td></tr>)}</tbody></table></div>}</div>;
}
