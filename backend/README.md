# 잠신 플래너 - Gemini 연결 버전

기존 잠신 플래너의 로그인, 시간표, 수행평가, 수업 진도, localStorage 기능은 그대로 두고 AI 도우미를 실제 Gemini API에 연결한 로컬 테스트 버전입니다.

## 1. 준비

프로젝트 최상위 폴더에 `.env` 파일을 만드세요.

```env
GEMINI_API_KEY=본인_API_키
GEMINI_MODEL=gemini-3.8-flash
```

`.env`는 ZIP에 포함되어 있지 않습니다. 기존에 만든 `.env`가 있다면 그대로 복사하면 됩니다.

## 2. 패키지 설치

```powershell
python -m pip install -r requirements.txt
```

`python` 대신 `py` 명령을 쓰는 PC라면:

```powershell
py -m pip install -r requirements.txt
```

## 3. Gemini 서버 실행

```powershell
python -m uvicorn server:app --reload --port 8000
```

또는:

```powershell
py -m uvicorn server:app --reload --port 8000
```

브라우저에서 `http://127.0.0.1:8000`을 열었을 때 서버 실행 메시지가 나오면 정상입니다.

## 4. 웹앱 실행

VS Code에서 `index.html`을 Live Server로 실행하세요. 일반적으로 `http://127.0.0.1:5500`에서 열립니다.

학생 데모 계정:
- 학번: 20101
- 이름: 김이박
- 비밀번호: 1234

교사 데모 계정:
- ID: teacher01 또는 김교사
- 비밀번호: 1234

## 5. 실제 Gemini가 연결된 기능

- AI 도우미 > 수행평가 분석하기
- AI 도우미 > 오늘 일정 추천받기
- AI 도우미 > 수행평가 계획 세우기
- AI 도우미 > 학교생활 질문하기
- 수행평가 상세 > Gemini로 분석

학교생활 질문하기는 현재 로그인한 학생에게 실제로 표시되는 시간표, 수행평가, 수업 진도, 일정, 준비물 데이터를 Gemini에 함께 전달하도록 구성했습니다. 데이터에 없는 학교 정보는 추측하지 말도록 서버 프롬프트에서 제한합니다.

## 주의

- `.env`를 GitHub 등에 올리지 마세요.
- 브라우저 JavaScript에는 Gemini API 키가 들어가지 않습니다.
- Python 서버가 꺼져 있으면 AI 기능만 실패하고 나머지 localStorage 기반 기능은 사용할 수 있습니다.
