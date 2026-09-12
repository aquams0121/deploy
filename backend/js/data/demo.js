const addDays=(n)=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
export const students=[{id:'20101',name:'김이박',password:'1234',grade:2,classNo:1,role:'student',choices:{F:'물리',G:'화학',H:'기하',I:'데이터과학',J:'도시의 미래탐구'}}];
export const teachers=[{id:'teacher01',name:'김교사',password:'1234',role:'teacher',subjects:['물리'],grades:[2],classes:[1],choiceBlocks:['F']}];
export const periodTimes={1:'08:20 ~ 09:10',2:'09:20 ~ 10:10',3:'10:20 ~ 11:10',4:'11:20 ~ 12:10',5:'13:10 ~ 14:00',6:'14:10 ~ 15:00',7:'15:10 ~ 16:00'};
const c=(subject,teacher,room,block=null)=>({subject,teacher,room,block});
export const baseTimetable={
 월:[c('화법과 언어','박국어','2-1'),c('미적분','이수학','2-1'),c('영어','최영어','2-1'),c('F 선택수업','선택교사','이동수업','F'),c('G 선택수업','선택교사','이동수업','G'),c('체육','정체육','체육관')],
 화:[c('H 선택수업','선택교사','이동수업','H'),c('화법과 언어','박국어','2-1'),c('영어','최영어','2-1'),c('미적분','이수학','2-1'),c('I 선택수업','선택교사','이동수업','I'),c('한국사','한역사','2-1'),c('자율','담임','2-1')],
 수:[c('미적분','이수학','2-1'),c('J 선택수업','선택교사','이동수업','J'),c('영어','최영어','2-1'),c('F 선택수업','선택교사','이동수업','F'),c('화법과 언어','박국어','2-1'),c('창체','담임','2-1')],
 목:[c('G 선택수업','선택교사','이동수업','G'),c('미적분','이수학','2-1'),c('H 선택수업','선택교사','이동수업','H'),c('영어','최영어','2-1'),c('I 선택수업','선택교사','이동수업','I'),c('한국사','한역사','2-1'),c('체육','정체육','체육관')],
 금:[c('J 선택수업','선택교사','이동수업','J'),c('화법과 언어','박국어','2-1'),c('미적분','이수학','2-1'),c('영어','최영어','2-1'),c('F 선택수업','선택교사','이동수업','F'),c('진로','담임','2-1')]
};
export const choiceMeta={물리:{teacher:'김교사',room:'과학실1'},화학:{teacher:'박화학',room:'과학실2'},기하:{teacher:'이수학',room:'수학실'},데이터과학:{teacher:'최정보',room:'컴퓨터실'},'도시의 미래탐구':{teacher:'정사회',room:'사회실'}};
export const assessments=[
 {id:'a1',subject:'물리',title:'운동 분석 탐구 보고서',type:'choice',block:'F',grade:2,classNo:null,date:addDays(3),deadline:addDays(3),materials:['계산기','필기구'],method:'보고서 파일 제출',score:20,description:'물체의 운동을 분석하고 관련 물리 개념을 이용하여 탐구 보고서를 작성한다.',teacher:'김교사',registered:addDays(-5),workload:4,checklist:['수행평가 내용 확인','주제 선정','자료 조사','보고서 작성','최종 검토','제출']},
 {id:'a2',subject:'영어',title:'진로 발표 PPT',type:'class',grade:2,classNo:1,date:addDays(5),deadline:addDays(5),materials:['발표 자료'],method:'수업 시간 발표',score:15,description:'관심 진로를 영어로 소개하는 발표를 준비한다.',teacher:'최영어',registered:addDays(-3),workload:3,checklist:['주제 선정','자료 조사','대본 작성','PPT 제작','발표 연습']},
 {id:'a3',subject:'데이터과학',title:'데이터 분석 미니 프로젝트',type:'choice',block:'I',grade:2,classNo:null,date:addDays(9),deadline:addDays(9),materials:['노트북'],method:'프로젝트 파일 제출',score:25,description:'주어진 데이터셋을 분석하고 시각화 결과를 제출한다.',teacher:'최정보',registered:addDays(-2),workload:5,checklist:['주제 확인','데이터 정리','분석','시각화','설명 작성','제출']}
];
export const progressRecords=[
 {id:'p1',date:addDays(-1),subject:'물리',type:'choice',block:'F',grade:2,classNo:null,learned:['포물선 운동','수평 방향과 수직 방향 운동'],pages:'72~77쪽',homework:'78쪽 1~3번',materials:['계산기'],notice:'탐구 보고서 수행평가 예정',teacher:'김교사'},
 {id:'p2',date:addDays(-1),subject:'영어',type:'class',grade:2,classNo:1,learned:['발표 표현 정리','도입 문장 연습'],pages:'44~47쪽',homework:'발표 주제 정하기',materials:['영어 교과서'],notice:'다음 주 발표 일정 안내 예정',teacher:'최영어'}
];
export const events=[
 {id:'e1',date:addDays(6),type:'exam',title:'영어 단어 시험'},
 {id:'e2',date:addDays(12),type:'school',title:'학교 동아리 발표회'},
 {id:'e3',date:addDays(15),type:'other',title:'진로 상담 신청 마감'}
];
