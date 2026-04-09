# The idea is simple. All the commands that don't come with a session token get filtered to the auth pipe. Those without it go to the main pipe.
from fastapi import Header

async def upload(
    image: UploadFile = File(...),
    message: str = Form(...),
    authorization: str = Header(...)
):
    token = authorization.split(" ")[1]