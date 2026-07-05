from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import get_supabase
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify Supabase JWT token and return the user"""
    token = credentials.credentials
    supabase = get_supabase()
    
    try:
        # Verify the JWT token with Supabase Auth
        user_response = supabase.auth.get_user(token)
        user = user_response.user
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        return {
            "id": user.id,
            "email": user.email,
            "name": user.user_metadata.get("name", user.email),
            "role": user.user_metadata.get("role", "user")
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


async def get_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify admin user from Supabase JWT"""
    user = await get_current_user(credentials)
    
    # Check if user has admin role in their metadata
    if user.get("role") != "admin":
        # Also check admin credentials from env
        admin_username = os.getenv("ADMIN_USERNAME", "admin")
        admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
        
        # Allow admin login via special check
        if user.get("email") != f"{admin_username}@admin.com":
            raise HTTPException(status_code=403, detail="Admin access required")
    
    return user