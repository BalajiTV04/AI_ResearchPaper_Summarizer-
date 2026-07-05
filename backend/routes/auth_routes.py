import logging
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from auth import get_current_user
from database import get_supabase

logger = logging.getLogger(__name__)

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
    supabase = get_supabase()
    
    try:
        # First try using the admin API (bypasses email confirmation)
        try:
            auth_response = supabase.auth.admin.create_user({
                "email": req.email,
                "password": req.password,
                "email_confirm": True,
                "user_metadata": {"name": req.name}
            })
            user = auth_response.user
        except Exception as admin_err:
            logger.warning(f"Admin API create_user failed, trying standard sign_up: {str(admin_err)}")
            # Fallback to standard sign_up with service_role key
            auth_response = supabase.auth.sign_up({
                "email": req.email,
                "password": req.password,
                "options": {
                    "data": {"name": req.name}
                }
            })
            user = auth_response.user
        
        # Create profile in the profiles table (if table exists)
        try:
            supabase.table("profiles").insert({
                "id": user.id,
                "name": req.name,
                "email": req.email
            }).execute()
        except Exception as profile_err:
            logger.warning(f"Could not create profile (table may not exist): {str(profile_err)}")
        
        logger.info(f"User registered successfully: {req.email} (id: {user.id})")
        return {"message": "User created successfully", "user_id": user.id}
    
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Registration failed for {req.email}: {error_msg}")
        if "already registered" in error_msg.lower() or "already exists" in error_msg.lower() or "duplicate" in error_msg.lower():
            raise HTTPException(status_code=400, detail="Email already registered")
        raise HTTPException(status_code=400, detail=error_msg)

@router.post("/login")
async def login(req: LoginRequest):
    supabase = get_supabase()
    
    try:
        # Sign in with Supabase Auth
        auth_response = supabase.auth.sign_in_with_password({
            "email": req.email,
            "password": req.password
        })
        
        user = auth_response.user
        session = auth_response.session
        
        logger.info(f"User logged in: {req.email}")
        return {
            "token": session.access_token,
            "refresh_token": session.refresh_token,
            "user": {
                "id": user.id,
                "name": user.user_metadata.get("name", user.email),
                "email": user.email
            }
        }
    
    except Exception as e:
        logger.error(f"Login failed for {req.email}: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get the currently authenticated user's profile"""
    supabase = get_supabase()
    
    try:
        # Get profile from profiles table
        result = supabase.table("profiles").select("*").eq("id", current_user["id"]).single().execute()
        
        if not result.data:
            return current_user
        
        profile = result.data
        return {
            "id": profile["id"],
            "name": profile.get("name", current_user["name"]),
            "email": profile.get("email", current_user["email"])
        }
    except Exception as e:
        logger.warning(f"Could not fetch profile for user {current_user.get('id')}: {str(e)}")
        return current_user
