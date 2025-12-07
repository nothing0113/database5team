import json
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from typing import List

from .database import engine, Base, SessionLocal
from . import models, schemas, ai_service

# Create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="FloMe Backend")

# --- CORS 설정 ---
origins = [
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dependency ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- API Endpoints ---

@app.get("/")
def read_root():
    return {"message": "Welcome to FloMe API"}

# --- Auth & Member ---

@app.post("/signup", response_model=schemas.Member)
def signup(member: schemas.MemberCreate, db: Session = Depends(get_db)):
    db_member = db.query(models.Member).filter(models.Member.member_id == member.member_id).first()
    if db_member:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_member = models.Member(
        member_id=member.member_id,
        password=member.password, 
        name=member.name,
        contact=member.contact,
        type=member.type,
        money=1000000
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return new_member

@app.post("/login", response_model=schemas.Member)
def login(login_req: schemas.LoginRequest, db: Session = Depends(get_db)):
    member = db.query(models.Member).filter(models.Member.member_id == login_req.email).first()
    if not member or member.password != login_req.password:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return member

@app.get("/me", response_model=schemas.Member)
def read_me(member_id: str, db: Session = Depends(get_db)):
    member = db.query(models.Member).filter(models.Member.member_id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="User not found")
    return member


# --- Store ---

@app.get("/stores", response_model=List[schemas.Store])
def read_stores(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Store -> Order -> Review 까지 로드
    stores = db.query(models.Store).options(
        joinedload(models.Store.products),
        joinedload(models.Store.orders).joinedload(models.Order.review)
    ).offset(skip).limit(limit).all()
    
    for store in stores:
        # 해당 가게의 모든 주문 중 리뷰가 있는 것만 수집
        reviews = [order.review for order in store.orders if order.review]
        
        store.review_count = len(reviews)
        if reviews:
            total_rating = sum(review.rating for review in reviews)
            store.average_rating = round(total_rating / len(reviews), 1)
        else:
            store.average_rating = 0.0
            
    return stores

@app.get("/stores/{store_id}", response_model=schemas.StoreDetail)
def read_store(store_id: str, db: Session = Depends(get_db)):
    store = db.query(models.Store).options(joinedload(models.Store.products)).filter(models.Store.store_id == store_id).first()
    if store is None:
        raise HTTPException(status_code=404, detail="Store not found")
    return store

@app.post("/stores", response_model=schemas.Store)
def create_store(store: schemas.StoreCreate, db: Session = Depends(get_db)):
    db_store = models.Store(**store.dict())
    db.add(db_store)
    db.commit()
    db.refresh(db_store)
    return db_store

# --- Order ---

@app.post("/orders", response_model=schemas.Order)
def create_order(order_req: schemas.OrderCreate, db: Session = Depends(get_db)):
    # 0. 주문 총액 계산 및 재고 확인/차감
    total_amount = 0
    items_to_process = []
    
    # Store stock information to update
    stocks_to_update = {}

    for item in order_req.items:
        product = db.query(models.Product).filter(models.Product.product_id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with ID {item.product_id} not found.") 

        # Find stock for the product in the specified store
        stock = db.query(models.Stock).filter(
            models.Stock.store_id == order_req.store_id,
            models.Stock.product_id == item.product_id
        ).first()

        # [시연용 치트키] 재고 없으면 자동 생성/충전
        if not stock:
            stock = models.Stock(
                store_id=order_req.store_id,
                product_id=item.product_id,
                quantity=1000,
                status=models.StockStatus.AVAILABLE
            )
            db.add(stock)
            db.commit()
            db.refresh(stock)
        elif stock.quantity < item.quantity:
            stock.quantity += 1000
            db.add(stock)
            db.commit()
            db.refresh(stock)
        
        # Deduct stock temporarily and store for later update
        stock.quantity -= item.quantity
        stocks_to_update[stock.stock_id] = stock # Keep track of stocks to update

        total_amount += product.price * item.quantity
        items_to_process.append((product, item.quantity))

    if total_amount == 0:
        raise HTTPException(status_code=400, detail="No valid items in order.")

    # Apply stock updates
    for stock_id in stocks_to_update:
        db.add(stocks_to_update[stock_id])
    
    # 1. 멤버 잔액 확인 및 차감
    member = db.query(models.Member).filter(models.Member.member_id == order_req.member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    if member.money < total_amount:
        raise HTTPException(status_code=400, detail=f"Insufficient balance")
    
    member.money -= total_amount
    db.add(member)

    # 2. Order 생성
    new_order = models.Order(
        member_id=order_req.member_id,
        store_id=order_req.store_id,
        status=models.OrderStatus.PAID,
        delivery_request=order_req.delivery_request # 요청사항 저장
    )
    db.add(new_order)
    db.flush() 

    # 3. OrderItem 생성
    for product, qty in items_to_process:
        order_item = models.OrderItem(
            order_id=new_order.order_id,
            product_id=product.product_id,
            quantity=qty,
            snapshot_price=product.price
        )
        db.add(order_item)

    # 4. Payment 생성
    payment = models.Payment(
        order_id=new_order.order_id,
        amount=total_amount,
        method="CARD"
    )
    db.add(payment)

    # 5. AIContent 생성 (if provided)
    if order_req.user_prompt or order_req.letter_content or order_req.recipe or order_req.care_guide:
        ai_content = models.AIContent(
            order_id=new_order.order_id,
            user_prompt=order_req.user_prompt,
            letter_content=order_req.letter_content,
            recipe=order_req.recipe,
            care_guide=json.dumps(order_req.care_guide) if order_req.care_guide else None
        )
        db.add(ai_content)
    
    db.commit()
    db.refresh(new_order)
    
    return new_order

# 주문 내역 조회
@app.get("/orders", response_model=List[schemas.Order])
def read_orders(member_id: str, db: Session = Depends(get_db)):
    orders = db.query(models.Order).options(
            joinedload(models.Order.store),
            joinedload(models.Order.items).joinedload(models.OrderItem.product)
        ).filter(models.Order.member_id == member_id).order_by(models.Order.order_date.desc()).all()
    return orders

# --- Owner Management APIs ---

@app.get("/stores/{store_id}/stocks")
def read_store_stocks(store_id: str, db: Session = Depends(get_db)):
    stocks = db.query(models.Stock).options(joinedload(models.Stock.flower)).filter(models.Stock.store_id == store_id).all()
    return stocks

@app.get("/stores/{store_id}/products", response_model=List[schemas.Product])
def read_store_products(store_id: str, db: Session = Depends(get_db)):
    products = db.query(models.Product).filter(models.Product.store_id == store_id).all()
    return products

@app.put("/stores/{store_id}", response_model=schemas.Store)
def update_store(store_id: str, store_update: schemas.StoreBase, db: Session = Depends(get_db)):
    store = db.query(models.Store).filter(models.Store.store_id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    # StoreBase의 필드들을 업데이트
    for field, value in store_update.dict(exclude_unset=True).items():
        setattr(store, field, value)
    
    db.commit()
    db.refresh(store)
    return store

@app.post("/products", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    # 1. 상품 생성
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    # 2. 초기 재고 자동 생성 (시연용 기본값 100개)
    initial_stock = models.Stock(
        store_id=product.store_id,
        product_id=db_product.product_id,
        quantity=100, 
        status=models.StockStatus.AVAILABLE
    )
    db.add(initial_stock)
    db.commit()

    return db_product

@app.get("/flowers", response_model=List[schemas.Flower])
def read_flowers(db: Session = Depends(get_db)):
    return db.query(models.Flower).all()

@app.post("/stocks")
def create_stock(stock_in: schemas.StockCreate, db: Session = Depends(get_db)):
    # 1. 꽃 찾기 또는 생성
    flower = db.query(models.Flower).filter(models.Flower.name == stock_in.flower_name).first()
    if not flower:
        flower = models.Flower(name=stock_in.flower_name)
        db.add(flower)
        db.commit()
        db.refresh(flower)
    
    # 2. 재고 생성
    new_stock = models.Stock(
        store_id=stock_in.store_id,
        flower_id=flower.flower_id,
        quantity=stock_in.quantity,
        stocking_date=stock_in.input_date or datetime.now()
    )
    db.add(new_stock)
    db.commit()
    db.refresh(new_stock)
    return new_stock

@app.put("/stocks/{stock_id}")
def update_stock(stock_id: str, stock_update: schemas.StockUpdate, db: Session = Depends(get_db)):
    stock = db.query(models.Stock).filter(models.Stock.stock_id == stock_id).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    
    stock.quantity = stock_update.quantity
    db.commit()
    return {"message": "Stock updated", "stock_id": stock_id}

@app.delete("/stocks/{stock_id}")
def delete_stock(stock_id: str, db: Session = Depends(get_db)):
    stock = db.query(models.Stock).filter(models.Stock.stock_id == stock_id).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    
    db.delete(stock)
    db.commit()
    return {"message": "Stock deleted"}

@app.get("/owner/orders", response_model=List[schemas.Order])
def read_owner_orders(store_id: str, db: Session = Depends(get_db)):
    orders = db.query(models.Order).options(
        joinedload(models.Order.items).joinedload(models.OrderItem.product),
        joinedload(models.Order.member)
    ).filter(models.Order.store_id == store_id).order_by(models.Order.order_date.desc()).all()
    return orders

@app.put("/orders/{order_id}/status")
def update_order_status(order_id: str, status_update: schemas.OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = status_update.status
    db.commit()
    return {"message": "Order status updated", "new_status": order.status}

# --- Review APIs ---

@app.get("/stores/{store_id}/reviews", response_model=List[schemas.Review])
def read_store_reviews(store_id: str, db: Session = Depends(get_db)):
    # Review -> Order -> Store 조인
    reviews = db.query(models.Review).join(models.Order).filter(
        models.Order.store_id == store_id
    ).options(joinedload(models.Review.writer)).all()
    return reviews

@app.post("/reviews", response_model=schemas.Review)
def create_review(review: schemas.ReviewCreate, db: Session = Depends(get_db)):
    # 주문 확인
    order = db.query(models.Order).filter(models.Order.order_id == review.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # 이미 리뷰가 있는지 확인 (선택)
    existing_review = db.query(models.Review).filter(models.Review.order_id == review.order_id).first()
    if existing_review:
        raise HTTPException(status_code=400, detail="Review already exists for this order")

    db_review = models.Review(**review.dict())
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review

# app/main.py (일부분)

@app.post("/api/recommend")
def recommend_bouquet(situation: str, db: Session = Depends(get_db)):
    return StreamingResponse(
        ai_service.generate_bouquet_recipe(db, situation), 
        media_type="application/x-ndjson"
    )