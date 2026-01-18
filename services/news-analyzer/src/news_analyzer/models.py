from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class Sentiment(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"


class NewsArticle(BaseModel):
    """Represents a news article with metadata and analysis."""

    id: str
    title: str
    summary: str | None = None
    url: str
    source: str
    published_at: datetime
    tickers: list[str] = []
    sentiment: Sentiment | None = None
    sentiment_score: float | None = None


class NewsSummary(BaseModel):
    """Aggregated news summary for the market."""

    articles: list[NewsArticle]
    overall_sentiment: Sentiment
    sentiment_breakdown: dict[str, int]
    top_tickers: list[str]
    last_updated: datetime
