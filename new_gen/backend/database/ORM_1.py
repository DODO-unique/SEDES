from typing import Dict
from utils.error_handler import ErrorCodes, initiate_error_handler
from utils.validators.payload_validator import UserName, Mail
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from database.orm_schema import Users
from sqlalchemy import select, Column
from sqlalchemy.exc import MultipleResultsFound
from utils.logger import loggy

def log(msg: str) -> None:
    loggy("database/ORM_1", msg)

URL = "postgresql+asyncpg://victor:yomama@localhost:5506/deferred"

engine = create_async_engine(URL)
#not much but note that asyncsession() are pulling the above engine from global scope. 

async def check_user_exists(field: Column[str], value: UserName | Mail) -> bool: #type: ignore
    try:
        async with AsyncSession(engine) as session:
                stmt = select(Users).where(field == value.value)
                log(f"Executing DB query to check if {field} with value {value} exists.")
                result = await session.execute(stmt)
                log("DB query executed, processing result.")
                is_taken = result.scalar_one_or_none() is not None
                log(f"DB query processed, is_taken: {is_taken}")
                return is_taken
    except MultipleResultsFound as e:
        initiate_error_handler(message="FATAL: Multiple entries of unique field found with the same username. Check DB integrity.", errCode=ErrorCodes.UNEXPECTED_DUPLICATE_ENTRY.value, error=e)
    except Exception as e:
        initiate_error_handler(message="Server error while checking username and email availability.", errCode=ErrorCodes.BROAD_DATABASE_ERROR.value, error=e)



async def insert_user(uname: UserName, mail: Mail, password_hash: str) -> Dict[str, str]:
    '''
    trusting for the caller to send a direct password_hash, encoded in utf-8
    '''
    try:
        async with AsyncSession(engine) as session:
            new_user = Users(uname=uname.value, email=mail.value, password_hash=password_hash)
            session.add(new_user)
            await session.commit()
    except Exception as e:
        initiate_error_handler(message="Server error while inserting new user.", errCode=ErrorCodes.BROAD_DATABASE_ERROR.value, error=e)
    
    return {"message": "User registered successfully."}


async def fetch_password(uname: UserName) -> None | str:
    '''
    digest is bytes. we will store password as string so we decode with utf-8 then. So to read it you encode it.
    store -> decode(utf-8)
    read -> encode(utf-8)
    
    we return encoded hash.
    '''

    password = None
    
    # poll the DB for the user
    try:
        async with AsyncSession(engine) as session:
            stmt = select(Users).where(Users.uname == uname.value)
            db_result = await session.execute(stmt)
            row = db_result.scalar_one_or_none()
            if row:
                password = row.password_hash
            else:
                initiate_error_handler(message="User not found.", errCode=ErrorCodes.USER_NOT_FOUND.value, error=ValueError("User not found."))
            
    except MultipleResultsFound as e:
        initiate_error_handler(message="FATAL: Multiple entries of unique field found with the same username. Check DB integrity.", errCode=ErrorCodes.UNEXPECTED_DUPLICATE_ENTRY.value, error=e)
    except Exception as e:
        initiate_error_handler(message="Server error while checking password.", errCode=ErrorCodes.BROAD_DATABASE_ERROR.value, error=e)

    result = None
    if password is not None:
        result = password.encode('utf-8')

    return result

    