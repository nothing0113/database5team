from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from typing import List

from .database import engine, Base, SessionLocal
from . import models, schemas

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
    stores = db.query(models.Store).options(joinedload(models.Store.products)).offset(skip).limit(limit).all()
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
    # 0. 주문 총액 계산
    total_amount = 0
    items_to_process = []

    for item in order_req.items:
        product = db.query(models.Product).filter(models.Product.product_id == item.product_id).first()
        if not product:
            continue 
        total_amount += product.price * item.quantity
        items_to_process.append((product, item.quantity))

    if total_amount == 0:
        raise HTTPException(status_code=400, detail="No valid items in order")

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
        status=models.OrderStatus.PAID 
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