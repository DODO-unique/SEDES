# encrypt.py

from cryptography.fernet import Fernet


from utils.logger import loggy

def log(msg: str):
    loggy("cryptography/encryption_src_file.py", msg)

def generate_key():
    log("Generating a new Fernet key")
    return Fernet.generate_key()


def encrypt_message(message, key):
    f = Fernet(key)
    encrypted = f.encrypt(message.encode())  # string → bytes → encrypt
    return encrypted


def decrypt_message(ciphertext, key):
    f = Fernet(key)
    decrypted = f.decrypt(ciphertext)  # bytes → decrypt
    return decrypted.decode()  # bytes → string