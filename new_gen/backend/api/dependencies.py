from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from auth.Sessions.session_manager import fetch_session
from auth.Sessions.session_manager_2 import is_session_running
from utils.validators.master_validator import UserName

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Validate the session token passed inside the Authorization header.
    Right now sessions are mapped to uname. We fetch session by checking if token matches.
    Wait, fetch_session needs a uname. How do we get uname from just the token?
    We must query the database to find the session row corresponding to this token.
    """
    # Let's import the raw fetch session by token if necessary.
    # For now, let's just make it a placeholder if we don't have token-to-user resolution yet.
    token = credentials.credentials
    # In a full implementation, we would query the RunningSessions table directly by token.
    # Currently session_manager relies on 'uname' as input to fetch user object.
    from database.ORM_2 import get_session_by_token
    session = await get_session_by_token(token)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return session.user_id # Or the full user row
