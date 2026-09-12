const K={session:'jp_session',studentProgress:'jp_student_progress',teacherAssess:'jp_teacher_assess',teacherProgress:'jp_teacher_progress',teacherEvents:'jp_teacher_events'};
export const get=(k,fallback)=>{try{return JSON.parse(localStorage.getItem(k))??fallback}catch{return fallback}};
export const set=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
export const session=()=>get(K.session,null);export const saveSession=(v)=>set(K.session,v);export const clearSession=()=>localStorage.removeItem(K.session);
export const studentProgress=()=>get(K.studentProgress,{});export const saveStudentProgress=(v)=>set(K.studentProgress,v);
export const teacherAssessments=()=>get(K.teacherAssess,[]);export const saveTeacherAssessments=(v)=>set(K.teacherAssess,v);
export const teacherProgress=()=>get(K.teacherProgress,[]);export const saveTeacherProgress=(v)=>set(K.teacherProgress,v);
export const teacherEvents=()=>get(K.teacherEvents,[]);export const saveTeacherEvents=(v)=>set(K.teacherEvents,v);
export function resetDemo(){Object.values(K).forEach(k=>localStorage.removeItem(k));}
