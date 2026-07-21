from pydantic import BaseModel, EmailStr, SecretStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: SecretStr
    stay_logged_in: bool = False
