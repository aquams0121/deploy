import {students,teachers,assessments,progressRecords,events,periodTimes} from './data/demo.js';
import * as S from './lib/storage.js';
import {personalTimetable,days,dday,urgency,fmt,todayKey,relevantAssessment,relevantProgress,dateInput,uid} from './lib/helpers.js';
import {analyzeAssessmentAI,recommendTodayAI,planAssessmentsAI,askSchoolAI} from './lib/ai.js';

const app=document.querySelector('#app');
let state={user:null,page:'home',assessmentFilter:'전체',selectedAssessment:null,aiMode:null};
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const toast=(msg)=>{const el=document.createElement('div');el.className='toast';el.textContent=msg;document.body.append(el);setTimeout(()=>el.remove(),2200)};

function mergedAssessments(){return [...assessments,...S.teacherAssessments()];}
function mergedProgress(){return [...progressRecords,...S.teacherProgress()];}
function mergedEvents(){return [...events,...S.teacherEvents()];}
function currentStudent(){return students.find(x=>x.id===state.user?.id)}
function currentTeacher(){return teachers.find(x=>x.id===state.user?.id)}
function studentAssessments(st=currentStudent()){return mergedAssessments().filter(a=>relevantAssessment(a,st)).sort((a,b)=>a.deadline.localeCompare(b.deadline));}
function studentProgressRecords(st=currentStudent()){return mergedProgress().filter(p=>relevantProgress(p,st)).sort((a,b)=>b.date.localeCompare(a.date));}
function userProgress(a,st=currentStudent()){const all=S.studentProgress();const k=`${st.id}:${a.id}`;return all[k]||{checked:a.id==='a1'?[0,1]:[]};}
function percent(a,st=currentStudent()){const p=userProgress(a,st);return Math.round((p.checked.length/(a.checklist?.length||1))*100)}
function saveCheck(a,index,checked){const st=currentStudent();const all=S.studentProgress();const k=`${st.id}:${a.id}`;const p=all[k]||{checked:[]};const set=new Set(p.checked);checked?set.add(index):set.delete(index);all[k]={checked:[...set]};S.saveStudentProgress(all);render();}

function aiAssessmentPayload(as=studentAssessments()){
 return as.map(a=>({
  id:a.id,
  title:a.title,
  subject:a.subject,
  block:a.block||null,
  deadline:a.deadline,
  dday:dday(a.deadline),
  score:a.score||0,
  workload:a.workload||3,
  progress:percent(a),
  method:a.method||'',
  materials:a.materials||[],
  unfinished:(a.checklist||[]).filter((_,i)=>!userProgress(a).checked.includes(i))
 }));
}
function aiSchoolContext(){
 const st=currentStudent();
 const tt=personalTimetable(st);
 return {
  student:{id:st.id,name:st.name,grade:st.grade,classNo:st.classNo,choices:st.choices},
  timetable:tt,
  assessments:studentAssessments(st).map(a=>({
   title:a.title,subject:a.subject,block:a.block||null,date:a.date,deadline:a.deadline,
   dday:dday(a.deadline),materials:a.materials,method:a.method,score:a.score,
   description:a.description,teacher:a.teacher,progress:percent(a)
  })),
  classProgress:studentProgressRecords(st).map(p=>({
   date:p.date,subject:p.subject,block:p.block||null,learned:p.learned,pages:p.pages,
   homework:p.homework,materials:p.materials,notice:p.notice,teacher:p.teacher
  })),
  events:mergedEvents(),
  tomorrowMaterials:materialsTomorrow(st)
 };
}
function aiResultBox(text){return `<div class="result-box">${esc(text)}</div>`}
function aiLoading(label='Gemini가 분석 중입니다...'){return `<div class="result-box muted">${label}</div>`}
function aiError(error){return `<div class="result-box">AI 요청에 실패했습니다.\n${esc(error?.message||String(error))}\n\nPython 서버가 실행 중인지 확인해 주세요.</div>`}

