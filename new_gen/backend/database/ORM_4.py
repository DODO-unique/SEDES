from database.orm_schema import Users, EncryptionKeys
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from cryptography.encryption_src_file import generate_key
from utils.error_handler import initiate_error_handler, ErrorCodes
from utils.logger import loggy
from uuid import UUID

def log(msg: str) -> None:
    loggy("database/ORM_4", msg)

URL = "postgresql+asyncpg://victor:yomama@localhost:5506/deferred"
engine = create_async_engine(URL)

async def store_encryption_key(user_id: UUID, key: str) -> str:
    try:
        async with AsyncSession(engine) as session:
            new_key_entry = EncryptionKeys(user_id=user_id, encryption_key=key)
            session.add(new_key_entry)
            await session.commit()
            log("Stored new encryption key for user.")
            return key
    except Exception as e:
        initiate_error_handler(message="Could not store encryption key", errCode=ErrorCodes.BROAD_DATABASE_ERROR.value, error=e)

async def fetch_encryption_keys(user_id: UUID):
    try:
        async with AsyncSession(engine) as session:
            stmt = select(EncryptionKeys).where(EncryptionKeys.user_id == user_id)
            result = await session.execute(stmt)
            return result.scalars().all()
    except Exception as e:
        initiate_error_handler(message="Could not fetch encryption keys", errCode=ErrorCodes.BROAD_DATABASE_ERROR.value, error=e)

async def remove_encryption_key(key_id: UUID):
    try:
        async with AsyncSession(engine) as session:
            stmt = select(EncryptionKeys).where(EncryptionKeys.id == key_id)
            result = await session.execute(stmt)
            key_entry = result.scalar_one_or_none()
            if key_entry:
                session.delete(key_entry)
                await session.commit()
                log(f"Removed encryption key {key_id}")
                return True
            return False
    except Exception as e:
        initiate_error_handler(message="Could not remove encryption key", errCode=ErrorCodes.BROAD_DATABASE_ERROR.value, error=e)

# ----------------- NEW HOOKS FOR ENCODE/DECODE -----------------

async def get_or_create_encryption_key(user_id: UUID) -> bytes:
    """
    For Encoding:
    Fetches the latest (or only) encryption key for a user.
    If none exists, generates a new key, saves it in the DB, and returns it.
    """
    keys = await fetch_encryption_keys(user_id)
    if keys:
        # For now, we keep one encryption key for one user. Just use the first one found.
        # String back to bytes for Fernet
        return keys[0].encryption_key.encode('utf-8') 
    
    # Needs a new key
    log("User has no key. Generating one for encoding.")
    new_key_bytes = generate_key()
    new_key_str = new_key_bytes.decode('utf-8')
    await store_encryption_key(user_id, new_key_str)
    
    return new_key_bytes

async def get_encryption_key_or_fail(user_id: UUID) -> bytes:
    """
    For Decoding:
    Fetches the encryption key for a user. 
    If none exists, throws an error because they cannot decrypt the message.
    """
    keys = await fetch_encryption_keys(user_id)
    if not keys:
        initiate_error_handler(
            message="No encryption key exists for this user. Cannot decrypt.", 
            errCode=ErrorCodes.KEY_NOT_FOUND.value, 
            error=ValueError("User has no encryption key stored")
        )
    return keys[0].encryption_key.encode('utf-8')
