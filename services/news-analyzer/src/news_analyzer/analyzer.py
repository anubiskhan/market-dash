import logging
from collections import Counter

from transformers import AutoModelForSequenceClassification, AutoTokenizer, pipeline

from news_analyzer.config import settings
from news_analyzer.models import NewsArticle, NewsSummary, Sentiment

logger = logging.getLogger(__name__)


class SentimentAnalyzer:
    """Analyzes sentiment of news articles using FinBERT."""

    def __init__(self) -> None:
        self.model = None
        self.tokenizer = None
        self.pipeline = None
        self._initialized = False

    def initialize(self) -> None:
        """Load the sentiment model. Called on first use for lazy loading."""
        if self._initialized:
            return

        logger.info(f"Loading sentiment model: {settings.sentiment_model}")
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(settings.sentiment_model)
            self.model = AutoModelForSequenceClassification.from_pretrained(
                settings.sentiment_model
            )
            self.pipeline = pipeline(
                "sentiment-analysis",
                model=self.model,
                tokenizer=self.tokenizer,
                truncation=True,
                max_length=512,
            )
            self._initialized = True
            logger.info("Sentiment model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load sentiment model: {e}")
            self._initialized = False

    def analyze_article(self, article: NewsArticle) -> NewsArticle:
        """Analyze sentiment of a single article."""
        if not self._initialized:
            self.initialize()

        if not self._initialized or not self.pipeline:
            # Fallback to neutral if model not available
            article.sentiment = Sentiment.NEUTRAL
            article.sentiment_score = 0.0
            return article

        try:
            # Combine title and summary for analysis
            text = f"{article.title}. {article.summary or ''}"[:512]
            result = self.pipeline(text)[0]

            label = result["label"].lower()
            score = result["score"]

            if label == "positive":
                article.sentiment = Sentiment.POSITIVE
                article.sentiment_score = score
            elif label == "negative":
                article.sentiment = Sentiment.NEGATIVE
                article.sentiment_score = -score
            else:
                article.sentiment = Sentiment.NEUTRAL
                article.sentiment_score = 0.0

        except Exception as e:
            logger.error(f"Error analyzing article: {e}")
            article.sentiment = Sentiment.NEUTRAL
            article.sentiment_score = 0.0

        return article

    def analyze_articles(self, articles: list[NewsArticle]) -> list[NewsArticle]:
        """Analyze sentiment of multiple articles."""
        return [self.analyze_article(article) for article in articles]

    def create_summary(self, articles: list[NewsArticle]) -> NewsSummary:
        """Create an aggregated news summary."""
        from datetime import datetime, timezone

        # Count sentiments
        sentiment_counts: Counter[str] = Counter()
        ticker_counts: Counter[str] = Counter()

        for article in articles:
            if article.sentiment:
                sentiment_counts[article.sentiment.value] += 1
            for ticker in article.tickers:
                ticker_counts[ticker] += 1

        # Determine overall sentiment
        if sentiment_counts:
            most_common = sentiment_counts.most_common(1)[0][0]
            overall = Sentiment(most_common)
        else:
            overall = Sentiment.NEUTRAL

        # Get top mentioned tickers
        top_tickers = [ticker for ticker, _ in ticker_counts.most_common(10)]

        return NewsSummary(
            articles=articles[:50],  # Limit to 50 most recent
            overall_sentiment=overall,
            sentiment_breakdown=dict(sentiment_counts),
            top_tickers=top_tickers,
            last_updated=datetime.now(timezone.utc),
        )