function renderLogin(){
 app.innerHTML=`<div class="login-shell"><div class="login-wrap"><img class="logo" src="./assets/school-logo.webp" alt="학교 로고"><h1 class="login-title">잠신 플래너</h1><div class="login-card"><div class="switch"><button id="studentTab" class="active">학생 로그인</button><button id="teacherTab">교사 로그인</button></div><form id="loginForm" class="form-grid"><div id="studentFields"><input name="studentId" placeholder="학번" value="20101" required><input name="studentName" placeholder="이름" value="김이박" required></div><input name="loginId" class="hidden" placeholder="교사 ID 또는 이름"><input name="password" type="password" placeholder="비밀번호" value="1234" required><button class="btn" type="submit">로그인</button></form><div class="demo-note">데모 계정으로 체험할 수 있습니다.</div></div></div></div>`;
 let mode='student'; const st=document.querySelector('#studentTab'),tt=document.querySelector('#teacherTab'),sf=document.querySelector('#studentFields'),li=document.querySelector('[name=loginId]');
 st.onclick=()=>{mode='student';st.classList.add('active');tt.classList.remove('active');sf.classList.remove('hidden');li.classList.add('hidden')};
 tt.onclick=()=>{mode='teacher';tt.classList.add('active');st.classList.remove('active');sf.classList.add('hidden');li.classList.remove('hidden');li.value='teacher01'};
 document.querySelector('#loginForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget);let u;if(mode==='student'){u=students.find(x=>x.id===f.get('studentId')&&x.name===f.get('studentName')&&x.password===f.get('password'));}else{u=teachers.find(x=>(x.id===f.get('loginId')||x.name===f.get('loginId'))&&x.password===f.get('password'));}if(!u){toast('로그인 정보를 확인해 주세요.');return}state.user={id:u.id,name:u.name,role:u.role};state.page='home';S.saveSession(state.user);render();};
}

const navStudent=[['home','홈'],['timetable','시간표'],['assessments','수행평가'],['progress','수업 진도'],['missed','오늘 놓친 수업'],['calendar','일정'],['ai','AI 도우미'],['my','MY']];
const navTeacher=[['home','홈'],['assessments','수행평가 관리'],['progress','수업 진도 관리'],['calendar','일정/공지'],['my','MY']];
function renderShell(){const nav=state.user.role==='student'?navStudent:navTeacher;app.innerHTML=`<div class="app-shell"><aside class="sidebar"><div class="brand"><img src="./assets/school-logo.webp"><span>잠신 플래너</span></div><div class="nav">${nav.map(([k,l])=>`<button data-page="${k}" class="${state.page===k?'active':''}">${l}</button>`).join('')}</div><div class="sidebar-bottom"><button class="btn secondary" id="resetBtn" style="width:100%">데모 데이터 초기화</button></div></aside><div class="content"><header class="topbar"><input id="globalSearch" class="search" placeholder="수행평가, 수업 진도, 준비물 검색"><div class="user-chip">${esc(state.user.name)} · ${state.user.role==='student'?'학생':'교사'}</div></header><main id="main" class="main"></main></div></div><nav class="mobile-nav">${nav.slice(0,5).map(([k,l])=>`<button data-page="${k}" class="${state.page===k?'active':''}">${l}</button>`).join('')}</nav>`;
 document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{state.page=b.dataset.page;state.selectedAssessment=null;render()});
 document.querySelector('#resetBtn').onclick=()=>{if(confirm('localStorage에 저장된 데모 변경 데이터를 모두 초기화할까요?')){S.resetDemo();state.user=null;render();}};
 document.querySelector('#globalSearch').onkeydown=e=>{if(e.key==='Enter'){showSearch(e.currentTarget.value)}};
 renderPage();
}
function renderPage(){const main=document.querySelector('#main');if(state.user.role==='teacher'){({home:teacherHome,assessments:teacherAssessments,progress:teacherProgress,calendar:teacherCalendar,my:myPage}[state.page]||teacherHome)(main);return}({home:studentHome,timetable:timetablePage,assessments:assessmentPage,progress:progressPage,missed:missedPage,calendar:calendarPage,ai:aiPage,my:myPage}[state.page]||studentHome)(main)}

