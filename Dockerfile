FROM python:3.11-slim

WORKDIR /app

# 安裝系統依賴
RUN apt-get update && apt-get install -y \
    gcc \
    pkg-config \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 安裝 Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

# 🔧 新增：定義構建時參數 (從 Railway 環境變數接收)
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_JAMENDO_CLIENT_ID
ARG VITE_API_BASE_URL
ARG VITE_SPOTIFY_CLIENT_ID
ARG VITE_SPOTIFY_REDIRECT_URI

# 複製所有檔案
COPY . .

# 安裝 Python 依賴
RUN pip install --no-cache-dir -r backend/requirements.txt

# 🔧 重要：在構建前端前設置環境變數
# 將 ARG 轉換為 ENV，讓 Vite 能夠讀取
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
ENV VITE_JAMENDO_CLIENT_ID=${VITE_JAMENDO_CLIENT_ID}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_SPOTIFY_CLIENT_ID=${VITE_SPOTIFY_CLIENT_ID}
ENV VITE_SPOTIFY_REDIRECT_URI=${VITE_SPOTIFY_REDIRECT_URI}

# 🔧 調試：顯示環境變數 (生產環境可以移除)
RUN echo "構建時環境變數檢查:" && \
    echo "VITE_GOOGLE_CLIENT_ID: ${VITE_GOOGLE_CLIENT_ID}" && \
    echo "VITE_JAMENDO_CLIENT_ID: ${VITE_JAMENDO_CLIENT_ID}" && \
    echo "VITE_API_BASE_URL: ${VITE_API_BASE_URL}"

# 構建前端 (現在環境變數已經可用)
RUN cd frontend && npm ci && npm run build

# 🔧 新增：驗證構建結果中是否包含環境變數
RUN echo "檢查構建結果..." && \
    if [ -f "frontend/dist/index.html" ]; then \
        echo "✅ 前端構建成功"; \
        ls -la frontend/dist/; \
    else \
        echo "❌ 前端構建失敗"; \
        exit 1; \
    fi

# 設定 Django 環境變數
ENV DJANGO_SETTINGS_MODULE=music_streaming.settings
ENV PYTHONPATH=/app/backend

# 創建靜態文件目錄
RUN mkdir -p /app/backend/staticfiles

EXPOSE $PORT

# 使用 ENTRYPOINT + CMD 組合
ENTRYPOINT ["bash", "-c"]
CMD ["cd backend && gunicorn music_streaming.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120"]