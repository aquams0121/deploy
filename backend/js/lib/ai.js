// 로컬(Live Server 등)에서는 127.0.0.1:8000의 FastAPI 서버를 바라보고,
// Render 등에 배포되어 프론트/백엔드가 같은 도메인에서 서빙될 때는 같은 origin을 사용한다.
const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_BASE = isLocal ? 'http://127.0.0.1:8000' : '';

async function request(path, payload) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload),
  });

  let data = null;
  try { data = await response.json(); } catch {}

  if (!response.ok) {
    const message = data?.detail || `AI 서버 오류 (${response.status})`;
    throw new Error(message);
  }
  return data.result;
}

export const analyzeAssessmentAI = (text) =>
  request('/api/analyze-assessment', {text});

export const recommendTodayAI = (assessments) =>
  request('/api/recommend-today', {assessments});

export const planAssessmentsAI = (assessments) =>
  request('/api/plan-assessments', {assessments});

export const askSchoolAI = (question, context) =>
  request('/api/school-question', {question, context});