function studentHome(main){const st=currentStudent(),tt=personalTimetable(st),today=todayKey(),as=studentAssessments(st),prs=studentProgressRecords(st);const todayClasses=tt[today]||[];main.innerHTML=`<div class="card hero"><div class="hero-name">${st.id} ${st.name}</div><div>${st.grade}학년 ${st.classNo}반</div><div class="choice-line">${Object.entries(st.choices).map(([k,v])=>`${k} ${v}`).join(' · ')}</div></div><div class="grid two" style="margin-top:16px"><section class="card"><div class="section-title"><h3>오늘 시간표</h3><span class="pill blue">${today}요일</span></div>${todayClasses.length?`<div class="list">${todayClasses.map((x,i)=>`<div class="list-item row space"><div><strong>${i+1}교시 · ${x.subject}</strong><span class="small muted">${x.block?x.block+' · ':''}${x.teacher} · ${x.room}</span></div><span class="tiny muted">${periodTimes[i+1].split(' ~ ')[0]}</span></div>`).join('')}</div>`:'<div class="empty">오늘은 정규 수업이 없습니다.</div>'}</section><section class="card"><div class="section-title"><h3>오늘 해야 할 일</h3><button class="btn ghost" id="todayAi">AI 추천</button></div>${as.slice(0,3).map(a=>`<div class="list-item"><div class="row space"><strong>${a.title}</strong><span class="pill ${urgency(a.deadline)==='urgent'?'red':urgency(a.deadline)==='soon'?'orange':'yellow'}">${dday(a.deadline)}</span></div><div class="small muted">진행률 ${percent(a)}% · ${a.score}점</div><div class="progress" style="margin-top:7px"><span style="width:${percent(a)}%"></span></div></div>`).join('')}</section><section class="card"><h3>다가오는 수행평가</h3><div class="list">${as.slice(0,4).map(a=>`<div class="list-item row space"><div><strong>${a.title}</strong><span class="small muted">${a.subject}${a.block?' · '+a.block:''} · ${fmt(a.deadline)}</span></div><span class="pill">${dday(a.deadline)}</span></div>`).join('')}</div></section><section class="card"><h3>내일 준비물</h3>${materialsTomorrow(st).length?materialsTomorrow(st).map(x=>`<div class="list-item"><strong>${x.subject}${x.block?' · '+x.block:''}</strong><span class="small muted">${x.materials.join(', ')}</span></div>`).join(''):'<div class="empty">등록된 준비물이 없습니다.</div>'}</section><section class="card"><h3>최근 수업 진도</h3>${prs.slice(0,3).map(p=>`<div class="list-item"><strong>${p.subject}${p.block?' · '+p.block:''}</strong><span class="small muted">${fmt(p.date)} · ${p.learned.join(', ')}</span></div>`).join('')}</section><section class="card"><h3>AI 오늘의 추천</h3><div class="result-box">${todayRecommendation(as)}</div></section></div>`;document.querySelector('#todayAi').onclick=()=>{state.page='ai';state.aiMode='today';render()}}
function materialsTomorrow(st){const t=new Date();t.setDate(t.getDate()+1);const dk=['일','월','화','수','목','금','토'][t.getDay()];const subjects=(personalTimetable(st)[dk]||[]).map(x=>x.subject);const out=[];for(const p of studentProgressRecords(st)){if(subjects.includes(p.subject)&&p.materials?.length&&!out.some(x=>x.subject===p.subject))out.push({subject:p.subject,block:p.block,materials:[...new Set(p.materials)]})}for(const a of studentAssessments(st)){if(subjects.includes(a.subject)&&a.materials?.length&&!out.some(x=>x.subject===a.subject))out.push({subject:a.subject,block:a.block,materials:[...new Set(a.materials)]})}return out}
function todayRecommendation(as){if(!as.length)return '현재 등록된 수행평가가 없습니다.';const a=as[0];return `${a.title}의 마감일이 가장 가깝습니다. 현재 진행률은 ${percent(a)}%이므로 오늘은 ${a.checklist.find((_,i)=>!userProgress(a).checked.includes(i))||'최종 검토'}를 우선 진행하는 것을 추천합니다.`}

function timetablePage(main){const st=currentStudent(),tt=personalTimetable(st);main.innerHTML=`<div class="page-head"><div><h1>개인 시간표</h1><p>학급 기본 시간표와 F/G/H/I/J 선택과목을 결합한 개인 시간표입니다.</p></div></div><div class="card timetable-wrap"><table class="timetable"><thead><tr><th class="period-col">교시</th>${days.map(d=>`<th>${d}</th>`).join('')}</tr></thead><tbody>${[1,2,3,4,5,6,7].map(p=>`<tr><th class="period-col">${p}교시<div class="tiny muted">${periodTimes[p].split(' ~ ')[0]}</div></th>${days.map(d=>{const x=tt[d][p-1];return `<td class="class-cell ${!x?'off':''}">${x?`<div class="subject">${esc(x.subject)}</div>${x.block?`<span class="pill blue">${x.block}</span>`:''}<div class="teacher">${esc(x.teacher)}</div><div class="room">${esc(x.room)}</div>`:'수업 없음'}</td>`}).join('')}</tr>`).join('')}</tbody></table></div>`}

