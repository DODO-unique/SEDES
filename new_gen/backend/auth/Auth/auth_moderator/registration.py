from utils.validators.master_validator import Mail, UserName, Password
from Auth.common.username_check import check_user
from utils.error_handler import ErrorCodes, initiate_error_handler
from utils.logger import loggy
from Auth.common.hashing import hash_password
from database.ORM_1 import insert_user

def log(msg: str) -> None:
    loggy("Auth/auth_moderator/registration.py", msg)

async def registration_data(uname: UserName, mail: Mail, pt_password: Password):
    
    # validation first
    availibility_status = await check_user(uname, mail)
    if availibility_status['email_available'] and availibility_status['username_available']:
        # username and email available, proceeed with registration.
        log("Username and email are available. Proceeding with registration.")
        # hash the password
        log("Hashing password.")
        digest = hash_password(pt_password)
        result = await insert_user(uname, mail, digest.decode('utf-8'))
        log(f"Result: {result}")
        return result

    else: 
        initiate_error_handler(message="Username or email already taken.", errCode=ErrorCodes.FIELD_ALREADY_EXISTS.value, error=ValueError("Username or email already taken."))
    
