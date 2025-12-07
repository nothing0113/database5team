from pydantic import BaseModel
from uuid import UUID
from typing import List, Optional
from enum import Enum
from datetime import datetime

class ProductType(str, Enum):
    READY_MADE = "READY_MADE"
    CUSTOM = "CUSTOM"

class MemberType(str, Enum):
    USER = "USER"
    OWNER = "OWNER"

# --- Member Schemas ---
class MemberBase(BaseModel):
    member_id: str 
    name: str
    contact: str = "010-0000-0000"
    type: MemberType = MemberType.USER

class MemberCreate(MemberBase):
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class Member(MemberBase):
    money: int = 0
    location_agree: bool = True

    class Config:
        orm_mode = True

# --- Flower Schemas ---
class Flower(BaseModel):
    flower_id: UUID
    name: str
    meaning: Optional[str] = None
    color: Optional[str] = None
    care_guide: Optional[str] = None

    class Config:
        orm_mode = True

# --- Product Schemas ---
class ProductBase(BaseModel):
    name: str
    price: int
    type: ProductType

class Product(ProductBase):
    product_id: UUID
    store_id: UUID

    class Config:
        orm_mode = True

class ProductCreate(ProductBase):
    store_id: UUID

# --- Store Schemas (위로 올림, Order에서 쓰기 위해) ---
class StoreBase(BaseModel):
    name: str
    address: str
    business_hours: Optional[str] = None
    has_pickup_box: bool = False

class StoreCreate(StoreBase):
    owner_id: str

class Store(StoreBase):
    store_id: UUID
    owner_id: str
    products: List[Product] = []
    review_count: int = 0
    average_rating: float = 0.0

    class Config:
        orm_mode = True

class StoreDetail(Store):
    pass

# --- Order Schemas ---
class OrderItemCreate(BaseModel):
    product_id: UUID
    quantity: int

class OrderCreate(BaseModel):
    store_id: UUID
    member_id: str
    items: List[OrderItemCreate]
    user_prompt: Optional[str] = None
    letter_content: Optional[str] = None
    recipe: Optional[str] = None
    care_guide: Optional[List[str]] = None
    delivery_request: Optional[str] = None # 배달 요청사항 추가

class OrderItem(BaseModel):
    item_id: UUID
    product_id: UUID
    quantity: int
    snapshot_price: int
    
    # 상품 정보 포함
    product: Optional[Product] = None 

    class Config:
        orm_mode = True

class Order(BaseModel):
    order_id: UUID
    store_id: UUID
    member_id: str
    status: str
    order_date: datetime
    delivery_request: Optional[str] = None # 배달 요청사항 추가
    items: List[OrderItem] = []
    
    # 가게 정보 포함
    store: Optional[StoreBase] = None

    class Config:
        orm_mode = True

# --- Review Schemas ---
class ReviewBase(BaseModel):
    rating: int
    content: Optional[str] = None
    writer_id: str 

class Review(ReviewBase):
    review_id: UUID
    created_at: datetime

    class Config:
        orm_mode = True

class ReviewCreate(ReviewBase):
    order_id: UUID

# --- Owner Management Schemas ---
class StockCreate(BaseModel):
    store_id: UUID
    flower_name: str
    quantity: int
    input_date: Optional[datetime] = None

class StockUpdate(BaseModel):
    quantity: int

class OrderStatusUpdate(BaseModel):
    status: str

# --- AI Recommendation Schemas ---
class RecommendedFlowerDetail(BaseModel):
    role: str
    name: str
    reason: str

class AvailableStoreInfo(BaseModel):
    store_id: UUID
    name: str
    address: str
    product_id: Optional[UUID] = None
    product_price: Optional[int] = None

class RecommendedBouquetResponse(BaseModel):
    title: str
    color_theme: str
    flowers: List[RecommendedFlowerDetail]
    letter: str
    care_guide: List[str]
    available_stores: List[AvailableStoreInfo]
