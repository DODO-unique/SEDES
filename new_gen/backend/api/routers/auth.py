from fastapi import APIRouter
from auth.Auth.auth_moderator.registration import registration_data
from auth.Auth.auth_moderator.verification import verification
from auth.Sessions.session_manager import delete_session
from utils.validators.payload_validator import RegisterPayloadValidator, LoginPayloadValidator
from api.dependencies import get_current_user
from fastapi import Depends
from utils.logger import loggy

def log(msg: str):
    loggy("api/routers/auth.py", msg)

router = APIRouter()

@router.post("/register", status_code=201)
async def register(payload: RegisterPayloadValidator):
    """
    Register a new user. The JSON body must match the Pydantic models.
    """
    log(f"Registration request received for username: {payload.user.value}")
    # registration_data expects (uname: UserName, mail: Mail, pt_password: Password)
    result = await registration_data(
        uname=payload.user,
        mail=payload.mail,
        pt_password=payload.pt_password
    )
    log(f"User {payload.user.value} successfully registered in DB. Generating session...")
    session = await verification(
        uname=payload.user,
        password=payload.pt_password
    )
    log(f"Registration auto-login complete for {payload.user.value}.")
    return {"message": "User registered successfully", "user_id": result, "session": session}

@router.post("/login")
async def login(payload: LoginPayloadValidator):
    """
    Login a user and get a session token.
    """
    log(f"Login request received for username: {payload.user.value}")
    session = await verification(
        uname=payload.user,
        password=payload.pt_password
    )
    log(f"Login successful for username: {payload.user.value}. Session token generated.")
    return {"message": "Login successful", "session": session}

@router.post("/logout")
async def logout(payload: LoginPayloadValidator):
    log(f"Logout request received for username: {payload.user.value}")
    result = await delete_session(uname=payload.user)
    log(f"Logout returned {result} for {payload.user.value}.")
    return {"message": "Logout successful" if result else "Logout failed"}

@router.get("/me")
async def get_me(user_id: str = Depends(get_current_user)):
    """
    Returns the current user ID to verify auth token validity.
    """
    return {"user_id": user_id}

