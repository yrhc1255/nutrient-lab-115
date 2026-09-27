import {type CourseState,totalPoints,completedCount} from './course-state';
import {COURSE_ID} from './sync-config';

export function scoreSnapshot(state:CourseState){
 const first=(id:string)=>state.activities[id]?.[0]?.score??null;
 const best=(id:string)=>state.activities[id]?.length?Math.max(...state.activities[id].map(r=>r.score)):null;
 return {courseId:COURSE_ID,sessionId:state.sessionId,revision:state.events.length+state.explored.length+Object.values(state.activities).reduce((n,a)=>n+a.length,0)+1,identity:state.identity,scores:{assessmentOne:first('assessment-one'),assessmentTwo:first('assessment-two'),gameOne:first('game-one'),gameOneBest:best('game-one'),gameTwo:first('game-two'),gameTwoBest:best('game-two'),challenge:best('challenge'),learning:totalPoints(state)},completed:completedCount(state),shortAnswer:state.answers['R01-5']?.answer.join('\n')||''};
}
export type ScoreSnapshot=ReturnType<typeof scoreSnapshot>;
export type Submission=ScoreSnapshot&{eventId:string};
const QUEUE='nutrient-lab-115:score-queue:v1';
const ACK='nutrient-lab-115:score-ack:v1';
export function readQueue():Submission[]{try{return JSON.parse(localStorage.getItem(QUEUE)||'[]');}catch{return [];}}
export function enqueue(snapshot:ScoreSnapshot){
 const fingerprint=JSON.stringify(snapshot);
 const ack=JSON.parse(localStorage.getItem(ACK)||'{}');
 if(ack[snapshot.sessionId]===fingerprint)return;
 const items=readQueue();
 if(items.some(({eventId,...item})=>JSON.stringify(item)===fingerprint))return;
 const next={...snapshot,eventId:crypto.randomUUID()};
 // A newer full snapshot supersedes an unsent snapshot of the same session.
 localStorage.setItem(QUEUE,JSON.stringify([...items.filter(x=>x.sessionId!==snapshot.sessionId),next]));
}
export function acknowledge(item:Submission){
 const {eventId,...snapshot}=item;
 const ack=JSON.parse(localStorage.getItem(ACK)||'{}');ack[item.sessionId]=JSON.stringify(snapshot);
 localStorage.setItem(ACK,JSON.stringify(ack));
 localStorage.setItem(QUEUE,JSON.stringify(readQueue().filter(x=>x.eventId!==eventId)));
}
export async function sendScore(endpoint:string,item:Submission){
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(item),redirect:'follow',signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw new Error('傳送未完成');
 const receipt=await response.json();
 if(receipt.ok!==true||receipt.eventId!==item.eventId)throw new Error('尚未收到成績表確認');
 return receipt;
}