function assessmentPage(main){const st=currentStudent(),all=studentAssessments(st);const filtered=state.assessmentFilter==='전체'?all:state.assessmentFilter==='학급 수업'?all.filter(a=>a.type==='class'):all.filter(a=>a.block===state.assessmentFilter);main.innerHTML=`<div class="page-head"><div><h1>수행평가</h1><p>내가 실제로 수강하는 과목의 수행평가만 표시됩니다.</p></div></div><div class="filters">${['전체','학급 수업','F','G','H','I','J'].map(f=>`<button data-filter="${f}" class="${state.assessmentFilter===f?'active':''}">${f}</button>`).join('')}</div><div class="assessment-grid">${filtered.map(a=>assessmentCard(a)).join('')||'<div class="empty">해당 수행평가가 없습니다.</div>'}</div>`;document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{state.assessmentFilter=b.dataset.filter;render()});document.querySelectorAll('[data-assess]').forEach(b=>b.onclick=()=>assessmentDetail(b.dataset.assess))}
function assessmentCard(a){return `<article class="card assessment-card ${urgency(a.deadline)}" data-assess="${a.id}" style="cursor:pointer"><div class="row space"><span class="pill ${a.block?'blue':''}">${a.subject}${a.block?' · '+a.block:''}</span><span class="pill">${dday(a.deadline)}</span></div><h3 style="margin-top:12px">${a.title}</h3><div class="small muted">${fmt(a.deadline)} · ${a.method} · ${a.score}점</div><div class="row space" style="margin-top:12px"><span class="small">진행률 ${percent(a)}%</span><span class="small muted">${a.teacher}</span></div><div class="progress"><span style="width:${percent(a)}%"></span></div></article>`}
function assessmentDetail(id){
 const a=mergedAssessments().find(x=>x.id===id);if(!a)return;
 const p=userProgress(a);
 document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="modal"><div class="modal"><div class="modal-head"><h2>${a.title}</h2><button class="icon-btn" id="closeModal">✕</button></div><p>${a.description}</p><div class="grid two"><div class="list-item"><strong>일정</strong>${fmt(a.date)} / 마감 ${fmt(a.deadline)} (${dday(a.deadline)})</div><div class="list-item"><strong>제출</strong>${a.method} · ${a.score}점</div><div class="list-item"><strong>준비물</strong>${a.materials.join(', ')}</div><div class="list-item"><strong>담당 교사</strong>${a.teacher}</div></div><h3 style="margin-top:18px">개인 체크리스트 · ${percent(a)}%</h3><div class="progress"><span style="width:${percent(a)}%"></span></div><div style="margin-top:10px">${a.checklist.map((x,i)=>`<label class="check-row"><input data-check="${i}" type="checkbox" ${p.checked.includes(i)?'checked':''}><span>${x}</span></label>`).join('')}</div><div class="section-title" style="margin-top:18px"><h3>AI 분석</h3><button class="btn ghost" id="detailAiBtn">Gemini로 분석</button></div><div id="detailAiResult" class="result-box">버튼을 누르면 현재 수행평가 정보를 Gemini가 분석합니다.</div></div></div>`);
 document.querySelector('#closeModal').onclick=()=>document.querySelector('#modal').remove();
 document.querySelector('#modal').onclick=e=>{if(e.target.id==='modal')e.currentTarget.remove()};
 document.querySelectorAll('[data-check]').forEach(c=>c.onchange=()=>saveCheck(a,+c.dataset.check,c.checked));
 document.querySelector('#detailAiBtn').onclick=async()=>{
  const result=document.querySelector('#detailAiResult');
  result.textContent='Gemini가 분석 중입니다...';
  const text=`수행평가명: ${a.title}\n과목: ${a.subject}${a.block?` (${a.block} 선택수업)`:''}\n수행평가 설명: ${a.description}\n수행평가 날짜: ${a.date}\n제출 마감일: ${a.deadline}\n준비물: ${a.materials.join(', ')}\n제출 방법: ${a.method}\n배점: ${a.score}점\n담당 교사: ${a.teacher}\n체크리스트: ${a.checklist.join(', ')}`;
  try{result.textContent=await analyzeAssessmentAI(text)}
  catch(error){result.textContent=`AI 요청에 실패했습니다.\n${error.message}\n\nPython 서버가 실행 중인지 확인해 주세요.`}
 };
}

function progressPage(main){const st=currentStudent(),prs=studentProgressRecords(st);main.innerHTML=`<div class="page-head"><div><h1>수업 진도</h1><p>실제로 수강하는 과목의 진도, 숙제와 준비물을 확인합니다.</p></div></div><div class="list">${prs.map(progressCard).join('')||'<div class="empty">등록된 진도가 없습니다.</div>'}</div>`}
function progressCard(p){return `<article class="card"><div class="row space"><h3>${p.subject}${p.block?' · '+p.block:''}</h3><span class="pill">${fmt(p.date)}</span></div><div class="grid two"><div><strong>오늘 배운 내용</strong><div class="small muted">${p.learned.join('<br>')}</div></div><div><strong>교과서</strong><div class="small muted">${p.pages||'-'}</div></div><div><strong>숙제</strong><div class="small muted">${p.homework||'-'}</div></div><div><strong>다음 시간 준비물</strong><div class="small muted">${p.materials?.join(', ')||'-'}</div></div></div><div class="list-item" style="margin-top:12px"><strong>전달사항</strong><span class="small muted">${p.notice||'없음'}</span></div></article>`}

function missedPage(main){const st=currentStudent();main.innerHTML=`<div class="page-head"><div><h1>오늘 놓친 수업</h1><p>결석·지각한 날짜의 수업 내용, 숙제, 준비물을 한 번에 확인합니다.</p></div><input id="missedDate" type="date" value="${dateInput(-1)}" style="max-width:180px"></div><div id="missedList"></div>`;const draw=()=>{const date=document.querySelector('#missedDate').value,d=new Date(date+'T12:00:00'),dk=['일','월','화','수','목','금','토'][d.getDay()],classes=personalTimetable(st)[dk]||[],prs=studentProgressRecords(st);document.querySelector('#missedList').innerHTML=classes.length?classes.map((c,i)=>{const p=prs.find(x=>x.date===date&&x.subject===c.subject);return `<div class="card" style="margin-bottom:12px"><div class="row space"><h3>${i+1}교시 · ${c.subject}${c.block?' · '+c.block:''}</h3><span class="tiny muted">${periodTimes[i+1]}</span></div>${p?`<div class="grid two"><div><strong>오늘 배운 내용</strong><div class="small muted">${p.learned.join(', ')}</div></div><div><strong>교과서</strong><div class="small muted">${p.pages}</div></div><div><strong>숙제</strong><div class="small muted">${p.homework||'-'}</div></div><div><strong>준비물</strong><div class="small muted">${p.materials?.join(', ')||'-'}</div></div></div><div class="list-item" style="margin-top:10px"><strong>전달사항</strong><span class="small muted">${p.notice||'-'}</span></div>`:`<div class="empty">아직 수업 내용이 등록되지 않았습니다.</div>`}</div>`}).join(''):'<div class="empty">선택한 날짜에는 정규 수업이 없습니다.</div>'};document.querySelector('#missedDate').onchange=draw;draw()}

function calendarPage(main){renderCalendar(main,false)}
function renderCalendar(main,teacher){const all=[...mergedEvents(),...mergedAssessments().map(a=>({id:'cal-'+a.id,date:a.deadline,type:'assessment',title:a.title}))];let cursor=new Date();cursor.setDate(1);const y=cursor.getFullYear(),m=cursor.getMonth();const first=new Date(y,m,1).getDay(),last=new Date(y,m+1,0).getDate();main.innerHTML=`<div class="page-head"><div><h1>${teacher?'일정 / 공지 관리':'학교 일정'}</h1><p>${y}년 ${m+1}월</p></div>${teacher?'<button class="btn" id="addEventBtn">+ 일정 등록</button>':''}</div><div class="calendar-wrap"><div class="calendar">${['일','월','화','수','목','금','토'].map(x=>`<div class="cal-head">${x}</div>`).join('')}${Array(first).fill('<div class="cal-day muted"></div>').join('')}${Array.from({length:last},(_,i)=>{const date=`${y}-${String(m+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`;const ev=all.filter(e=>e.date===date);return `<div class="cal-day"><div class="cal-num">${i+1}</div>${ev.slice(0,3).map(e=>`<span class="event-dot ${e.type}">${e.title}</span>`).join('')}</div>`}).join('')}</div></div>`;if(teacher)document.querySelector('#addEventBtn').onclick=eventModal}

function aiPage(main){
 const as=studentAssessments();
 main.innerHTML=`<div class="page-head"><div><h1>AI 도우미</h1><p>Gemini API를 이용해 수행평가 분석과 학업 계획을 도와줍니다.</p></div><span class="pill blue">Gemini 연결</span></div><div class="grid two"><div class="ai-card" data-ai="analyze"><h3>수행평가 분석하기</h3><p class="muted small">안내문을 붙여 넣으면 핵심 내용과 해야 할 일을 실제 AI가 정리합니다.</p></div><div class="ai-card" data-ai="today"><h3>오늘 일정 추천받기</h3><p class="muted small">마감일, 진행률, 배점, 작업량을 기준으로 오늘 할 일을 추천합니다.</p></div><div class="ai-card" data-ai="plan"><h3>수행평가 계획 세우기</h3><p class="muted small">현재 등록된 수행평가를 바탕으로 현실적인 진행 계획을 만듭니다.</p></div><div class="ai-card" data-ai="school"><h3>학교생활 질문하기</h3><p class="muted small">현재 앱의 데모 데이터와 localStorage 데이터만 근거로 답합니다.</p></div></div><div id="aiWork" style="margin-top:16px"></div>`;
 document.querySelectorAll('[data-ai]').forEach(x=>x.onclick=()=>drawAi(x.dataset.ai));
 if(state.aiMode){drawAi(state.aiMode);state.aiMode=null}
}

async function drawAi(mode){
 const box=document.querySelector('#aiWork');
 const as=studentAssessments();

 if(mode==='analyze'){
  box.innerHTML=`<div class="card"><h3>수행평가 안내문 분석</h3><textarea id="aiText" placeholder="수행평가 안내문을 붙여 넣으세요."></textarea><button class="btn" id="runAi" style="margin-top:10px">Gemini로 분석하기</button><div id="aiResult" style="margin-top:12px"></div></div>`;
  document.querySelector('#runAi').onclick=async()=>{
   const text=document.querySelector('#aiText').value.trim();
   const result=document.querySelector('#aiResult');
   if(!text){result.innerHTML=aiResultBox('수행평가 안내문을 먼저 입력해 주세요.');return}
   result.innerHTML=aiLoading();
   try{result.innerHTML=aiResultBox(await analyzeAssessmentAI(text))}
   catch(error){result.innerHTML=aiError(error)}
  };
  return;
 }

 if(mode==='today'){
  box.innerHTML=`<div class="card"><div class="section-title"><h3>오늘 추천</h3><span class="pill blue">Gemini 분석</span></div><div id="aiResult">${aiLoading('현재 수행평가를 분석해 오늘 할 일을 정하는 중입니다...')}</div></div>`;
  try{document.querySelector('#aiResult').innerHTML=aiResultBox(await recommendTodayAI(aiAssessmentPayload(as)))}
  catch(error){document.querySelector('#aiResult').innerHTML=aiError(error)}
  return;
 }

 if(mode==='plan'){
  box.innerHTML=`<div class="card"><div class="section-title"><h3>수행평가 계획</h3><span class="pill blue">Gemini 분석</span></div><div id="aiResult">${aiLoading('마감일과 진행률을 바탕으로 계획을 만드는 중입니다...')}</div></div>`;
  try{document.querySelector('#aiResult').innerHTML=aiResultBox(await planAssessmentsAI(aiAssessmentPayload(as)))}
  catch(error){document.querySelector('#aiResult').innerHTML=aiError(error)}
  return;
 }

 box.innerHTML=`<div class="card"><h3>학교생활 질문</h3><input id="schoolQ" placeholder="예: 물리 수행평가 준비물이 뭐야?"><button class="btn" id="askQ" style="margin-top:10px">Gemini에게 질문하기</button><div id="aiResult" style="margin-top:12px"></div><p class="tiny muted" style="margin-top:10px">Gemini에는 현재 로그인한 학생에게 해당하는 잠신 플래너 데이터만 전달합니다. 앱에 없는 정보는 사실처럼 만들지 않도록 제한합니다.</p></div>`;
 document.querySelector('#askQ').onclick=async()=>{
  const question=document.querySelector('#schoolQ').value.trim();
  const result=document.querySelector('#aiResult');
  if(!question){result.innerHTML=aiResultBox('질문을 입력해 주세요.');return}
  result.innerHTML=aiLoading('잠신 플래너 데이터를 확인해 답변하는 중입니다...');
  try{result.innerHTML=aiResultBox(await askSchoolAI(question,aiSchoolContext()))}
  catch(error){result.innerHTML=aiError(error)}
 };
}

function myPage(main){const u=state.user.role==='student'?currentStudent():currentTeacher();main.innerHTML=`<div class="page-head"><div><h1>MY</h1><p>현재 로그인한 데모 계정 정보입니다.</p></div></div><div class="card" style="max-width:650px">${state.user.role==='student'?`<div class="list"><div class="list-item"><strong>${u.name} · ${u.id}</strong><span class="small muted">${u.grade}학년 ${u.classNo}반</span></div>${Object.entries(u.choices).map(([k,v])=>`<div class="list-item row space"><strong>${k} 선택수업</strong><span>${v}</span></div>`).join('')}</div>`:`<div class="list"><div class="list-item"><strong>${u.name} · ${u.id}</strong></div><div class="list-item">담당 과목: ${u.subjects.join(', ')}</div><div class="list-item">담당 선택수업: ${u.choiceBlocks.join(', ')}</div></div>`}<button class="btn danger" id="logoutBtn" style="margin-top:18px">로그아웃</button></div>`;document.querySelector('#logoutBtn').onclick=()=>{S.clearSession();state.user=null;render()}}

function teacherHome(main){const t=currentTeacher();main.innerHTML=`<div class="card hero"><div class="hero-name">${t.name} 선생님</div><div class="choice-line">담당 과목 ${t.subjects.join(', ')} · 선택수업 ${t.choiceBlocks.join(', ')}</div></div><div class="grid three" style="margin-top:16px"><div class="card"><div class="metric">${S.teacherAssessments().length}</div><div class="muted">추가한 수행평가</div></div><div class="card"><div class="metric">${S.teacherProgress().length}</div><div class="muted">추가한 수업 진도</div></div><div class="card"><div class="metric">${S.teacherEvents().length}</div><div class="muted">추가한 일정/공지</div></div></div><div class="card" style="margin-top:16px"><h3>교사 데모 기능</h3><p class="muted">등록한 정보는 이 브라우저의 localStorage에 저장되며, 로그아웃 후 학생 계정으로 로그인하면 즉시 확인할 수 있습니다.</p></div>`}
function teacherAssessmentCard(a){return `<article class="card assessment-card ${urgency(a.deadline)}" data-assess="${a.id}" style="cursor:pointer"><div class="row space"><span class="pill ${a.block?'blue':''}">${esc(a.subject)}${a.block?' · '+esc(a.block):''}</span><span class="pill">${dday(a.deadline)}</span></div><h3 style="margin-top:12px">${esc(a.title)}</h3><div class="small muted">${fmt(a.deadline)} · ${esc(a.method||'제출 방법 미등록')} · ${a.score||0}점</div><div class="row space" style="margin-top:12px"><span class="small muted">${esc(a.type==='choice'?'선택수업':'학급 수업')}</span><span class="small muted">${esc(a.teacher||'담당 교사 미등록')}</span></div></article>`}
function teacherAssessments(main){const t=currentTeacher(),own=mergedAssessments().filter(a=>t.subjects.includes(a.subject));main.innerHTML=`<div class="page-head"><div><h1>수행평가 관리</h1><p>담당 과목에 해당하는 수행평가만 관리합니다.</p></div><button class="btn" id="addAssessBtn">+ 수행평가 등록</button></div><div class="assessment-grid">${own.map(a=>teacherAssessmentCard(a)).join('')||'<div class="empty">담당 과목에 등록된 수행평가가 없습니다.</div>'}</div>`;document.querySelector('#addAssessBtn').onclick=assessmentModal;document.querySelectorAll('[data-assess]').forEach(x=>x.onclick=()=>assessmentDetailTeacher(x.dataset.assess))}
function assessmentModal(){document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="modal"><form class="modal" id="assessForm"><div class="modal-head"><h2>수행평가 등록</h2><button type="button" class="icon-btn" id="closeModal">✕</button></div><div class="form-cols" style="margin-top:14px"><input name="title" class="full" placeholder="수행평가명" required><input name="subject" value="물리" readonly><select name="block"><option value="F">F 선택수업</option></select><input name="deadline" type="date" value="${dateInput(5)}" required><input name="score" type="number" value="20" placeholder="배점"><input name="materials" placeholder="준비물 (쉼표 구분)" value="계산기, 필기구"><input name="method" placeholder="제출 방법" value="보고서 파일 제출"><textarea name="description" class="full" placeholder="수행평가 설명"></textarea><input name="checklist" class="full" value="내용 확인, 주제 선정, 자료 조사, 작성, 최종 검토, 제출" placeholder="체크리스트 (쉼표 구분)"></div><button class="btn" style="margin-top:14px">저장</button></form></div>`);document.querySelector('#closeModal').onclick=()=>document.querySelector('#modal').remove();document.querySelector('#assessForm').onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.currentTarget));const a={id:uid('ta'),title:f.title,subject:f.subject,type:'choice',block:f.block,grade:2,classNo:null,date:f.deadline,deadline:f.deadline,score:+f.score||0,materials:f.materials.split(',').map(x=>x.trim()).filter(Boolean),method:f.method,description:f.description,teacher:currentTeacher().name,registered:dateInput(0),workload:3,checklist:f.checklist.split(',').map(x=>x.trim()).filter(Boolean)};S.saveTeacherAssessments([...S.teacherAssessments(),a]);document.querySelector('#modal').remove();toast('수행평가를 등록했습니다.');render()}}
function assessmentDetailTeacher(id){const a=mergedAssessments().find(x=>x.id===id);document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="modal"><div class="modal"><div class="modal-head"><h2>${a.title}</h2><button class="icon-btn" id="closeModal">✕</button></div><p>${a.description}</p><div class="list-item">${a.subject} · ${a.block||'학급'} · ${fmt(a.deadline)} · ${a.score}점</div><p class="small muted">기본 데모 항목은 원본 데이터 보호를 위해 직접 삭제하지 않습니다. 교사가 추가한 항목은 localStorage에 저장됩니다.</p></div></div>`);document.querySelector('#closeModal').onclick=()=>document.querySelector('#modal').remove()}
function teacherProgress(main){const t=currentTeacher(),own=mergedProgress().filter(p=>t.subjects.includes(p.subject));main.innerHTML=`<div class="page-head"><div><h1>수업 진도 관리</h1><p>수업 진도, 숙제, 준비물, 전달사항을 등록합니다.</p></div><button class="btn" id="addProgressBtn">+ 수업 진도 등록</button></div><div class="list">${own.map(progressCard).join('')}</div>`;document.querySelector('#addProgressBtn').onclick=progressModal}
function progressModal(){document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="modal"><form class="modal" id="progressForm"><div class="modal-head"><h2>수업 진도 등록</h2><button type="button" class="icon-btn" id="closeModal">✕</button></div><div class="form-cols" style="margin-top:14px"><input name="date" type="date" value="${dateInput(0)}" required><input name="subject" value="물리" readonly><select name="block"><option value="F">F 선택수업</option></select><input name="pages" placeholder="교과서 페이지"><textarea name="learned" class="full" placeholder="오늘 배운 내용 (줄바꿈 구분)"></textarea><input name="homework" placeholder="숙제"><input name="materials" placeholder="다음 시간 준비물 (쉼표 구분)"><textarea name="notice" class="full" placeholder="전달사항"></textarea></div><button class="btn" style="margin-top:14px">저장</button></form></div>`);document.querySelector('#closeModal').onclick=()=>document.querySelector('#modal').remove();document.querySelector('#progressForm').onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.currentTarget));const p={id:uid('tp'),date:f.date,subject:f.subject,type:'choice',block:f.block,grade:2,classNo:null,learned:f.learned.split('\n').map(x=>x.trim()).filter(Boolean),pages:f.pages,homework:f.homework,materials:f.materials.split(',').map(x=>x.trim()).filter(Boolean),notice:f.notice,teacher:currentTeacher().name};S.saveTeacherProgress([...S.teacherProgress(),p]);document.querySelector('#modal').remove();toast('수업 진도를 등록했습니다.');render()}}
function teacherCalendar(main){renderCalendar(main,true)}
function eventModal(){document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="modal"><form class="modal" id="eventForm"><div class="modal-head"><h2>일정 / 공지 등록</h2><button type="button" class="icon-btn" id="closeModal">✕</button></div><div class="form-grid" style="margin-top:14px"><input name="date" type="date" value="${dateInput(2)}"><select name="type"><option value="school">학교 행사</option><option value="exam">시험</option><option value="other">기타 일정</option></select><input name="title" placeholder="일정 또는 공지 제목" required></div><button class="btn" style="margin-top:14px">저장</button></form></div>`);document.querySelector('#closeModal').onclick=()=>document.querySelector('#modal').remove();document.querySelector('#eventForm').onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.currentTarget));S.saveTeacherEvents([...S.teacherEvents(),{id:uid('te'),...f}]);document.querySelector('#modal').remove();toast('일정을 등록했습니다.');render()}}

function showSearch(q){q=q.trim();if(!q)return;const a=mergedAssessments().filter(x=>JSON.stringify(x).includes(q));const p=mergedProgress().filter(x=>JSON.stringify(x).includes(q));const e=mergedEvents().filter(x=>JSON.stringify(x).includes(q));document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="modal"><div class="modal"><div class="modal-head"><h2>검색 결과</h2><button class="icon-btn" id="closeModal">✕</button></div><p class="muted">“${esc(q)}” 검색 결과</p><h3>수행평가</h3>${a.map(x=>`<div class="list-item"><strong>${x.title}</strong><span class="small muted">${x.subject} · ${fmt(x.deadline)}</span></div>`).join('')||'<div class="empty">없음</div>'}<h3>수업 진도</h3>${p.map(x=>`<div class="list-item"><strong>${x.subject}</strong><span class="small muted">${x.learned.join(', ')}</span></div>`).join('')||'<div class="empty">없음</div>'}<h3>일정/공지</h3>${e.map(x=>`<div class="list-item"><strong>${x.title}</strong><span class="small muted">${x.date}</span></div>`).join('')||'<div class="empty">없음</div>'}</div></div>`);document.querySelector('#closeModal').onclick=()=>document.querySelector('#modal').remove()}

function render(){state.user=state.user||S.session();state.user?renderShell():renderLogin()}
render();
