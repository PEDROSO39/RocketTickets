import logging

from fastapi import APIRouter

from prax.exceptions import http_500
from prax.scraper.client import PraxioClient

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/user", tags=["user"])


@router.get("/profile")
async def get_user_profile():
    client = PraxioClient()
    try:
        profile = await client.fetch_user_profile()
        return profile
    except Exception as e:
        logger.error(f"Failed to fetch user profile: {e}")
        raise http_500("Failed to fetch user profile")
    finally:
        await client.close()
