import uuid
import enum
from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, Text, DateTime, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base

# Enums (열거형 정의)
class MemberType(str, enum.Enum):
    USER = "USER"
    OWNER = "OWNER"

class ProductType(str, enum.Enum):
    READY_MADE = "READY_MADE"
    CUSTOM = "CUSTOM"

class StockStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    SOLD_OUT = "SOLD_OUT"
    DISCARDED = "DISCARDED"

class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    PREPARING = "PREPARING"
    PICKED_UP = "PICKED_UP"
    CANCELED = "CANCELED"

# Models (테이블 정의)

class Member(Base):
    __tablename__ = "members"

    member_id = Column(String, primary_key=True, index=True)  # Email/ID
    password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    contact = Column(String, nullable=False)
    type = Column(SAEnum(MemberType), nullable=False, default=MemberType.USER)
    location_agree = Column(Boolean, default=False)
    money = Column(Integer, default=0, nullable=False)

    # Relationships
    stores = relationship("Store", back_populates="owner")
    orders = relationship("Order", back_populates="member")
    reviews = relationship("Review", back_populates="writer") # [추가] 내가 쓴 리뷰들


class Store(Base):
    __tablename__ = "stores"

    store_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(String, ForeignKey("members.member_id"), nullable=False)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    business_hours = Column(String, nullable=True)
    has_pickup_box = Column(Boolean, default=False)

    # Relationships
    owner = relationship("Member", back_populates="stores")
    products = relationship("Product", back_populates="store")
    stocks = relationship("Stock", back_populates="store")
    orders = relationship("Order", back_populates="store")


class Flower(Base):
    __tablename__ = "flowers"

    flower_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    meaning = Column(String, nullable=True)  # Flower language
    color = Column(String, nullable=True)
    care_guide = Column(Text, nullable=True)

    # Relationships
    stocks = relationship("Stock", back_populates="flower")


class Product(Base):
    __tablename__ = "products"

    product_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.store_id"), nullable=False)
    name = Column(String, nullable=False)
    price = Column(Integer, nullable=False)
    type = Column(SAEnum(ProductType), nullable=False)

    # Relationships
    store = relationship("Store", back_populates="products")
    stocks = relationship("Stock", back_populates="product")


class Stock(Base):
    __tablename__ = "stocks"

    stock_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.store_id"), nullable=False)
    flower_id = Column(UUID(as_uuid=True), ForeignKey("flowers.flower_id"), nullable=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.product_id"), nullable=True)
    quantity = Column(Integer, default=0)
    stocking_date = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(SAEnum(StockStatus), default=StockStatus.AVAILABLE)

    # Relationships
    store = relationship("Store", back_populates="stocks")
    flower = relationship("Flower", back_populates="stocks")
    product = relationship("Product", back_populates="stocks")


class Order(Base):
    __tablename__ = "orders"

    order_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_id = Column(String, ForeignKey("members.member_id"), nullable=False)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.store_id"), nullable=False)
    order_date = Column(DateTime(timezone=True), server_default=func.now())
    pickup_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(SAEnum(OrderStatus), default=OrderStatus.PENDING)
    delivery_request = Column(String, nullable=True) # 배달/픽업 요청사항 (방법/시간)

    # Relationships
    member = relationship("Member", back_populates="orders")
    store = relationship("Store", back_populates="orders")
    ai_content = relationship("AIContent", back_populates="order", uselist=False)
    
    # [추가] 새로 추가된 테이블들과의 관계
    items = relationship("OrderItem", back_populates="order")
    payment = relationship("Payment", back_populates="order", uselist=False)
    review = relationship("Review", back_populates="order", uselist=False)


# [추가] 주문 상세 테이블 (어떤 상품을 몇 개 샀는지)
class OrderItem(Base):
    __tablename__ = "order_items"

    item_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.order_id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.product_id"), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    snapshot_price = Column(Integer, nullable=False) # 주문 시점 가격 저장

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product") # 상품 정보 참조


# [추가] 결제 테이블
class Payment(Base):
    __tablename__ = "payments"

    payment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.order_id"), unique=True, nullable=False)
    amount = Column(Integer, nullable=False)
    method = Column(String, nullable=False) # CARD, CASH 등
    paid_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    order = relationship("Order", back_populates="payment")


class AIContent(Base):
    __tablename__ = "ai_contents"

    content_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.order_id"), unique=True, nullable=False)
    user_prompt = Column(Text, nullable=True)
    letter_content = Column(Text, nullable=True)
    recipe = Column(Text, nullable=True)
    care_guide = Column(Text, nullable=True)

    # Relationships
    order = relationship("Order", back_populates="ai_content")


# [추가] 리뷰 테이블
class Review(Base):
    __tablename__ = "reviews"

    review_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.order_id"), unique=True, nullable=False)
    writer_id = Column(String, ForeignKey("members.member_id"), nullable=False) # 작성자
    rating = Column(Integer, nullable=False) # 별점 1~5
    content = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    order = relationship("Order", back_populates="review")
    writer = relationship("Member", back_populates="reviews")