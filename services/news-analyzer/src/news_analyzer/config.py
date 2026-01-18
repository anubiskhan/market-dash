from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    port: int = 8081
    polygon_api_key: str = ""
    database_url: str = ""

    # News sources
    rss_feeds: list[str] = [
        "https://feeds.finance.yahoo.com/rss/2.0/headline",
        "https://www.cnbc.com/id/100003114/device/rss/rss.html",
        "https://feeds.marketwatch.com/marketwatch/topstories",
    ]

    # Model settings
    sentiment_model: str = "ProsusAI/finbert"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
