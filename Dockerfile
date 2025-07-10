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

# 複製所有檔案
COPY . .

# 安裝 Python 依賴
RUN pip install --no-cache-dir -r backend/requirements.txt

# 構建前端
RUN cd frontend && npm ci && npm run build

# 設定環境變數
ENV DJANGO_SETTINGS_MODULE=music_streaming.settings
ENV PYTHONPATH=/app/backend

EXPOSE $PORT

# 使用 ENTRYPOINT + CMD 組合
ENTRYPOINT ["bash", "-c"]
CMD ["cd backend && gunicorn music_streaming.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120"]

RUN mkdir -p /app/backend/staticfiles