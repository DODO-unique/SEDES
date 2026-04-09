from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from api.dependencies import get_current_user
from database.ORM_4 import get_or_create_encryption_key, get_encryption_key_or_fail
from utils.error_handler import initiate_error_handler, ErrorCodes
from cryptography.encryption_src_file import encrypt_message, decrypt_message
from steganography.core import encode_image, decode_image
from PIL import Image
import io
import base64
from utils.logger import loggy

def log(msg: str):
    loggy("api/routers/stego.py", msg)

router = APIRouter()

@router.post("/encode")
async def encode_stego(
    image: UploadFile = File(...),
    message: str = Form(...),
    user_id: str = Depends(get_current_user)
):
    """
    Encrypts a plaintext message and encodes it inside the uploaded image.
    """
    log(f"Encode request initiated for user {user_id}")
    
    # 1. Fetch or generate cryptographic key for the user
    key = await get_or_create_encryption_key(user_id)
    log(f"Key fetched successfully for encode")
    
    # 2. Encrypt the plaintext secret
    ciphertext_bytes = encrypt_message(message, key)
    # Convert bytes to string so we can safely embed it in Steganography engine
    ciphertext_str = base64.b64encode(ciphertext_bytes).decode('utf-8')
    
    # 3. Read uploaded image into memory
    try:
        img = Image.open(image.file).convert("RGB")
        log("Image loaded successfully for encoding")
    except Exception as e:
        log("Failed to load image for encoding")
        initiate_error_handler(
            message="Invalid image file", 
            errCode=ErrorCodes.INVALID_PAYLOAD_CONTENT.value, 
            error=e
        )
    
    # 4. Steganography Injection
    log("Steganography Injection started")
    stego_img = encode_image(img, ciphertext_str)
    log("Steganography Injection completed")
    
    # 5. Prepare Response
    buf = io.BytesIO()
    stego_img.save(buf, format="PNG")
    buf.seek(0)
    
    headers = {
        'Content-Disposition': 'attachment; filename="stego_image.png"'
    }
    return Response(content=buf.getvalue(), media_type="image/png", headers=headers)

@router.post("/decode")
async def decode_stego(
    image: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    """
    Extracts ciphertext from an image and decrypts it back to plaintext.
    """
    log(f"Decode request initiated for user {user_id}")
    # 1. Fetch key or explode securely
    key = await get_encryption_key_or_fail(user_id)
    log("Key verified for decode.")
    
    # 2. Read image
    try:
        img = Image.open(image.file).convert("RGB")
        log("Image loaded successfully for decoding")
    except Exception as e:
        log("Failed to load image for decoding")
        initiate_error_handler(
            message="Invalid image file or unsupported format", 
            errCode=ErrorCodes.INVALID_PAYLOAD_CONTENT.value, 
            error=e
        )
        
    # 3. Steganography Extraction
    log("Steganography Extraction started")
    try:
        ciphertext_str = decode_image(img)
        log("Steganography Extraction completed")
    except ValueError as e:
        log(f"Extraction failed: {str(e)}")
        initiate_error_handler(
            message=str(e), 
            errCode=ErrorCodes.INVALID_PAYLOAD_CONTENT.value, 
            error=e
        )
        
    # 4. Decrypt original message
    log("Decrypting extracted payload")
    try:
        ciphertext_bytes = base64.b64decode(ciphertext_str)
        plaintext = decrypt_message(ciphertext_bytes, key)
    except Exception as e:
        log("Decryption failed. Hash mismatch or corruption.")
        initiate_error_handler(
            message="Decryption failed. The message may not have been encrypted with your key, or it is corrupted.", 
            errCode=ErrorCodes.INCORRECT_PASSWORD.value, 
            error=e
        )
        
    log("Decode request successfully completed")
    return {"secret": plaintext}
