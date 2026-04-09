from utils.validators.master_validator import UserName
from database.orm_schema import Users, RunningSessions
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from utils.error_handler import initiate_error_handler, ErrorCodes
from uuid import UUID
from sqlalchemy.exc import NoResultFound  # Import for specific exception handling
from utils.logger import loggy

def log(msg: str) -> None:
    loggy("database/ORM_2", msg)

URL = "postgresql+asyncpg://victor:yomama@localhost:5506/deferred"
engine = create_async_engine(URL)


async def fetch_line(uname: UserName) -> Users: #type: ignore
    '''
    expects verified username. Returns the object.
    '''
    try:
        async with AsyncSession(engine) as session:
            stmt = select(Users).where(Users.uname == uname.value)
            line_object = await session.execute(stmt)
            result = line_object.scalar_one()
            return result
    except NoResultFound as e:
        # Handle case where no user is found (even for verified uname, in case of data inconsistency)
        initiate_error_handler(message="User not found", errCode=ErrorCodes.USER_NOT_FOUND.value, error=e)
    except Exception as e:
        initiate_error_handler(message="could not fetch user", errCode=ErrorCodes.BROAD_DATABASE_ERROR.value, error=e)

async def new_session(session_token: UUID, user: Users) -> bool | None:
    try:
        async with AsyncSession(engine) as session:
            new_session_entry = RunningSessions(token = session_token, user_id = user.id)
            session.add(new_session_entry)
            await session.commit()
            return True
    except Exception as e:
        initiate_error_handler(message="could not create session", errCode=ErrorCodes.CANNOT_CREATE_SESSION.value, error=e)

async def does_session_exist(user_row: Users):
    try:
        async with AsyncSession(engine) as session:
            stmt = select(RunningSessions).where(RunningSessions.user_id == user_row.id)
            result = await session.execute(stmt)
            return result.scalar_one_or_none() is not None
    except Exception as e:
        initiate_error_handler(message="could not check session", errCode=ErrorCodes.BROAD_DATABASE_ERROR.value, error=e)

async def get_session(user_row: Users):
    try:
        async with AsyncSession(engine) as session:
            stmt = select(RunningSessions).where(RunningSessions.user_id == user_row.id)
            result = await session.execute(stmt)
            return result.scalar_one_or_none()
    except Exception as e:
        initiate_error_handler(message="could not get session", errCode=ErrorCodes.BROAD_DATABASE_ERROR.value, error=e)

async def get_session_by_token(token: str):
    try:
        async with AsyncSession(engine) as session:
            stmt = select(RunningSessions).where(RunningSessions.token == token)
            result = await session.execute(stmt)
            return result.scalar_one_or_none()
    except Exception as e:
        initiate_error_handler(message="could not get session by token", errCode=ErrorCodes.BROAD_DATABASE_ERROR.value, error=e)



async def remove_session(user_row: Users):
    try:
        async with AsyncSession(engine) as session:
            stmt = select(RunningSessions).where(RunningSessions.user_id == user_row.id)
            result = await session.execute(stmt)
            session.delete(result.scalar_one())
            await session.commit()
            log("session removed")
            return True
    except Exception as e:
        initiate_error_handler(message="could not remove session", errCode=ErrorCodes.BROAD_DATABASE_ERROR.value, error=e)