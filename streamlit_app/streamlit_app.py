import streamlit as st
 
st.set_page_config(page_title="잠신 플래너", layout="wide")
 
BACKEND_URL = st.secrets.get("BACKEND_URL", "https://your-app-name.onrender.com")
 
# Streamlit 자체 여백/헤더를 없애고, iframe이 브라우저 창 전체를 꽉 채우도록 함
# (내용이 짧아도 남는 검은 배경이 보이지 않음, 내부는 iframe 안에서 자체 스크롤)
st.markdown(
    f"""
    <style>
        header {{visibility: hidden;}}
        .block-container {{padding: 0 !important; max-width: 100% !important;}}
        [data-testid="stAppViewContainer"] {{padding: 0 !important;}}
        iframe {{
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            border: none;
        }}
    </style>
    <iframe src="{BACKEND_URL}"></iframe>
    """,
    unsafe_allow_html=True,
)