import asyncio
import hashlib
import logging
import re
from datetime import datetime, timezone

import feedparser
import httpx

from news_analyzer.config import settings
from news_analyzer.models import NewsArticle

logger = logging.getLogger(__name__)

# Common stock ticker patterns
TICKER_PATTERN = re.compile(r"\b([A-Z]{1,5})\b")

# Known tickers to filter false positives
COMMON_WORDS = {"A", "I", "CEO", "CFO", "US", "UK", "EU", "GDP", "IPO", "ETF", "SEC", "FDA", "AI"}


class NewsAggregator:
    """Fetches and aggregates news from multiple sources."""

    def __init__(self) -> None:
        self.client = httpx.AsyncClient(timeout=30.0)
        self.articles: dict[str, NewsArticle] = {}

    async def close(self) -> None:
        await self.client.aclose()

    async def fetch_all(self) -> list[NewsArticle]:
        """Fetch news from all configured RSS feeds."""
        tasks = [self._fetch_feed(url) for url in settings.rss_feeds]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        articles = []
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Error fetching feed: {result}")
                continue
            articles.extend(result)

        # Deduplicate and store
        for article in articles:
            self.articles[article.id] = article

        return list(self.articles.values())

    async def _fetch_feed(self, url: str) -> list[NewsArticle]:
        """Fetch and parse a single RSS feed."""
        try:
            response = await self.client.get(url)
            response.raise_for_status()
            feed = feedparser.parse(response.text)

            articles = []
            for entry in feed.entries[:20]:  # Limit to 20 per feed
                article = self._parse_entry(entry, url)
                if article:
                    articles.append(article)

            logger.info(f"Fetched {len(articles)} articles from {url}")
            return articles

        except Exception as e:
            logger.error(f"Error fetching {url}: {e}")
            return []

    def _parse_entry(self, entry: dict, source_url: str) -> NewsArticle | None:
        """Parse an RSS entry into a NewsArticle."""
        try:
            title = entry.get("title", "")
            if not title:
                return None

            # Generate unique ID from URL or title
            link = entry.get("link", "")
            article_id = hashlib.md5((link or title).encode()).hexdigest()

            # Parse published date
            published = entry.get("published_parsed") or entry.get("updated_parsed")
            if published:
                published_at = datetime(*published[:6], tzinfo=timezone.utc)
            else:
                published_at = datetime.now(timezone.utc)

            # Extract summary
            summary = entry.get("summary", "")
            if len(summary) > 500:
                summary = summary[:500] + "..."

            # Extract potential tickers from title and summary
            tickers = self._extract_tickers(f"{title} {summary}")

            # Determine source name from URL
            source = self._get_source_name(source_url)

            return NewsArticle(
                id=article_id,
                title=title,
                summary=summary,
                url=link,
                source=source,
                published_at=published_at,
                tickers=tickers,
            )

        except Exception as e:
            logger.error(f"Error parsing entry: {e}")
            return None

    def _extract_tickers(self, text: str) -> list[str]:
        """Extract potential stock tickers from text."""
        matches = TICKER_PATTERN.findall(text)
        tickers = [m for m in matches if m not in COMMON_WORDS and len(m) >= 2]
        return list(set(tickers))[:5]  # Limit to 5 tickers

    def _get_source_name(self, url: str) -> str:
        """Extract source name from URL."""
        if "yahoo" in url:
            return "Yahoo Finance"
        if "cnbc" in url:
            return "CNBC"
        if "marketwatch" in url:
            return "MarketWatch"
        if "reuters" in url:
            return "Reuters"
        if "bloomberg" in url:
            return "Bloomberg"
        return "Unknown"

    def get_articles(self) -> list[NewsArticle]:
        """Get all stored articles sorted by date."""
        articles = list(self.articles.values())
        articles.sort(key=lambda x: x.published_at, reverse=True)
        return articles
