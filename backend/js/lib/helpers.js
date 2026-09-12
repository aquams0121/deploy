import {baseTimetable,choiceMeta,periodTimes} from '../data/demo.js';
export const days=['월','화','수','목','금'];
export function personalTimetable(student){const out={};for(const d of days){out[d]=baseTimetable[d].map(x=>{if(!x.block)return x;const subject=student.choices[x.block];const meta=choiceMeta[subject]||{};return {subject,block:x.block,teacher:meta.teacher||x.teacher,room:meta.room||x.room};});}return out;}
export const dday=(date)=>{const t=new Date();t.setHours(0,0,0,0);const d=new Date(date+'T00:00:00');const n=Math.ceil((d-t)/86400000);return n===0?'D-Day':n>0?`D-${n}`:`D+${Math.abs(n)}`};
export const urgency=(date)=>{const t=new Date();t.setHours(0,0,0,0);const d=new Date(date+'T00:00:00');const n=Math.ceil((d-t)/86400000);return n<=1?'urgent':n<=3?'soon':n<=7?'week':''};
export const fmt=(d)=>new Date(d+'T12:00:00').toLocaleDateString('ko-KR',{month:'long',day:'numeric'});
export const todayKey=()=>['일','월','화','수','목','금','토'][new Date().getDay()];
export function relevantAssessment(a,s){return a.type==='class'?(a.grade===s.grade&&a.classNo===s.classNo):(s.choices[a.block]===a.subject);}
export function relevantProgress(p,s){return p.type==='class'?(p.grade===s.grade&&p.classNo===s.classNo):(s.choices[p.block]===p.subject);}
export const periodTimesMap=periodTimes;
export const dateInput=(offset=0)=>{const d=new Date();d.setDate(d.getDate()+offset);return d.toISOString().slice(0,10)};
export const uid=(prefix='id')=>prefix+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
