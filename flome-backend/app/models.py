import uuid
import enum
from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, Text, DateTime, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base

# Enums
class MemberType(str, enum.Enum):
    USER = "USER"
    OWNER = "OWNER"

class ProductType(str, enum.Enum):
    READY_MADE = "READY_MADE"
    CUSTOM = "CUSTOM"

class StockStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    SOLD_OUT = "SOLD_OUT"

class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    PREPARING = "PREPARING"
    PICKED_UP = "PICKED_UP"

# Models

class Member(Base):
    __tablename__ = "members"

    member_id = Column(String, primary_key=True, index=True)  # Email/ID
    password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    contact = Column(String, nullable=False)
    type = Column(SAEnum(MemberType), nullable=False)
    location_agree = Column(Boolean, default=False)
    money = Column(Integer, default=0, nullable=False)

    # Relationships
    stores = relationship("Store", back_populates="owner")
    orders = relationship("Order", back_populates="member")


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

    # Relationships
    member = relationship("Member", back_populates="orders")
    store = relationship("Store", back_populates="orders")
    ai_content = relationship("AIContent", back_populates="order", uselist=False)


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
