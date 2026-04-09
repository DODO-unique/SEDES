from database.ORM_2 import fetch_line, does_session_exist
from utils.validators.master_validator import UserName
from utils.logger import loggy
from uuid import uuid4
from utils.error_handler import initiate_error_handler, ErrorCodes


async def is_session_running(uname: UserName, return_user_row= False):

    user = await fetch_line(uname)
    is_running = await does_session_exist(user_row=user)
    if return_user_row and is_running:
        return {
            "is_running" : is_running,
            "user_row" : user
        }
    return {
        "is_running" : is_running
    }