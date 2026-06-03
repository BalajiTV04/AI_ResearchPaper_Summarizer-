from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from auth import get_current_user, hash_password, verify_password, create_access_token
from models import users_collection
from database import str_to_id

router = APIRouter(prefix="/auth", tags=["Authentication"])

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
async def register(req: RegisterRequest):
    existing_user = await users_collection.find_one({"email": req.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(req.password)
    result = await users_collection.insert_one({
        "name": req.name,
        "email": req.email,
        "password_hash": hashed
    })
    return {"message": "User created successfully", "user_id": str(result.inserted_id)}

@router.post("/login")
async def login(req: LoginRequest):
    user = await users_collection.find_one({"email": req.email})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(data={"sub": str(user["_id"])})
    return {
        "token": token,
        "user": {"id": str(user["_id"]), "name": user["name"], "email": user["email"]}
    }