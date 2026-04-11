FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN pip install --upgrade yt-dlp

EXPOSE 7002

CMD ["gunicorn", "--worker-class", "eventlet", "--workers", "1", "--timeout", "60", "--bind", "0.0.0.0:7002", "app:create_app()"]
