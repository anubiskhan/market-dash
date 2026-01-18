# Unusual Whales Flow Bot - Implementation Plan for Claude Code

## Executive Summary

This document provides a comprehensive research summary and implementation plan for building an options flow trading bot using the Unusual Whales platform. The plan is designed to be passed to Claude Code in VS Code for development.

---

## Part 1: Unusual Whales Platform Research

### 1.1 Pricing & Subscription Tiers

| Plan | Price | Features |
|------|-------|----------|
| **Free (Free Shamu)** | $0 | Delayed options alerts (5-12 min), limited flow feed (15-min delayed data) |
| **Monthly (Super Live Buffet)** | $48/month | Full access to live options flow, dark pool feeds, news, OPC calculator, screener |
| **Annual** | $528/year ($44/mo) | All monthly features + downloadable CSV data exports |
| **Portfolios Add-on** | +$10/month | Congressional trading data, politician portfolios |
| **Lifetime** | Contact sales | All features + API access |

**Key Insight**: API access is currently only available to **Lifetime subscribers** or through enterprise pricing.

### 1.2 Unusual Whales API

#### API Documentation
- **Base URL**: `https://api.unusualwhales.com/`
- **Docs**: `https://api.unusualwhales.com/docs`
- **Public API Page**: `https://unusualwhales.com/public-api`

#### Available API Categories (81+ Endpoints)
1. **Options Flow**
   - Real-time options flow alerts
   - Flow by ticker
   - Historical flow data
   
2. **Dark Pool**
   - Real-time dark pool prints
   - Dark pool levels
   - Ticker-specific dark pool data

3. **Market Data**
   - Market tide/sentiment
   - Sector flow
   - Index data

4. **Congressional Trading**
   - Recent trades by politicians
   - Ticker-specific congressional activity

5. **Institutional Data**
   - Holdings data
   - 13F filings

6. **ETF Analytics**
   - Holdings breakdown
   - Flow data
   - Sector weights

7. **Earnings**
   - Premarket/afterhours earnings
   - Historical earnings by ticker

8. **Alerts**
   - Custom alert configurations
   - Options flow alerts

9. **Screeners**
   - Analyst ratings
   - Hottest chains
   - Stock screener

10. **News**
    - Financial headlines

#### API Key Acquisition
- Requires Lifetime subscription or enterprise plan
- Contact sales@unusualwhales.com for enterprise pricing
- Key is passed via Authorization header

### 1.3 Discord Bot

The free Unusual Whales Discord bot (`unusual_whales_crier`) provides:
- 81+ slash commands (free and premium)
- Automatic posting topics:
  - Live Options Flow
  - Ticker Updates
  - News alerts
  - SEC filings
- Commands: `/help`, `/options_screener`, `/flow`, `/darkpool`, `/charting`

---

## Part 2: Existing Flow Bots & Algorithms Research

### 2.1 FlowAlgo Options Trader (Reference Implementation)

**GitHub**: `SC4RECOIN/FlowAlgo-Options-Trader`

