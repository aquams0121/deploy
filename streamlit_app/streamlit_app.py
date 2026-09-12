import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(page_title="잠신 플래너", layout="wide")

# Streamlit 기본 여백/패딩을 없애서 화면이 최대한 그대로 보이게 함
st.markdown(
    """
    <style>
        .block-container {padding: 0 !important; max-width: 100% !important;}
        header {visibility: hidden;}
        iframe {border: none;}
    </style>
    """,
    unsafe_allow_html=True,
)

# Render 등에 배포한 백엔드(=index.html까지 함께 서빙하는 FastAPI 서버) 주소.
# 1) Streamlit Cloud > 앱 설정 > Secrets 에 아래처럼 넣어두면 코드 수정 없이 바꿀 수 있음:
#    BACKEND_URL = "https://your-app-name.onrender.com"
# 2) secrets가 없으면 아래 기본값을 직접 수정해서 사용.
BACKEND_URL = st.secrets.get("BACKEND_URL", "https://your-app-name.onrender.com")

components.iframe(src=BACKEND_URL, height=1000, scrolling=True)
