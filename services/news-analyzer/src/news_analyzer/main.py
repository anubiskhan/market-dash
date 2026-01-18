import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from news_analyzer.aggregator import NewsAggregator
from news_analyzer.analyzer import SentimentAnalyzer
from news_analyzer.config import settings
from news_analyzer.models import NewsArticle, NewsSummary

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Global instances
aggregator = NewsAggregator()
analyzer = SentimentAnalyzer()
scheduler = AsyncIOScheduler()


async def refresh_news() -> None:
    """Fetch and analyze news from all sources."""
    logger.info("Refreshing news...")
    articles = await aggregator.fetch_all()
    analyzed = analyzer.analyze_articles(articles)
    logger.info(f"Processed {len(analyzed)} articles")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle."""
    # Startup
    logger.info("Starting news analyzer service")

    # Initialize sentiment model in background
    analyzer.initialize()

    # Schedule news refresh every 15 minutes
    scheduler.add_job(refresh_news, "interval", minutes=15)
    scheduler.start()

    # Initial fetch
    await refresh_news()

    yield

    # Shutdown
    scheduler.shutdown()
    await aggregator.close()
    logger.info("News analyzer service stopped")


app = FastAPI(
    title="News Analyzer",
    description="News aggregation and sentiment analysis for Market Dash",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8787"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/api/v1/news", response_model=list[NewsArticle])
async def get_news(limit: int = 20, ticker: str | None = None) -> list[NewsArticle]:
    """Get latest news articles."""
    articles = aggregator.get_articles()

    if ticker:
        articles = [a for a in articles if ticker.upper() in a.tickers]

    return articles[:limit]


@app.get("/api/v1/news/summary", response_model=NewsSummary)
async def get_summary() -> NewsSummary:
    """Get aggregated news summary with sentiment analysis."""
    articles = aggregator.get_articles()
    return analyzer.create_summary(articles)


@app.get("/api/v1/news/ticker/{ticker}", response_model=list[NewsArticle])
async def get_news_by_ticker(ticker: str, limit: int = 10) -> list[NewsArticle]:
    """Get news for a specific ticker."""
    articles = aggregator.get_articles()
    filtered = [a for a in articles if ticker.upper() in a.tickers]
    return filtered[:limit]


@app.post("/api/v1/news/refresh")
async def trigger_refresh() -> dict[str, str]:
    """Manually trigger news refresh."""
    await refresh_news()
    return {"status": "refreshed", "timestamp": datetime.now(timezone.utc).isoformat()}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=settings.port)
