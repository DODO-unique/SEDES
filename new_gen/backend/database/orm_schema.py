from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, Text, TIMESTAMP, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID, ENUM
from uuid import uuid4


class Base(DeclarativeBase):
    pass

enum = ENUM('pending', 'sent', 'failed', name="enum_status")

class Users(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    uname = Column(Text, nullable=False,unique=True)
    email = Column(Text, unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("now()"))

class RunningSessions(Base):
    __tablename__ = "running_sessions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    token = Column(UUID(as_uuid=True), unique=True, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("now()"))
    expires_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("now() + interval '1 hour'"))
    

class EncryptionKeys(Base):
    __tablename__ = "encryption_keys"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    encryption_key = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("now()"))
