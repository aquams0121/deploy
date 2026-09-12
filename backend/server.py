import os
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from google import genai
from pydantic import BaseModel

load_dotenv()

API_KEY = os.getenv('GEMINI_API_KEY')
MODEL = os.getenv('GEMINI_MODEL', 'gemini-3.8-flash')
# Streamlit에 올릴 iframe이 이 서버를 다른 도메인에서 불러올 수 있으므로,
# 배포 시 ALLOWED_ORIGINS 환경변수로 Streamlit 앱 주소를 콤마로 구분해 넣어줄 수 있다.
# (예: ALLOWED_ORIGINS=https://your-app.streamlit.app)
EXTRA_ORIGINS = [o.strip() for o in os.getenv('ALLOWED_ORIGINS', '').split(',') if o.strip()]

if not API_KEY:
    raise RuntimeError('GEMINI_API_KEY가 .env(로컬) 또는 배포 환경 변수에 설정되어 있지 않습니다.')

client = genai.Client(api_key=API_KEY)
app = FastAPI(title='Jamsin Planner Gemini API')

# Live Server(localhost/127.0.0.1, 포트가 달라도 허용) + 배포된 Streamlit 도메인 허용
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r'^https?://(localhost|127\.0\.0\.1)(:\d+)?$',
    allow_origins=EXTRA_ORIGINS,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


class TextRequest(BaseModel):
    text: str


class AssessmentListRequest(BaseModel):
    assessments: list[dict[str, Any]]


class SchoolQuestionRequest(BaseModel):
    question: str
    context: dict[str, Any]


def run_gemini(prompt: str) -> str:
    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt,
        )
        text = (response.text or '').strip()
        if not text:
            raise ValueError('Gemini가 빈 응답을 반환했습니다.')
        return text
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f'Gemini API 호출 실패: {exc}') from exc


@app.get('/api/status')
def status():
    return {
        'message': '잠신 플래너 Gemini 서버가 실행 중입니다.',
        'model': MODEL,
    }


@app.post('/api/test')
def test_gemini(request: TextRequest):
    return {'result': run_gemini(request.text)}


@app.post('/api/analyze-assessment')
def analyze_assessment(request: TextRequest):
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail='수행평가 안내문을 입력해 주세요.')

    prompt = f'''너는 대한민국 고등학생의 수행평가 이해와 계획을 돕는 학업 도우미다.
아래 안내문에 실제로 적힌 내용만 근거로 분석하라. 안내문에 없는 날짜, 분량, 제출 방식, 준비물 등을 임의로 만들어내지 마라.
수행평가의 정답이나 완성본을 대신 작성하는 것이 아니라 학생이 해야 할 일을 이해하고 계획하도록 돕는 것이 목적이다.

반드시 다음 구조로 한국어로 답하라.
[핵심 내용]
2~3문장 요약

[해야 할 일]
☐ 형태의 체크리스트 4~8개

[중요 조건]
안내문에 명시된 분량, 형식, 제출 방식, 날짜, 준비물, 평가 요소 등을 항목으로 정리. 명시되지 않은 항목은 쓰지 않음.

[놓치기 쉬운 부분]
실수하기 쉬운 조건이나 반드시 확인해야 할 점을 정리. 근거가 없으면 "안내문에서 추가 조건은 확인되지 않았습니다."라고 답함.

수행평가 안내문:
{text}
'''
    return {'result': run_gemini(prompt)}


@app.post('/api/recommend-today')
def recommend_today(request: AssessmentListRequest):
    prompt = f'''너는 고등학생의 오늘 공부 계획을 세워 주는 학업 도우미다.
아래 JSON 데이터에는 학생에게 실제로 등록된 수행평가만 들어 있다.
데이터 밖의 수행평가나 학교 정보를 만들어내지 마라.

우선순위 판단 기준:
- 마감일까지 남은 날짜
- 배점
- 현재 진행률
- 예상 작업량
- 아직 완료하지 않은 체크리스트

오늘 하루에 현실적으로 할 수 있도록 최대 3개의 할 일만 추천하라.
각 항목은 "1. 수행평가명 - 오늘 할 일" 형식으로 쓰고, 바로 아래 줄에 왜 우선해야 하는지 짧게 설명하라.
마지막에 "오늘의 핵심" 한 문장도 덧붙여라.

수행평가 데이터:
{request.assessments}
'''
    return {'result': run_gemini(prompt)}


@app.post('/api/plan-assessments')
def plan_assessments(request: AssessmentListRequest):
    prompt = f'''너는 고등학생의 수행평가 계획을 세우는 학업 도우미다.
아래 JSON 데이터에 있는 수행평가만 사용하고, 존재하지 않는 일정이나 요구사항은 만들지 마라.
마감일, 현재 진행률, 예상 작업량, 미완료 체크리스트를 고려해 계획을 세워라.

한국어로 다음 형식으로 답하라.
[우선순위]
1~3개 수행평가를 우선순위대로 정리하고 이유를 한 문장씩 설명

[오늘]
실행할 일

[내일]
실행할 일

[그 이후]
마감 전까지의 간단한 단계

한 날에 과도하게 많은 일을 몰아넣지 마라.

수행평가 데이터:
{request.assessments}
'''
    return {'result': run_gemini(prompt)}


# API 라우트들을 먼저 등록한 뒤, 나머지 경로는 프론트엔드 정적 파일(index.html 등)로 서빙한다.
# 이렇게 하면 Render 같은 곳에 이 서버 하나만 올려도 화면 + AI API가 같은 주소에서 함께 동작한다.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app.mount('/assets', StaticFiles(directory=os.path.join(BASE_DIR, 'assets')), name='assets')
app.mount('/js', StaticFiles(directory=os.path.join(BASE_DIR, 'js')), name='js')


@app.get('/styles.css')
def styles():
    return FileResponse(os.path.join(BASE_DIR, 'styles.css'))


@app.get('/')
def serve_index():
    return FileResponse(os.path.join(BASE_DIR, 'index.html'))


@app.post('/api/school-question')
def school_question(request: SchoolQuestionRequest):
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail='질문을 입력해 주세요.')

    prompt = f'''너는 "잠신 플래너" 안의 학교생활 정보를 설명하는 도우미다.
아래 [앱 데이터]가 유일한 사실 근거다.
앱 데이터에 없는 수행평가, 수업 진도, 시간표, 일정, 준비물, 공지를 추측하거나 만들어내지 마라.
질문에 답할 근거가 부족하면 반드시 "현재 잠신 플래너에 등록된 정보만으로는 확인할 수 없습니다."라고 분명히 말하라.
학생에게 필요하면 관련 날짜, D-Day, 과목, 준비물, 숙제 등을 간단히 정리해도 된다.
한국어로 간결하게 답하라.

[학생 질문]
{question}

[앱 데이터]
{request.context}
'''
    return {'result': run_gemini(prompt)}


if __name__ == '__main__':
    import uvicorn
    # Render는 PORT 환경변수로 사용할 포트를 알려준다.
    port = int(os.getenv('PORT', 8000))
    uvicorn.run(app, host='0.0.0.0', port=port)
