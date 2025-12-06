# Python 3.10 슬림 버전 사용
FROM python:3.10-slim

# 작업 디렉토리 설정
WORKDIR /code

# 의존성 파일 복사 및 설치
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# 앱 코드 복사
COPY ./app /code/app

# .env 파일 복사 (선택 사항, docker-compose에서 주입하는 것을 권장하지만 여기서는 포함)
COPY ./.env /code/.env

# 서버 실행 커맨드 (Docker Compose에서 override 가능)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
