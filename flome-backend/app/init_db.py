# app/init_db.py
import uuid
from datetime import datetime, timedelta
import random
from app.database import SessionLocal, engine
from app import models

# 1. 테이블 생성 (스키마에 맞춰 테이블 생성)
models.Base.metadata.create_all(bind=engine)

def init_data():
    db = SessionLocal()
    
    try:
        print("🔄 FloMe 데이터베이스 초기화 및 지식 베이스 구축 시작...")

        # ==========================================
        # 1. 회원 데이터 (MEMBER) - [문서: 엔티티 정의서 1번]
        # ==========================================
        # 1-1. 사장님 (Owner)
        owner_id = "owner@flome.com"
        owner = db.query(models.Member).filter_by(member_id=owner_id).first()
        if not owner:
            owner = models.Member(
                member_id=owner_id,
                password="hashed_password", 
                name="김플로",
                contact="010-1234-5678",
                type=models.MemberType.OWNER,
                location_agree=True
            )
            db.add(owner)
            print(f"✅ 사장님 계정 생성: {owner.name}")

        # 1-2. 고객 (User)
        user_id = "user@flome.com"
        user = db.query(models.Member).filter_by(member_id=user_id).first()
        if not user:
            user = models.Member(
                member_id=user_id,
                password="hashed_password",
                name="이손님",
                contact="010-9876-5432",
                type=models.MemberType.USER,
                location_agree=True,
                money=50000
            )
            db.add(user)
            print(f"✅ 고객 계정 생성: {user.name}")
        
        db.commit()

        # ==========================================
        # 2. 가맹점 데이터 (STORE) - [문서: 엔티티 정의서 2번]
        # ==========================================
        store_name = "행복한 꽃집"
        store = db.query(models.Store).filter_by(name=store_name).first()
        if not store:
            store = models.Store(
                owner_id=owner_id,
                name=store_name,
                address="서울 강남구 테헤란로 123",
                business_hours="09:00 - 20:00",
                has_pickup_box=True # [문서: 업무 기술서 - 무인 픽업함]
            )
            db.add(store)
            print(f"✅ 가맹점 생성: {store.name}")
            db.commit()
            db.refresh(store)

        # ==========================================
        # 3. 꽃 지식 베이스 (FLOWER) - [문서: 엔티티 정의서 3번 & 업무 기술서 RAG]
        # ==========================================
        # AI가 추천 로직에 사용할 기초 데이터입니다. 문서의 '전문 지식' 부분을 반영합니다.
        flower_knowledge_base = [
            {
                "name": "빨간 장미",
                "meaning": "불타는 사랑, 열정, 아름다움",
                "color": "Red",
                "care_guide": "줄기 끝을 사선으로 자르고 물을 매일 갈아주세요. 직사광선은 피하는 것이 좋습니다."
            },
            {
                "name": "하얀 튤립", # [문서: 업무 기술서 예시 - 용서, 사과]
                "meaning": "새로운 시작, 용서, 순결",
                "color": "White",
                "care_guide": "온도에 민감하므로 서늘한 곳에 두세요. 줄기가 휘어질 수 있으니 높은 화병이 좋습니다."
            },
            {
                "name": "노란 프리지아",
                "meaning": "당신의 시작을 응원합니다, 천진난만",
                "color": "Yellow",
                "care_guide": "향기가 강하며 에틸렌 가스에 민감합니다. 시든 꽃은 바로 제거해주세요."
            },
            {
                "name": "리시안셔스",
                "meaning": "변치 않는 사랑, 우아함",
                "color": "Purple",
                "care_guide": "줄기가 약해 꺾이기 쉬우니 조심스럽게 다뤄주세요. 물올림이 중요합니다."
            },
            {
                "name": "안개꽃",
                "meaning": "맑은 마음, 사랑의 성공",
                "color": "White",
                "care_guide": "드라이플라워로 만들기 좋습니다. 통풍이 잘 되는 곳에 두면 예쁘게 마릅니다."
            },
            {
                "name": "메리골드",
                "meaning": "반드시 오고야 말 행복",
                "color": "Orange",
                "care_guide": "잎에서 특유의 향이 납니다. 물에 닿은 잎은 썩기 쉬우니 제거하고 꽂아주세요."
            }
        ]

        flower_objs = []
        for data in flower_knowledge_base:
            flower = db.query(models.Flower).filter_by(name=data["name"]).first()
            if not flower:
                flower = models.Flower(
                    name=data["name"],
                    meaning=data["meaning"],
                    color=data["color"],
                    care_guide=data["care_guide"]
                )
                db.add(flower)
                print(f"🌸 꽃 지식 데이터 등록: {flower.name} ({flower.meaning})")
            flower_objs.append(flower) # 나중에 재고 등록할 때 쓰려고 저장
        
        db.commit()
        # 방금 넣은 꽃 객체들을 다시 최신 상태로 로드 (ID 확보)
        for f in flower_objs:
            db.refresh(f)

        # ==========================================
        # 4. 재고 등록 (STOCK) - [문서: 엔티티 정의서 5번]
        # ==========================================
        # 사장님이 보유한 원자재(꽃) 재고를 등록합니다.
        # 문서에 따르면 "AI가 재고 리스트 중에서... 추천"한다고 되어 있으므로 재고가 있어야 합니다.
        
        for flower in flower_objs:
            # 이미 재고가 있는지 확인
            existing_stock = db.query(models.Stock).filter_by(store_id=store.store_id, flower_id=flower.flower_id).first()
            
            if not existing_stock:
                stock = models.Stock(
                    store_id=store.store_id,
                    flower_id=flower.flower_id, # 원자재와 연결
                    product_id=None,            # 완제품 아님
                    quantity=random.randint(10, 50), # 10~50송이 랜덤 보유
                    stocking_date=datetime.now(),
                    status=models.StockStatus.AVAILABLE
                )
                db.add(stock)
        
        print(f"✅ '{store.name}'에 꽃 원자재 재고 등록 완료")
        db.commit()

        # ==========================================
        # 5. 상품 등록 (PRODUCT & STOCK) - [문서: 엔티티 정의서 4번]
        # ==========================================
        # 사장님이 만들어둔 완제품(Ready-made)
        product_name = "화해의 튤립 꽃다발"
        product = db.query(models.Product).filter_by(name=product_name).first()
        
        if not product:
            product = models.Product(
                store_id=store.store_id,
                name=product_name,
                price=45000,
                type=models.ProductType.READY_MADE
            )
            db.add(product)
            db.commit()
            db.refresh(product)

            # 완제품 재고 등록 (완제품은 FLOWER_ID는 Null, PRODUCT_ID가 존재)
            prod_stock = models.Stock(
                store_id=store.store_id,
                flower_id=None,
                product_id=product.product_id,
                quantity=3,
                stocking_date=datetime.now(),
                status=models.StockStatus.AVAILABLE
            )
            db.add(prod_stock)
            print(f"✅ 완제품 상품 및 재고 등록: {product.name}")
            db.commit()

        print("🎉 모든 데이터 초기화가 완료되었습니다.")

    except Exception as e:
        print(f"❌ 데이터 초기화 중 오류 발생: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_data()