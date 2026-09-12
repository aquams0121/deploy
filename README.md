# 잠신 플래너 배포용 저장소

이 저장소 하나를 GitHub에 올리고, 아래 두 서비스에 각각 연결하면 됩니다.

```
backend/         → Render에 배포 (Gemini API 서버 + 화면(index.html) 서빙)
streamlit_app/   → Streamlit Community Cloud에 배포 (backend 화면을 그대로 보여주는 창)
```

자세한 절차는 대화(또는 함께 받은 안내)의 단계별 설명을 따라 하세요. 핵심만 요약하면:

1. `backend/`를 Render의 Web Service로 배포하고, 환경 변수에 `GEMINI_API_KEY`, `GEMINI_MODEL`을 설정
2. Render 배포가 끝나면 나온 주소(`https://xxx.onrender.com`)를 복사
3. `streamlit_app/`를 Streamlit Community Cloud에 배포하고, Secrets에
   ```
   BACKEND_URL = "https://xxx.onrender.com"
   ```
   를 추가
4. Render 환경 변수에 `ALLOWED_ORIGINS=https://your-streamlit-app.streamlit.app` 추가 후 재배포

`.env` 파일은 `.gitignore`에 포함되어 있으므로 GitHub에는 절대 올라가지 않습니다. API 키는 오직 Render의 환경 변수에만 넣으세요.
