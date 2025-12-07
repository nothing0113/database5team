from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# 환경 변수 로드 (없으면 기본값 사용)
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@db:5432/flome_db")

# 로컬 테스트용 (Docker 내부가 아닐 경우 localhost로 변경 필요할 수 있음)
# 만약 에러가 나면 localhost로 시도
if "db:5432" in DATABASE_URL:
    # Docker 내부 통신용 URL. 로컬에서 실행 시 localhost로 변경해야 할 수 있음.
    # 하지만 지금 agent는 로컬 쉘에서 실행 중이므로 docker-compose port mapping을 확인해야 함.
    # docker-compose.yml을 보면 5432:5432 매핑됨.
    DATABASE_URL = "postgresql://postgres:password@localhost:5432/flome_db"

def add_column():
    engine = create_engine(DATABASE_URL)
    try:
        with engine.connect() as connection:
            # 트랜잭션 시작
            with connection.begin():
                print("Attempting to add delivery_request column...")
                connection.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_request VARCHAR;"))
                print("Success: Column added.")
    except Exception as e:
        print(f"Error adding column: {e}")

if __name__ == "__main__":
    add_column()