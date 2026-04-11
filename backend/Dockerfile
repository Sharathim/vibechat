FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    ffmpeg \
    nodejs \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

RUN pip install --upgrade yt-dlp

COPY . .

EXPOSE 7002

CMD ["gunicorn", "--worker-class", "eventlet", "--workers", "1", "--timeout", "60", "--bind", "0.0.0.0:7002", "app:create_app()"]