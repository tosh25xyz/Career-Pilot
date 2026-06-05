"""
Clerk JWT verification for FastAPI.
Every protected endpoint uses: user_id = Depends(get_current_user)
"""

import httpx
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.config import settings
from core.database import get_db
from models.schema import User

bearer_scheme = HTTPBearer()
_jwks_cache: dict = {}


async def _get_jwks() -> dict:
    """Fetch Clerk's public keys (cached)."""
    global _jwks_cache
    if not _jwks_cache:
        async with httpx.AsyncClient() as client:
            resp = await client.get(settings.CLERK_JWKS_URL)
            _jwks_cache = resp.json()
    return _jwks_cache


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    try:
        jwks = await _get_jwks()
        payload = jwt.decode(token, jwks, algorithms=["RS256"])
        clerk_user_id: str = payload.get("sub")
        email: str = payload.get("email", "")
        name: str = payload.get("name", "")

        if not clerk_user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Upsert user in our DB
        result = await db.execute(select(User).where(User.id == clerk_user_id))
        user = result.scalar_one_or_none()

        if not user:
            user = User(id=clerk_user_id, email=email, name=name)
            db.add(user)
            await db.flush()

        return user

    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}",
        )
