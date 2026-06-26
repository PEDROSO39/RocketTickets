from fastapi import HTTPException, status


class PraxioError(Exception):
    def __init__(self, message: str, detail: str = ""):
        self.message = message
        self.detail = detail


class ScraperAuthError(PraxioError):
    pass


class ScraperNetworkError(PraxioError):
    pass


class ScraperParseError(PraxioError):
    pass


def http_404(resource: str, id: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"{resource} '{id}' not found",
    )


def http_400(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=detail,
    )


def http_500(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=detail,
    )
