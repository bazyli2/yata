"""Auth0 JWT verification for FastAPI.

Provides a ``get_current_user`` dependency that extracts and validates
the Bearer token from the ``Authorization`` header. The token is verified
against the Auth0 JWKS (JSON Web Key Set) endpoint.
"""

from typing import Any

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.config import settings

# HTTPBearer extracts the token from the Authorization header automatically.
_bearer_scheme = HTTPBearer()

# Cache the JWKS so we don't fetch it on every request.
_jwks_cache: dict[str, Any] | None = None


async def _get_jwks() -> dict[str, Any]:
    """Fetch and cache the JWKS from Auth0."""
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache

    jwks_url = f"https://{settings.auth0_domain}/.well-known/jwks.json"
    async with httpx.AsyncClient() as client:
        response = await client.get(jwks_url)
        response.raise_for_status()
        _jwks_cache = response.json()
    return _jwks_cache


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> dict[str, Any]:
    """FastAPI dependency that validates an Auth0 JWT and returns the payload.

    The returned dict contains standard JWT claims such as ``sub`` (the
    Auth0 user ID, e.g. ``auth0|abc123``), ``aud``, ``iss``, ``exp``, etc.

    Raises ``HTTPException(401)`` if the token is missing, malformed,
    expired, or fails signature verification.
    """
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        jwks = await _get_jwks()
        # Decode the token header to find the signing key ID.
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        if kid is None:
            raise credentials_exception

        # Find the matching public key in the JWKS.
        rsa_key: dict[str, str] = {}
        for key in jwks.get("keys", []):
            if key["kid"] == kid:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"],
                }
                break

        if not rsa_key:
            raise credentials_exception

        payload: dict[str, Any] = jwt.decode(
            token,
            rsa_key,
            algorithms=settings.auth0_algorithms,
            audience=settings.auth0_audience,
            issuer=f"https://{settings.auth0_domain}/",
        )
        if payload.get("sub") is None:
            raise credentials_exception

        return payload

    except JWTError:
        raise credentials_exception