**Strategy Overview**:
- Pulls options flow data from FlowAlgo
- Uses rules-based algorithm to trade underlying assets
- Takes positions when a symbol is seen enough times and passes rule set
- LONG only strategy (short positions haven't shown promise in backtesting)

**Key Rules**:
```python
# Example rule parameters
min_premium = 50000      # Minimum premium size
min_oi = 500             # Minimum open interest
ignore_before = "09:45"  # Ignore options before this time
max_dte = 60             # Maximum days to expiration
volume_oi_ratio = 1.5    # Volume > OI threshold
```

**Important Considerations**:
- Options can be part of multi-leg strategies
- Large PUT could be bullish (hedging long position)
- Consider whether BUY = "Buy to Open" vs "Buy to Close"

### 2.2 MCP Server for Unusual Whales

**GitHub**: `danwagnerco/mcp-server-unusualwhales` and `phields/unusualwhales-mcp`

**Features**:
- TypeScript/Python MCP server implementation
- 33 MCP tools for common functions
- Example usage:
```javascript
// Get recent options flows for AAPL
const flows = await server.callTool("get_stock_flow_recent", { ticker: "AAPL" });

// Get market sentiment
const tide = await server.callTool("get_market_tide", {});

// Get dark pool activity
const darkPool = await server.callTool("get_darkpool_recent", { limit: 50 });
```

### 2.3 Common Bot Architectures

**Agent-Based Architecture** (Recommended):
1. **Signal Agent**: Analyzes market data, generates BUY/SELL signals
2. **Order Execution Agent**: Places trades via broker API
3. **Position Management Agent**: Monitors positions, manages stops
4. **Orchestrator**: Coordinates agents, manages flow

### 2.4 Backtesting Frameworks

| Framework | Use Case |
|-----------|----------|
| **Backtrader** | Full-featured Python backtesting |
| **Zipline** | Quantopian-style backtesting |
| **QuantConnect** | Cloud-based, multi-asset |
| **Option Alpha** | 0DTE specific backtesting |
| **QuantStats/Pyfolio** | Performance analytics |

---

## Part 3: Broker Integration Options

### 3.1 Alpaca (Recommended for Development)

**Pros**:
- Commission-free trading
- Free paper trading API
- Python SDK: `alpaca-trade-api`
- Options trading support

**Setup**:
```python
import alpaca_trade_api as tradeapi

BASE_URL = "https://paper-api.alpaca.markets"  # Paper trading
api = tradeapi.REST(
    key_id=ALPACA_API_KEY,
    secret_key=ALPACA_SECRET_KEY,
    base_url=BASE_URL,
    api_version='v2'
)
```

### 3.2 Interactive Brokers

**Pros**:
- Professional-grade
- Global market access
- Advanced order types

**SDK**: `ib_insync` Python library

### 3.3 TD Ameritrade / Schwab

**Note**: TD Ameritrade API is transitioning due to Schwab merger. Check current status.

---

## Part 4: Competitors Analysis

| Platform | Monthly Price | Key Features |
|----------|---------------|--------------|
| **Unusual Whales** | $48 | Best value, API for lifetime, active community |
| **FlowAlgo** | $99-149 | Real-time alerts, dark pool, voice alerts |
| **Cheddar Flow** | $85-99 | Clean UI, dark pool, AI alerts |
| **OptionStrat** | Free tier available | Strategy builder, flow analysis |
| **BlackBoxStocks** | $99 | Flow + scanning + chatroom |
| **InsiderFinance** | Varies | TradingView integration |

---

## Part 5: Implementation Plan for Claude Code

### IMPORTANT: Multi-Tool Suite Context

This flow bot is **one component** of a larger trading tool suite/dashboard. The architecture must support:

1. **Data Ingestion** from other tools (e.g., technical analysis tool, news sentiment tool, portfolio tracker)
2. **Data Export** to other tools (e.g., dashboard UI, backtesting engine, alert aggregator)
3. **Shared Data Layer** - common database/message bus for cross-tool communication
4. **Standardized Signal Format** - consistent schema across all tools

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TRADING TOOL SUITE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐    │
│  │ Flow Bot    │   │ TA Tool     │   │ News/Sent.  │   │ Portfolio   │    │
│  │ (THIS)      │   │ (Future)    │   │ (Future)    │   │ (Future)    │    │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘    │
│         │                 │                 │                 │            │
│         ▼                 ▼                 ▼                 ▼            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    SHARED DATA LAYER                                │  │
│  │  • PostgreSQL/SQLite (signals, positions, analytics)                │  │
│  │  • Redis (real-time pub/sub, caching)                               │  │
│  │  • S3/R2 (historical data, exports)                                 │  │
│  │  • Message Queue (tool-to-tool events)                              │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│         │                 │                 │                 │            │
│         ▼                 ▼                 ▼                 ▼            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      OUTPUT LAYER                                   │  │
│  │  • Dashboard UI    • Discord    • Twitter    • Alerts               │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### CORE FOCUS: Data Collection → Analysis → Processing Pipeline

The primary goal is building a robust data pipeline. Output/notification is decoupled and pluggable.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CORE PIPELINE (Focus Here)                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐            │
│   │  UW API      │───▶│  Processing  │───▶│  Analysis    │            │
│   │  Client      │    │  & Filtering │    │  & Scoring   │            │
│   └──────────────┘    └──────────────┘    └──────────────┘            │
│          │                   │                    │                    │
│          ▼                   ▼                    ▼                    │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐            │
│   │  Raw Flow    │    │  Filtered    │    │  Scored      │            │
│   │  Data        │    │  Signals     │    │  Signals     │            │
│   └──────────────┘    └──────────────┘    └──────────────┘            │
│                                                  │                     │
└──────────────────────────────────────────────────│─────────────────────┘
                                                   │
                                                   ▼
                              ┌─────────────────────────────────────┐
                              │         OUTPUT ADAPTERS             │
                              │           (Pluggable)               │
                              ├─────────────────────────────────────┤
                              │  • Database (always on)             │
                              │  • File/S3/R2 (for extensions)      │
                              │  • Discord Webhook                  │
                              │  • Twitter/X API                    │
                              │  • Telegram                         │
                              │  • Web Dashboard                    │
                              │  • Console (debug)                  │
                              └─────────────────────────────────────┘
```

### Phase 1: Project Setup & Core Infrastructure

```
unusual_whales_bot/
├── config/
│   ├── __init__.py
│   ├── settings.py          # API keys, configuration
│   ├── outputs.py           # Output destination config
│   └── constants.py         # Trading constants
├── api/
│   ├── __init__.py
│   ├── unusual_whales.py    # UW API client
│   ├── alpaca_client.py     # Broker integration (optional)
│   ├── rate_limiter.py      # API rate limiting
│   └── internal_api.py      # [SUITE] FastAPI for dashboard/other tools
├── agents/
│   ├── __init__.py
│   ├── signal_agent.py      # Signal generation
│   ├── execution_agent.py   # Order execution (optional)
│   └── position_agent.py    # Position management (optional)
├── strategies/
│   ├── __init__.py
│   ├── flow_strategy.py     # Options flow strategy
│   ├── dark_pool_strategy.py
│   └── rules.py             # Trading rules / filters
├── outputs/                  # MODULAR OUTPUT SYSTEM
│   ├── __init__.py
│   ├── base.py              # OutputAdapter ABC
│   ├── database.py          # Store to DB for analysis
│   ├── file_watcher.py      # File/S3/R2 for external consumers
│   ├── webhook.py           # Discord webhook
│   ├── twitter.py           # Twitter/X API (future)
│   ├── telegram.py          # Telegram bot (future)
│   └── multi.py             # Fan-out to multiple destinations
├── data/
│   ├── __init__.py
│   ├── models.py            # [SUITE] Standardized signal schemas
│   └── database.py          # [SUITE] Shared DB schema
├── events/                   # [SUITE] CROSS-TOOL COMMUNICATION
│   ├── __init__.py
│   ├── bus.py               # Redis pub/sub event bus
│   ├── types.py             # Event type definitions
│   └── handlers.py          # Incoming event handlers
├── ingest/                   # [SUITE] INGEST FROM OTHER TOOLS
│   ├── __init__.py
│   ├── base.py              # IngestAdapter ABC
│   ├── ta_signals.py        # Consume TA tool signals (future)
│   ├── news_signals.py      # Consume news sentiment (future)
│   └── aggregator.py        # Combine signals from multiple sources
├── analysis/                 # DATA ANALYSIS TOOLS
│   ├── __init__.py
│   ├── flow_analyzer.py     # Analyze flow patterns
│   ├── aggregations.py      # Aggregate stats (by ticker, sector, etc.)
│   └── reports.py           # Generate reports
├── utils/
│   ├── __init__.py
│   ├── logger.py
│   └── formatters.py        # Format signals for different outputs
├── backtesting/
│   ├── __init__.py
│   └── backtester.py
├── tests/
│   └── ...
├── main.py                  # Entry point - data collection
├── api_server.py            # [SUITE] FastAPI server for internal API
├── requirements.txt
├── .env.example
└── README.md
```

### Suite Integration Points Summary

| Component | Purpose | Integration Direction |
|-----------|---------|----------------------|
| `data/models.py` | Standardized signal schema | All tools use same format |
| `data/database.py` | Shared PostgreSQL/SQLite | All tools read/write |
| `events/bus.py` | Redis pub/sub | Publish to & subscribe from other tools |
| `api/internal_api.py` | REST API | Dashboard & other tools query this |
| `ingest/` | Consume external signals | Receive from TA tool, news tool, etc. |
| `outputs/` | Publish signals | Send to dashboard, alerts, other tools |

### Phase 2: Core Components

#### 2.1 Configuration Management
```python
# config/settings.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Unusual Whales
    UW_API_KEY: str
    
    # Alpaca
    ALPACA_API_KEY: str
    ALPACA_SECRET_KEY: str
    ALPACA_BASE_URL: str = "https://paper-api.alpaca.markets"
    
    # Trading Parameters
    MAX_POSITION_SIZE: float = 1000.0
    MAX_DAILY_TRADES: int = 10
    MIN_PREMIUM_SIZE: int = 50000
    
    class Config:
        env_file = ".env"
```

#### 2.2 Unusual Whales API Client
```python
# api/unusual_whales.py
import httpx
from typing import Optional, List, Dict

class UnusualWhalesClient:
    BASE_URL = "https://api.unusualwhales.com"
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = httpx.AsyncClient(
            headers={"Authorization": f"Bearer {api_key}"}
        )
    
    async def get_flow_alerts(self, limit: int = 50) -> List[Dict]:
        """Get recent options flow alerts"""
        response = await self.client.get(
            f"{self.BASE_URL}/api/stock/flow/recent",
            params={"limit": limit}
        )
        return response.json()
    
    async def get_ticker_flow(self, ticker: str) -> Dict:
        """Get flow for specific ticker"""
        response = await self.client.get(
            f"{self.BASE_URL}/api/stock/{ticker}/flow"
        )
        return response.json()
    
    async def get_dark_pool(self, limit: int = 50) -> List[Dict]:
        """Get recent dark pool activity"""
        response = await self.client.get(
            f"{self.BASE_URL}/api/darkpool/recent",
            params={"limit": limit}
        )
        return response.json()
    
    async def get_market_tide(self) -> Dict:
        """Get market sentiment/tide"""
        response = await self.client.get(
            f"{self.BASE_URL}/api/market/tide"
        )
        return response.json()
```

#### 2.3 Signal Generation Rules
```python
# strategies/rules.py
from dataclasses import dataclass
from typing import Optional
from datetime import datetime, time

@dataclass
class FlowSignal:
    ticker: str
    direction: str  # "BULLISH" or "BEARISH"
    confidence: float
    premium: float
    expiration: str
    strike: float
    option_type: str  # "CALL" or "PUT"
    timestamp: datetime

class FlowRules:
    """Rules for filtering and scoring flow signals"""
    
    def __init__(self):
        self.min_premium = 50000
        self.min_volume_oi_ratio = 1.5
        self.max_dte = 45
        self.ignore_before = time(9, 45)
        self.ignore_after = time(15, 45)
        
    def should_trade(self, flow: dict) -> bool:
        """Determine if flow signal warrants a trade"""
        
        # Premium filter
        if flow.get("premium", 0) < self.min_premium:
            return False
            
        # Time filter
        current_time = datetime.now().time()
        if current_time < self.ignore_before or current_time > self.ignore_after:
            return False
            
        # Volume/OI filter
        volume = flow.get("volume", 0)
        oi = flow.get("open_interest", 1)
        if volume / oi < self.min_volume_oi_ratio:
            return False
            
        # DTE filter
        dte = flow.get("dte", 999)
        if dte > self.max_dte:
            return False
            
        # Sweep detection (aggressive orders)
        if flow.get("trade_type") == "SWEEP":
            return True
            
        return True
    
    def calculate_direction(self, flow: dict) -> str:
        """Determine bullish/bearish direction"""
        option_type = flow.get("option_type")
        side = flow.get("side")  # "BID" or "ASK"
        
        if option_type == "CALL":
            return "BULLISH" if side == "ASK" else "BEARISH"
        else:  # PUT
            return "BEARISH" if side == "ASK" else "BULLISH"
```

#### 2.4 Order Execution
```python
# agents/execution_agent.py
import alpaca_trade_api as tradeapi
from typing import Optional

class ExecutionAgent:
    def __init__(self, api_key: str, secret_key: str, base_url: str):
        self.api = tradeapi.REST(
            key_id=api_key,
            secret_key=secret_key,
            base_url=base_url,
            api_version='v2'
        )
        
    def get_account(self):
        return self.api.get_account()
        
    def get_position(self, ticker: str) -> Optional[dict]:
        try:
            return self.api.get_position(ticker)
        except:
            return None
            
    def place_order(
        self,
        ticker: str,
        qty: int,
        side: str,  # "buy" or "sell"
        order_type: str = "market",
        time_in_force: str = "day"
    ):
        """Place an order for the underlying stock"""
        return self.api.submit_order(
            symbol=ticker,
            qty=qty,
            side=side,
            type=order_type,
            time_in_force=time_in_force
        )
        
    def close_position(self, ticker: str):
        """Close existing position"""
        return self.api.close_position(ticker)
```

### Phase 3: Main Bot Loop

```python
# main.py
import asyncio
from datetime import datetime
import logging

from config.settings import Settings
from api.unusual_whales import UnusualWhalesClient
from agents.execution_agent import ExecutionAgent
from strategies.rules import FlowRules

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FlowBot:
    def __init__(self):
        self.settings = Settings()
        self.uw_client = UnusualWhalesClient(self.settings.UW_API_KEY)
        self.executor = ExecutionAgent(
            self.settings.ALPACA_API_KEY,
            self.settings.ALPACA_SECRET_KEY,
            self.settings.ALPACA_BASE_URL
        )
        self.rules = FlowRules()
        self.active_positions = {}
        
    async def process_flow(self):
        """Main flow processing loop"""
        flows = await self.uw_client.get_flow_alerts(limit=20)
        
        for flow in flows:
            ticker = flow.get("ticker")
            
            # Skip if already in position
            if ticker in self.active_positions:
                continue
                
            # Apply trading rules
            if not self.rules.should_trade(flow):
                continue
                
            direction = self.rules.calculate_direction(flow)
            logger.info(f"Signal: {ticker} - {direction}")
            
            # Execute trade
            if direction == "BULLISH":
                await self.enter_long(ticker)
            # Note: Short positions not implemented in v1
            
    async def enter_long(self, ticker: str):
        """Enter a long position"""
        account = self.executor.get_account()
        buying_power = float(account.buying_power)
        
        # Calculate position size
        position_size = min(
            self.settings.MAX_POSITION_SIZE,
            buying_power * 0.1  # Use 10% of buying power max
        )
        
        # Get current price
        # (In production, use real-time quote)
        qty = int(position_size / 100)  # Simplified
        
        if qty > 0:
            order = self.executor.place_order(ticker, qty, "buy")
            self.active_positions[ticker] = {
                "qty": qty,
                "entry_time": datetime.now(),
                "order_id": order.id
            }
            logger.info(f"Entered LONG {ticker} x{qty}")
            
    async def run(self):
        """Main run loop"""
        logger.info("Starting Flow Bot...")
        
        while True:
            try:
                await self.process_flow()
                await asyncio.sleep(30)  # Poll every 30 seconds
            except Exception as e:
                logger.error(f"Error: {e}")
                await asyncio.sleep(60)

if __name__ == "__main__":
    bot = FlowBot()
    asyncio.run(bot.run())
```

### Phase 4: Modular Output System

The output destination is intentionally decoupled from the core data pipeline. The system will support multiple output adapters:

**Potential Output Destinations (TBD):**
- Private Discord server (webhook)
- Public Discord (browser extension "typing" automation)
- Web dashboard / UI tool
- Twitter/X (API posting)
- Telegram
- Local desktop notifications
- Database only (for backtesting/analysis)

#### 4.1 Output Adapter Interface
```python
# outputs/base.py
from abc import ABC, abstractmethod
from typing import Any, Dict

class OutputAdapter(ABC):
    """Base class for all output destinations"""
    
    @abstractmethod
    async def send(self, signal: Dict[str, Any]) -> bool:
        """Send a signal to the output destination"""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the output destination is available"""
        pass


# outputs/webhook.py
class DiscordWebhookAdapter(OutputAdapter):
    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url
        
    async def send(self, signal: Dict[str, Any]) -> bool:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.webhook_url,
                json=self._format_signal(signal)
            )
            return response.status_code == 204
    
    def _format_signal(self, signal: dict) -> dict:
        return {
            "content": f"🐋 **{signal['ticker']}** {signal['direction']}",
            "embeds": [{
                "title": f"{signal['option_type']} ${signal['strike']} {signal['expiration']}",
                "fields": [
                    {"name": "Premium", "value": f"${signal['premium']:,}", "inline": True},
                    {"name": "Type", "value": signal.get('trade_type', 'N/A'), "inline": True},
                ]
            }]
        }


# outputs/database.py
class DatabaseAdapter(OutputAdapter):
    """Store signals for later analysis/backtesting"""
    
    def __init__(self, db_session):
        self.db = db_session
        
    async def send(self, signal: Dict[str, Any]) -> bool:
        # Insert into signals table
        await self.db.execute(
            "INSERT INTO signals (ticker, direction, premium, timestamp, raw_data) VALUES (?, ?, ?, ?, ?)",
            (signal['ticker'], signal['direction'], signal['premium'], signal['timestamp'], json.dumps(signal))
        )
        return True


# outputs/file_watcher.py
class FileWatcherAdapter(OutputAdapter):
    """
    Write signals to a file/S3/R2 for external consumers
    (e.g., browser extension polling for Discord typing automation)
    """
    
    def __init__(self, output_path: str):
        self.output_path = output_path  # Local path, S3 URI, or R2 URI
        
    async def send(self, signal: Dict[str, Any]) -> bool:
        # Append to JSONL file or upload to cloud storage
        signal_with_id = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat(),
            **signal
        }
        
        async with aiofiles.open(self.output_path, 'a') as f:
            await f.write(json.dumps(signal_with_id) + '\n')
        
        return True


# outputs/multi.py
class MultiOutputAdapter(OutputAdapter):
    """Fan-out to multiple destinations"""
    
    def __init__(self, adapters: list[OutputAdapter]):
        self.adapters = adapters
        
    async def send(self, signal: Dict[str, Any]) -> bool:
        results = await asyncio.gather(
            *[adapter.send(signal) for adapter in self.adapters],
            return_exceptions=True
        )
        return all(r is True for r in results)
```

#### 4.2 Configuration for Output Routing
```python
# config/outputs.py
from enum import Enum

class OutputType(Enum):
    DISCORD_WEBHOOK = "discord_webhook"
    DATABASE = "database"
    FILE_WATCHER = "file_watcher"  # For browser extension consumption
    TWITTER = "twitter"
    TELEGRAM = "telegram"
    CONSOLE = "console"  # For debugging

# Example config
OUTPUT_CONFIG = {
    "enabled_outputs": [
        {
            "type": OutputType.DATABASE,
            "config": {"connection_string": "sqlite:///signals.db"}
        },
        {
            "type": OutputType.FILE_WATCHER,
            "config": {"output_path": "/tmp/signals.jsonl"}  # Extension polls this
        },
        # Add more as needed:
        # {
        #     "type": OutputType.DISCORD_WEBHOOK,
        #     "config": {"webhook_url": "https://discord.com/api/webhooks/..."}
        # },
    ]
}
```

#### 4.3 Standardized Signal Schema (Cross-Tool Compatible)

All tools in the suite should use this common signal format:

```python
# data/models.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum

class SignalSource(Enum):
    """Which tool generated this signal - EXTENSIBLE for future tools"""
    FLOW_BOT = "flow_bot"              # This tool
    TECHNICAL_ANALYSIS = "ta_tool"      # Future: TA signals
    NEWS_SENTIMENT = "news_sentiment"   # Future: News-based signals
    DARK_POOL = "dark_pool"            # Could be separate or part of flow
    PORTFOLIO = "portfolio"             # Future: Portfolio-based alerts
    AGGREGATOR = "aggregator"           # Future: Combined signals
    MANUAL = "manual"                   # User-created signals


class SignalDirection(Enum):
    BULLISH = "bullish"
    BEARISH = "bearish"
    NEUTRAL = "neutral"


class SignalStrength(Enum):
    WEAK = 1
    MODERATE = 2
    STRONG = 3
    VERY_STRONG = 4


class BaseSignal(BaseModel):
    """
    STANDARDIZED SIGNAL FORMAT - All tools in suite must use this
    
    This enables:
    - Cross-tool signal aggregation
    - Unified dashboard display
    - Combined backtesting across signal sources
    - Signal correlation analysis
    """
    # Core identification
    id: str                             # UUID
    source: SignalSource                # Which tool generated this
    timestamp: datetime                 # When signal was generated
    
    # Asset information
    ticker: str
    asset_type: str = "equity"          # equity, option, etf, crypto, etc.
    
    # Signal information
    direction: SignalDirection
    strength: SignalStrength
    confidence: float                   # 0.0 - 1.0
    
    # Optional context
    expiration: Optional[str] = None    # For options
    strike: Optional[float] = None      # For options
    option_type: Optional[str] = None   # CALL/PUT
    
    # Metadata
    tags: List[str] = []                # e.g., ["sweep", "large_block", "earnings_play"]
    raw_data: Optional[Dict[str, Any]] = None  # Original data from source
    
    # Cross-tool linking
    related_signals: List[str] = []     # IDs of related signals from other tools
    parent_signal_id: Optional[str] = None  # If this is derived from another signal
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class FlowSignal(BaseSignal):
    """Flow-specific signal extending the base"""
    source: SignalSource = SignalSource.FLOW_BOT
    
    # Flow-specific fields
    premium: float
    volume: int
    open_interest: int
    trade_type: str                     # SWEEP, BLOCK, SPLIT, etc.
    side: str                           # BID, ASK, MID
    dte: int                            # Days to expiration
    
    # Greeks (if available)
    delta: Optional[float] = None
    gamma: Optional[float] = None
    iv: Optional[float] = None


# Example: Future TA tool would create
class TASignal(BaseSignal):
    """Technical Analysis signal (FUTURE TOOL)"""
    source: SignalSource = SignalSource.TECHNICAL_ANALYSIS
    
    indicator: str                      # RSI, MACD, etc.
    timeframe: str                      # 1m, 5m, 1h, 1d
    indicator_value: float
    threshold_crossed: Optional[str] = None
```

#### 4.4 Cross-Tool Event Bus

```python
# events/bus.py
"""
Event bus for inter-tool communication within the suite.
Tools can publish events and subscribe to events from other tools.
"""
import asyncio
from typing import Callable, Dict, List, Any
from enum import Enum
import redis.asyncio as redis
import json


class EventType(Enum):
    # Flow Bot events
    FLOW_SIGNAL = "flow.signal"
    FLOW_ALERT = "flow.alert"
    DARK_POOL_SIGNAL = "darkpool.signal"
    
    # Future tool events (reserved)
    TA_SIGNAL = "ta.signal"
    NEWS_SIGNAL = "news.signal"
    PORTFOLIO_ALERT = "portfolio.alert"
    
    # Aggregated events
    COMBINED_SIGNAL = "combined.signal"
    HIGH_CONVICTION = "signal.high_conviction"
    
    # System events
    TOOL_STARTED = "system.tool_started"
    TOOL_STOPPED = "system.tool_stopped"
    HEALTH_CHECK = "system.health"


class EventBus:
    """
    Redis-based event bus for tool-to-tool communication.
    
    Usage:
        # Publishing (from Flow Bot)
        await bus.publish(EventType.FLOW_SIGNAL, signal.dict())
        
        # Subscribing (from Dashboard or another tool)
        await bus.subscribe(EventType.FLOW_SIGNAL, my_handler)
    """
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        self.redis: Optional[redis.Redis] = None
        self.subscribers: Dict[EventType, List[Callable]] = {}
        
    async def connect(self):
        self.redis = await redis.from_url(self.redis_url)
        
    async def publish(self, event_type: EventType, data: Dict[str, Any]):
        """Publish event for other tools to consume"""
        message = {
            "event_type": event_type.value,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.redis.publish(event_type.value, json.dumps(message))
        
    async def subscribe(self, event_type: EventType, handler: Callable):
        """Subscribe to events from other tools"""
        pubsub = self.redis.pubsub()
        await pubsub.subscribe(event_type.value)
        
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                await handler(data)


# Singleton for easy access across the tool
event_bus = EventBus()
```

#### 4.5 Shared Database Schema

```python
# data/database.py
"""
Database schema designed for MULTI-TOOL SUITE.
All tools share these tables for cross-tool analytics.
"""
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON, Enum, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

Base = declarative_base()


class Signal(Base):
    """
    UNIFIED SIGNALS TABLE - All tools write here
    Enables cross-tool analysis and correlation
    """
    __tablename__ = "signals"
    
    id = Column(String, primary_key=True)              # UUID
    source = Column(String, index=True)                # flow_bot, ta_tool, etc.
    timestamp = Column(DateTime, index=True)
    
    # Asset
    ticker = Column(String, index=True)
    asset_type = Column(String)
    
    # Signal
    direction = Column(String)                         # bullish, bearish, neutral
    strength = Column(Integer)                         # 1-4
    confidence = Column(Float)
    
    # Options-specific (nullable for non-options)
    expiration = Column(String, nullable=True)
    strike = Column(Float, nullable=True)
    option_type = Column(String, nullable=True)
    
    # Metadata
    tags = Column(JSON)                                # ["sweep", "large_block"]
    raw_data = Column(JSON)                            # Full original data
    
    # Cross-tool linking
    related_signals = Column(JSON)                     # List of related signal IDs
    parent_signal_id = Column(String, nullable=True)
    
    # Indexes for common queries
    __table_args__ = (
        Index('ix_signals_source_timestamp', 'source', 'timestamp'),
        Index('ix_signals_ticker_timestamp', 'ticker', 'timestamp'),
        Index('ix_signals_direction_strength', 'direction', 'strength'),
    )


class FlowData(Base):
    """Flow-specific extended data (linked to Signal)"""
    __tablename__ = "flow_data"
    
    signal_id = Column(String, ForeignKey('signals.id'), primary_key=True)
    premium = Column(Float)
    volume = Column(Integer)
    open_interest = Column(Integer)
    trade_type = Column(String)                        # SWEEP, BLOCK, etc.
    side = Column(String)                              # BID, ASK
    dte = Column(Integer)
    delta = Column(Float, nullable=True)
    gamma = Column(Float, nullable=True)
    iv = Column(Float, nullable=True)
    
    signal = relationship("Signal", backref="flow_data")


class ToolState(Base):
    """
    Track state of each tool in the suite.
    Useful for dashboard health monitoring.
    """
    __tablename__ = "tool_state"
    
    tool_name = Column(String, primary_key=True)       # flow_bot, ta_tool, etc.
    status = Column(String)                            # running, stopped, error
    last_heartbeat = Column(DateTime)
    last_signal_at = Column(DateTime, nullable=True)
    signals_today = Column(Integer, default=0)
    config = Column(JSON)                              # Current tool config
    error_message = Column(String, nullable=True)


class AggregatedSignal(Base):
    """
    FUTURE: Combined signals from multiple tools.
    When Flow Bot + TA Tool + News all agree = high conviction.
    """
    __tablename__ = "aggregated_signals"
    
    id = Column(String, primary_key=True)
    timestamp = Column(DateTime, index=True)
    ticker = Column(String, index=True)
    
    # Which tools contributed
    contributing_signals = Column(JSON)                # List of signal IDs
    sources = Column(JSON)                             # ["flow_bot", "ta_tool"]
    
    # Aggregated assessment
    combined_direction = Column(String)
    combined_confidence = Column(Float)
    agreement_score = Column(Float)                    # How much tools agree
```

#### 4.6 API for Dashboard / Other Tools

```python
# api/internal_api.py
"""
Internal REST API for other tools in the suite to query this tool's data.
Could also be used by a dashboard UI.
"""
from fastapi import FastAPI, Query
from typing import List, Optional
from datetime import datetime, timedelta

app = FastAPI(title="Flow Bot API", description="Internal API for tool suite")


@app.get("/signals", response_model=List[FlowSignal])
async def get_signals(
    ticker: Optional[str] = None,
    direction: Optional[str] = None,
    min_premium: Optional[float] = None,
    min_confidence: Optional[float] = None,
    since: Optional[datetime] = None,
    limit: int = Query(default=100, le=1000)
):
    """Query signals - used by dashboard and other tools"""
    pass


@app.get("/signals/{signal_id}")
async def get_signal(signal_id: str):
    """Get specific signal by ID"""
    pass


@app.get("/stats/ticker/{ticker}")
async def get_ticker_stats(ticker: str, days: int = 7):
    """
    Aggregated stats for a ticker.
    Other tools can use this to enrich their analysis.
    """
    pass


@app.get("/stats/summary")
async def get_summary_stats():
    """Overall flow summary - for dashboard widgets"""
    pass


@app.get("/health")
async def health_check():
    """Health check for suite monitoring"""
    return {
        "status": "healthy",
        "tool": "flow_bot",
        "last_signal": "...",
        "uptime": "..."
    }


# WebSocket for real-time streaming to dashboard
@app.websocket("/ws/signals")
async def websocket_signals(websocket):
    """Real-time signal stream for dashboard"""
    pass
```

### Phase 5: Testing & Deployment

#### Requirements
```
# requirements.txt
alpaca-trade-api>=3.0.0
httpx>=0.24.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
python-dotenv>=1.0.0
sqlalchemy>=2.0.0
discord.py>=2.3.0
aiohttp>=3.8.0
pandas>=2.0.0
numpy>=1.24.0
backtrader>=1.9.0
pytest>=7.0.0
pytest-asyncio>=0.21.0
```

#### Environment Variables
```
# .env.example
UW_API_KEY=your_unusual_whales_api_key
ALPACA_API_KEY=your_alpaca_api_key
ALPACA_SECRET_KEY=your_alpaca_secret_key
ALPACA_BASE_URL=https://paper-api.alpaca.markets
DISCORD_WEBHOOK_URL=your_discord_webhook_url
```

---

## Part 6: Development Roadmap

### Sprint 1 (Week 1-2): Foundation
- [ ] Set up project structure
- [ ] Implement configuration management
- [ ] Create Unusual Whales API client
- [ ] Create Alpaca broker integration
- [ ] Basic flow polling loop

### Sprint 2 (Week 3-4): Core Logic
- [ ] Implement trading rules engine
- [ ] Signal generation from flow data
- [ ] Order execution logic
- [ ] Position tracking

### Sprint 3 (Week 5-6): Enhancements
- [ ] Database logging
- [ ] Discord notifications
- [ ] Risk management (stop-loss, take-profit)
- [ ] Paper trading validation

### Sprint 4 (Week 7-8): Testing & Polish
- [ ] Unit tests
- [ ] Integration tests
- [ ] Backtesting framework
- [ ] Documentation
- [ ] Deployment scripts

---

## Part 7: Risk Warnings & Considerations

### Technical Risks
1. **API Rate Limits**: UW API has 30-second timeout; implement proper rate limiting
2. **Data Latency**: Flow data may have delays; not suitable for HFT
3. **Broker Downtime**: Implement retry logic and manual override capability

### Trading Risks
1. **Options flow does NOT indicate market direction** - trades can be hedges
2. **Multi-leg strategies**: A large PUT could be bullish if part of a spread
3. **BTO vs BTC**: Not all buys are "Buy to Open"
4. **Backtesting overfitting**: Past performance ≠ future results

### Compliance
- Paper trade extensively before live trading
- Understand your jurisdiction's regulations
- This is NOT financial advice - use at your own risk

---

## Appendix A: Useful Links

- Unusual Whales API Docs: https://api.unusualwhales.com/docs
- Unusual Whales Public API: https://unusualwhales.com/public-api
- Alpaca Documentation: https://alpaca.markets/docs/
- MCP Server: https://github.com/danwagnerco/mcp-server-unusualwhales
- FlowAlgo Trader Reference: https://github.com/SC4RECOIN/FlowAlgo-Options-Trader

## Appendix B: API Endpoint Reference

### Unusual Whales Key Endpoints
```
GET /api/stock/{ticker}/flow          # Ticker-specific flow
GET /api/stock/flow/recent            # Recent flow alerts
GET /api/darkpool/recent              # Recent dark pool
GET /api/darkpool/{ticker}            # Ticker dark pool
GET /api/market/tide                  # Market sentiment
GET /api/congress/recent              # Congressional trades
GET /api/etf/{ticker}/holdings        # ETF holdings
GET /api/earnings/afterhours          # After-hours earnings
GET /api/earnings/premarket           # Premarket earnings
```

---

*Document prepared for Claude Code implementation. Last updated: January 2026*
