# Market Data Analytics Research Document

## Executive Summary

This document provides comprehensive research for building trading algorithms related to market health, sector health, ticker health, economic data health, swing trading, day trading (IBKR), and options flow analysis ("crime" flow detection). This research is intended to support the Market Dash platform and related trading tools.

---

## Table of Contents

1. [Market Health Algorithms](#1-market-health-algorithms)
2. [Sector Health Analysis](#2-sector-health-analysis)
3. [Ticker Health Metrics](#3-ticker-health-metrics)
4. [Economic Data Health](#4-economic-data-health)
5. [Swing Trading Algorithms](#5-swing-trading-algorithms)
6. [Day Trading Bot (IBKR API)](#6-day-trading-bot-ibkr-api)
7. [Options Flow Analysis - "Crime" Flow Detection](#7-options-flow-analysis---crime-flow-detection)
8. [Data Sources Summary](#8-data-sources-summary)
9. [Implementation Recommendations](#9-implementation-recommendations)

---

## 1. Market Health Algorithms

### 1.1 Key Market Health Metrics

#### VIX (CBOE Volatility Index) - "Fear Index"
| VIX Level | Market Condition |
|-----------|------------------|
| < 12 | Extremely low volatility (complacency warning) |
| 12-20 | Normal market conditions |
| 20-30 | Elevated uncertainty |
| 30-40 | High fear/stress |
| > 40 | Extreme fear (crisis levels) |

**Related VIX Indicators:**
- **VVIX**: Volatility of VIX
- **VIX Term Structure**: Contango (normal) vs Backwardation (fear)
- **VIX9D**: 9-day expected volatility
- **SKEW Index**: Tail risk indicator

#### Advance/Decline Metrics

**A/D Ratio Formula:**
```
A/D Ratio = Advancing Issues / Declining Issues

> 2.0 = Strong bullish breadth
1.5-2.0 = Moderate bullish
1.0-1.5 = Slight bullish
0.5-1.0 = Slight bearish
< 0.5 = Strong bearish
```

**TRIN (Arms Index):**
```
TRIN = (Advancing Issues / Declining Issues) / (Advancing Volume / Declining Volume)

< 0.75 = Strong buying pressure (oversold)
0.75-1.0 = Bullish
1.0 = Neutral
1.0-1.25 = Bearish
> 1.25 = Strong selling pressure (overbought)
```

**McClellan Oscillator:**
```
McClellan = 19-day EMA(A/D) - 39-day EMA(A/D)

> +100 = Overbought
+70 to +100 = Strong bullish momentum
-70 to +70 = Normal range
-100 to -70 = Strong bearish momentum
< -100 = Oversold
```

#### New Highs/New Lows
```
High/Low Ratio = New 52-Week Highs / New 52-Week Lows

> 2.0 = Bullish
< 0.5 = Bearish
```

**Hindenburg Omen (Warning Signal):**
Triggers when ALL conditions are met:
1. New highs AND new lows both > 2.2% of NYSE issues
2. NYSE 10-week MA is rising
3. McClellan Oscillator is negative
4. New highs not more than 2x new lows

#### Percentage Above Moving Averages
```
% Above 50-day MA / % Above 200-day MA

> 80% = Overbought (potential pullback)
50-80% = Healthy uptrend
20-50% = Weak market
< 20% = Oversold (potential bounce)
```

### 1.2 Composite Market Health Score Algorithm

```python
class MarketHealthCalculator:
    WEIGHTS = {
        'vix': 0.20,
        'advance_decline': 0.20,
        'new_highs_lows': 0.15,
        'percent_above_ma': 0.15,
        'sector_breadth': 0.15,
        'volume_breadth': 0.15,
    }

    def calculate_composite_score(self, indicators: dict) -> float:
        """Returns 0-100 score: 0=extremely bearish, 100=extremely bullish"""
        # VIX inverse scoring
        # A/D ratio scoring
        # Highs/Lows ratio scoring
        # % above MA scoring
        # Weighted average
```

### 1.3 Data Sources for Market Health
| Data Point | Free Source | Paid Source |
|------------|-------------|-------------|
| VIX | Yahoo Finance (^VIX) | CBOE LiveVol |
| A/D Data | Barchart (scrape) | Quandl/Nasdaq |
| New Highs/Lows | WSJ Markets | Quandl/Nasdaq |
| TRIN | Barchart | Bloomberg |
| Sector Data | Polygon.io | IEX Cloud |

---

## 2. Sector Health Analysis

### 2.1 SPDR Sector ETFs (GICS Classification)

| Symbol | Sector | Focus | Character |
|--------|--------|-------|-----------|
| XLE | Energy | Oil, gas, energy equipment | Cyclical |
| XLK | Technology | Software, hardware, semiconductors | Growth |
| XLF | Financials | Banks, insurance, capital markets | Cyclical |
| XLV | Health Care | Pharma, biotech, providers | Defensive |
| XLI | Industrials | Aerospace, machinery, transportation | Cyclical |
| XLB | Materials | Chemicals, metals, mining | Cyclical |
| XLP | Consumer Staples | Food, beverages, household | Defensive |
| XLY | Consumer Discretionary | Retail, autos, leisure | Cyclical |
| XLU | Utilities | Electric, gas, water | Defensive |
| XLRE | Real Estate | REITs, real estate services | Defensive |
| XLC | Communication Services | Media, telecom, entertainment | Growth |

### 2.2 Relative Strength Algorithm

```python
class RelativeStrengthAnalyzer:
    def calculate_rs(self, sector_return: float, spy_return: float) -> float:
        """
        RS = Sector % Change / SPY % Change
        RS > 1 = outperforming
        RS < 1 = underperforming
        """
        return sector_return / spy_return if spy_return != 0 else 1.0

    def rank_sectors(self, period: int = 20) -> List[SectorRanking]:
        """Rank all 11 sectors by relative strength"""
```

### 2.3 Sector Rotation Detection

```python
class RotationAnalyzer:
    DEFENSIVE = ['XLU', 'XLP', 'XLV']  # Risk-off
    CYCLICAL = ['XLY', 'XLI', 'XLB', 'XLF']  # Risk-on
    GROWTH = ['XLK', 'XLC']  # Growth

    def detect_rotation(self, sector_returns: dict) -> str:
        """
        Returns: RISK_ON, RISK_OFF, or NEUTRAL

        Defensive → Cyclical = Risk-on shift
        Cyclical → Defensive = Risk-off shift
        """
        defensive_avg = avg([sector_returns[s] for s in DEFENSIVE])
        cyclical_avg = avg([sector_returns[s] for s in CYCLICAL])

        risk_score = cyclical_avg - defensive_avg
        if risk_score > 0.5: return "RISK_ON"
        elif risk_score < -0.5: return "RISK_OFF"
        return "NEUTRAL"
```

### 2.4 Sector Volume Anomaly Detection

```python
class SectorVolumeAnalyzer:
    def calculate_volume_ratio(self, today_volume: int, avg_20d_volume: float) -> float:
        """Volume ratio = Today / 20-day average"""
        return today_volume / avg_20d_volume

    def detect_anomalies(self, threshold: float = 1.5) -> List[str]:
        """Flag sectors with volume > 1.5x average"""
```

---

## 3. Ticker Health Metrics

### 3.1 Technical Health Indicators

#### Momentum Indicators
| Indicator | Overbought | Oversold | Neutral |
|-----------|------------|----------|---------|
| RSI (14) | > 70 | < 30 | 30-70 |
| Stochastic (14,3) | > 80 | < 20 | 20-80 |
| CCI (20) | > 100 | < -100 | -100 to 100 |
| Williams %R | > -20 | < -80 | -80 to -20 |

#### Trend Indicators
- **MACD**: Signal line crossovers, histogram divergence
- **ADX**: > 25 = strong trend, < 20 = weak/no trend
- **Moving Average Alignment**: 20 > 50 > 200 MA = bullish stack

#### Volume Indicators
- **OBV (On-Balance Volume)**: Confirms price trends
- **VWAP**: Intraday institutional reference
- **Volume Ratio**: Today vs 20-day average

### 3.2 Composite Ticker Strength Score

```python
class TickerStrengthCalculator:
    def calculate_strength(self, ticker: str) -> float:
        """
        Composite score (0-100) based on:
        - Price momentum (1d, 5d, 20d % change)
        - Relative strength vs SPY
        - Volume trends
        - Distance from 52-week high/low
        - Moving average alignment
        """
        return {
            'momentum_1d': self._momentum(ticker, 1),
            'momentum_5d': self._momentum(ticker, 5),
            'momentum_20d': self._momentum(ticker, 20),
            'rs_vs_spy': self._relative_strength(ticker),
            'volume_trend': self._volume_trend(ticker),
            'ma_alignment': self._ma_alignment(ticker),  # 0-100
            'high_low_position': self._hl_position(ticker),  # 0-100
        }
```

### 3.3 Fundamental Health Metrics

| Category | Metrics |
|----------|---------|
| Profitability | Gross Margin, Operating Margin, Net Margin, ROE, ROA |
| Growth | Revenue Growth (YoY), EPS Growth, FCF Growth |
| Valuation | P/E, P/S, P/B, EV/EBITDA, PEG Ratio |
| Debt | Debt/Equity, Interest Coverage, Current Ratio |
| Quality | Piotroski F-Score (0-9), Altman Z-Score |

### 3.4 Sentiment Indicators
- **Analyst Ratings**: Buy/Hold/Sell consensus, price targets
- **Short Interest**: % float short, days to cover
- **Social Sentiment**: Reddit, Twitter/X mentions, sentiment scores
- **News Sentiment**: FinBERT/similar NLP sentiment analysis

### 3.5 Data Sources for Ticker Health
| Data Type | Free | Paid |
|-----------|------|------|
| Technical | Polygon.io, Yahoo | Alpha Vantage Premium |
| Fundamental | Yahoo Finance | Financial Modeling Prep |
| Sentiment | Reddit API | Benzinga, Refinitiv |
| Analyst Ratings | Yahoo | Refinitiv, FactSet |

---

## 4. Economic Data Health

### 4.1 Key Economic Indicators

#### Leading Indicators (Predict 6-12 months ahead)
| Indicator | Source | Frequency | Impact |
|-----------|--------|-----------|--------|
| Yield Curve (2y-10y) | Treasury | Daily | Recession predictor |
| Stock Market (S&P 500) | Markets | Real-time | Forward-looking |
| Building Permits | Census | Monthly | Construction pipeline |
| Initial Jobless Claims | DOL | Weekly | Early employment signal |
| ISM New Orders | ISM | Monthly | Manufacturing demand |
| Consumer Expectations | Conference Board | Monthly | Spending intentions |
| LEI (Leading Economic Index) | Conference Board | Monthly | Composite of 10 |

#### Coincident Indicators (Real-time snapshot)
- Nonfarm Payrolls (BLS, Monthly)
- Personal Income (BEA, Monthly)
- Industrial Production (Fed, Monthly)

#### Lagging Indicators (Confirm trends)
- Unemployment Rate (BLS, Monthly)
- CPI/Core CPI (BLS, Monthly)
- Corporate Profits (BEA, Quarterly)

### 4.2 Critical Economic Events (High Impact)

| Event | Frequency | Typical Release |
|-------|-----------|-----------------|
| FOMC Rate Decision | 8x/year | 2:00 PM ET |
| Non-Farm Payrolls | Monthly | 8:30 AM ET (1st Friday) |
| CPI/Core CPI | Monthly | 8:30 AM ET |
| GDP | Quarterly | 8:30 AM ET |
| PCE Price Index | Monthly | 8:30 AM ET |
| Retail Sales | Monthly | 8:30 AM ET |
| ISM Manufacturing PMI | Monthly | 10:00 AM ET |

### 4.3 FRED API (Federal Reserve Economic Data)

**Base URL:** `https://api.stlouisfed.org/fred/`
**Rate Limit:** 120 requests/minute
**Auth:** Free API key

**Key Series IDs:**
| Series ID | Description |
|-----------|-------------|
| GDP | Gross Domestic Product |
| UNRATE | Unemployment Rate |
| CPIAUCSL | Consumer Price Index |
| FEDFUNDS | Federal Funds Rate |
| T10Y2Y | 10Y-2Y Treasury Spread |
| UMCSENT | Consumer Sentiment |
| VIXCLS | VIX Close |
| SP500 | S&P 500 |

### 4.4 Economic Data Integration Strategy

```python
class EconomicDataIntegrator:
    def calculate_surprise(self, actual: float, forecast: float) -> float:
        """surprise_pct = (actual - forecast) / forecast"""
        return (actual - forecast) / forecast if forecast != 0 else 0

    def define_regime(self, gdp_growth: float, unemployment: float,
                      inflation: float) -> str:
        """
        Expansion: GDP > 0, unemployment falling
        Contraction: GDP < 0, unemployment rising
        Stagflation: Low growth, high inflation
        Goldilocks: Moderate growth, low inflation
        """
```

### 4.5 Risk Management Around Events
- Reduce position sizes before high-impact events
- Widen stop-losses during event windows
- Consider straddles/strangles for options
- Monitor VIX and credit spreads

---

## 5. Swing Trading Algorithms

### 5.1 Common Swing Trading Strategies

#### Momentum Strategy
```
Entry: RSI > 50 AND price breaks above 20-day high AND volume > 1.5x avg
Exit: RSI < 40 OR price closes below 10-day MA
Holding Period: 3-10 days
```

#### Mean Reversion Strategy
```
Entry: RSI < 30 AND price touches lower Bollinger Band AND volume spike
Exit: Price returns to 20-day MA OR RSI > 50
Holding Period: 2-5 days
```

#### Breakout Strategy
```
Entry: Price breaks resistance with volume confirmation
Exit: Trailing stop (2x ATR) OR target (2:1 R/R)
Holding Period: 5-20 days
```

### 5.2 Entry/Exit Signal Framework

```python
class SwingSignalGenerator:
    def generate_signals(self, ticker: str) -> dict:
        return {
            'entry_signals': {
                'momentum_breakout': self._check_momentum_breakout(),
                'mean_reversion': self._check_oversold_bounce(),
                'consolidation_breakout': self._check_range_breakout(),
            },
            'exit_signals': {
                'trailing_stop': self._calculate_trailing_stop(),
                'profit_target': self._calculate_target(),
                'time_stop': days_in_position > max_hold_days,
            }
        }
```

### 5.3 Position Sizing (Risk-Based)

```python
def calculate_position_size(
    account_value: float,
    risk_per_trade: float,  # e.g., 0.01 = 1%
    entry_price: float,
    stop_loss_price: float
) -> int:
    """
    Position Size = (Account * Risk%) / (Entry - Stop)
    """
    risk_amount = account_value * risk_per_trade
    risk_per_share = abs(entry_price - stop_loss_price)
    shares = int(risk_amount / risk_per_share)
    return shares
```

### 5.4 Key Technical Indicators for Swing Trading
- **RSI (14)**: Momentum/overbought/oversold
- **MACD (12,26,9)**: Trend direction and momentum
- **Bollinger Bands (20,2)**: Volatility and mean reversion
- **ATR (14)**: Volatility-based stops
- **20/50-day MAs**: Trend identification
- **Volume**: Confirmation of moves

### 5.5 Backtesting Considerations
- Use point-in-time data (avoid look-ahead bias)
- Account for slippage and commissions
- Test across multiple market regimes
- Walk-forward optimization
- Out-of-sample testing

---

## 6. Day Trading Bot (IBKR API)

### 6.1 IBKR API Options

| API | Best For | Local Software |
|-----|----------|----------------|
| TWS API | Full trading, lowest latency | Yes (TWS/Gateway) |
| Client Portal API | Simple trading, web apps | No |
| IB Gateway | Headless server deployment | Yes (lightweight) |

**Recommended:** TWS API via IB Gateway for production day trading

### 6.2 Connection Configuration

| Environment | Port | Use |
|-------------|------|-----|
| Paper Trading | 7497 | Development/Testing |
| Live Trading | 7496 | Production |

### 6.3 Market Data Capabilities

**Level 1 (Top of Book):**
- Bid/Ask prices and sizes
- Last trade price and size
- Volume, High/Low/Open/Close

**Level 2 (Market Depth):**
- Multiple bid/ask levels (5-20)
- Requires subscription (~$25/mo per exchange)

**Tick-by-Tick:**
- Individual trade prints
- Most granular data

### 6.4 Order Types for Day Trading

| Order Type | Use Case |
|------------|----------|
| Market | Quick entry/exit |
| Limit | Primary order type |
| Stop | Stop losses |
| Stop Limit | Controlled stops |
| Bracket | Auto profit target + stop loss |
| Trailing Stop | Lock in profits |
| MOC (Market on Close) | End-of-day flattening |

### 6.5 Day Trading Strategies for Automation

#### Opening Range Breakout (ORB) - HIGH SUITABILITY
```python
class ORBStrategy:
    def __init__(self, opening_range_minutes: int = 15):
        self.range_minutes = opening_range_minutes

    def calculate_levels(self, bars: List[Bar]) -> dict:
        """Define high/low of first N minutes"""
        range_bars = bars[:self.range_minutes]
        return {
            'high': max(b.high for b in range_bars),
            'low': min(b.low for b in range_bars),
        }

    def generate_signal(self, current_price: float, levels: dict) -> str:
        if current_price > levels['high']:
            return "LONG"
        elif current_price < levels['low']:
            return "SHORT"
        return "NONE"
```

#### VWAP Trading - HIGH SUITABILITY
```python
class VWAPStrategy:
    def calculate_vwap(self, bars: List[Bar]) -> float:
        """VWAP = Sum(Price * Volume) / Sum(Volume)"""
        return sum(b.close * b.volume for b in bars) / sum(b.volume for b in bars)

    def generate_signal(self, price: float, vwap: float, deviation: float) -> str:
        if price < vwap - deviation:
            return "LONG"  # Below VWAP = potential long
        elif price > vwap + deviation:
            return "SHORT"  # Above VWAP = potential short
        return "NONE"
```

#### Mean Reversion - HIGH SUITABILITY
- RSI oversold/overbought levels
- Bollinger Band touches
- Distance from VWAP

### 6.6 Risk Controls (Critical)

```python
class RiskManager:
    def __init__(self, config: RiskConfig):
        self.max_daily_loss = config.max_daily_loss  # e.g., $500
        self.max_position_size = config.max_position_size
        self.max_trades_per_day = config.max_trades_per_day
        self.daily_pnl = 0
        self.trade_count = 0

    def can_trade(self) -> tuple[bool, str]:
        if abs(self.daily_pnl) >= self.max_daily_loss:
            return False, "Daily loss limit reached"
        if self.trade_count >= self.max_trades_per_day:
            return False, "Max trades reached"
        return True, "OK"

    def kill_switch(self):
        """Emergency: Cancel all orders, flatten all positions"""
        self.cancel_all_orders()
        self.flatten_all_positions()
        self.disable_trading()
        self.send_alert("KILL SWITCH ACTIVATED")
```

### 6.7 Python Libraries

| Library | Type | Pros | Cons |
|---------|------|------|------|
| ibapi | Official | Full coverage, always current | Verbose, complex |
| ib_insync | Third-party | Pythonic, easier | May lag updates |

**Recommendation:** Use `ib_insync` for development, consider `ibapi` for production

### 6.8 Rate Limits & Data Subscriptions

**Rate Limits:**
- 50 messages/second general
- 100 simultaneous market data lines
- Historical data: 60 requests per 10 minutes

**Required Subscriptions (~$50-100/mo total):**
- US Securities Snapshot Bundle: ~$10/mo
- NASDAQ TotalView (L2): ~$25/mo
- NYSE OpenBook (L2): ~$25/mo

---

## 7. Options Flow Analysis - "Crime" Flow Detection

### 7.1 What is "Crime" Flow?

Unusual options activity that may indicate informed trading:
- **Outsized option buys** relative to normal volume
- **Suspicious open interest** patterns (only OI on certain strikes)
- **Suspiciously timed** purchases before major announcements
- **Unusual premium** paid (above market pricing)

### 7.2 Key Detection Metrics

#### Volume/Open Interest Analysis
```python
class UnusualActivityDetector:
    def check_volume_oi_ratio(self, volume: int, open_interest: int) -> dict:
        """
        High V/OI ratio indicates new positions being opened
        V/OI > 1.0 = Significant new interest
        V/OI > 3.0 = Very unusual
        V/OI > 5.0 = Extremely unusual (potential "crime")
        """
        ratio = volume / open_interest if open_interest > 0 else float('inf')
        return {
            'ratio': ratio,
            'unusual': ratio > 1.5,
            'very_unusual': ratio > 3.0,
            'suspicious': ratio > 5.0
        }
```

#### Sweep Order Detection
```python
def is_sweep_order(trade: dict) -> bool:
    """
    Sweeps = aggressive orders that hit multiple exchanges simultaneously
    Indicates urgency to establish position quickly
    """
    return trade.get('trade_type') == 'SWEEP'
```

#### Premium Analysis
```python
def analyze_premium(premium: float, avg_premium: float) -> dict:
    """
    Large premium = institutional interest
    Unusual premium relative to history = potential informed trade
    """
    ratio = premium / avg_premium if avg_premium > 0 else 1.0
    return {
        'premium': premium,
        'vs_average': ratio,
        'unusual': ratio > 2.0,
        'very_unusual': ratio > 5.0,
        'block_trade': premium > 100000  # $100K+ = block
    }
```

#### Unusual Strike/Expiration Patterns
```python
def detect_suspicious_chain(option_chain: List[dict]) -> dict:
    """
    Red flags:
    - Only OI on one or few strikes = concentrated bet
    - Far OTM options with high OI = speculative/informed
    - Very short DTE with huge volume = potential event trade
    """
    single_strike_concentration = max_oi_strike.oi / total_oi > 0.5
    far_otm_activity = any(is_far_otm(o) and o['oi'] > threshold for o in chain)
    short_dte_volume = dte < 7 and volume > 10 * avg_volume

    return {
        'concentrated_strike': single_strike_concentration,
        'far_otm_activity': far_otm_activity,
        'short_dte_unusual': short_dte_volume
    }
```

### 7.3 "Crime" Flow Scoring Algorithm

```python
class CrimeFlowScorer:
    """
    Composite score for suspicious options activity
    Score 0-100: Higher = more suspicious
    """

    def calculate_crime_score(self, flow: dict) -> dict:
        score = 0
        flags = []

        # Volume/OI ratio (max 25 points)
        vol_oi = flow['volume'] / flow['open_interest']
        if vol_oi > 5.0:
            score += 25
            flags.append("EXTREME_VOL_OI")
        elif vol_oi > 3.0:
            score += 15
            flags.append("HIGH_VOL_OI")
        elif vol_oi > 1.5:
            score += 8

        # Premium size (max 20 points)
        if flow['premium'] > 500000:
            score += 20
            flags.append("MASSIVE_PREMIUM")
        elif flow['premium'] > 100000:
            score += 12
            flags.append("LARGE_BLOCK")
        elif flow['premium'] > 50000:
            score += 6

        # Sweep order (15 points)
        if flow['trade_type'] == 'SWEEP':
            score += 15
            flags.append("SWEEP")

        # OTM distance (max 15 points)
        otm_pct = abs(flow['strike'] - flow['underlying_price']) / flow['underlying_price']
        if otm_pct > 0.20:  # 20%+ OTM
            score += 15
            flags.append("FAR_OTM")
        elif otm_pct > 0.10:
            score += 8

        # Short DTE (max 15 points)
        if flow['dte'] <= 3:
            score += 15
            flags.append("VERY_SHORT_DTE")
        elif flow['dte'] <= 7:
            score += 8
            flags.append("SHORT_DTE")

        # Timing (max 10 points)
        if self._is_near_earnings(flow['ticker'], flow['timestamp']):
            score += 10
            flags.append("NEAR_EARNINGS")

        return {
            'score': min(score, 100),
            'flags': flags,
            'interpretation': self._interpret_score(score)
        }

    def _interpret_score(self, score: int) -> str:
        if score >= 70: return "HIGHLY_SUSPICIOUS"
        if score >= 50: return "SUSPICIOUS"
        if score >= 30: return "UNUSUAL"
        return "NORMAL"
```

### 7.4 Dark Pool Correlation

```python
class DarkPoolCorrelator:
    """
    Correlate unusual options activity with dark pool prints
    Heavy DP activity + unusual options = stronger signal
    """

    def correlate_signals(self, options_flow: dict, dark_pool: List[dict]) -> dict:
        ticker = options_flow['ticker']
        timestamp = options_flow['timestamp']

        # Look for DP activity within window
        relevant_dp = [dp for dp in dark_pool
                      if dp['ticker'] == ticker
                      and abs(dp['timestamp'] - timestamp) < timedelta(hours=2)]

        dp_volume = sum(dp['volume'] for dp in relevant_dp)
        dp_bias = self._calculate_dp_bias(relevant_dp)  # BUY vs SELL

        return {
            'correlated_dp_volume': dp_volume,
            'dp_bias': dp_bias,
            'correlation_strength': 'HIGH' if dp_volume > 100000 else 'LOW'
        }
```

### 7.5 Data Sources for Options Flow

| Provider | Data | Cost | Real-time |
|----------|------|------|-----------|
| Unusual Whales | Flow, Dark Pool, Congress | $48/mo | Yes (5-12min free) |
| FlowAlgo | Flow, Alerts, Voice | $99-149/mo | Yes |
| Cheddar Flow | Flow, AI Alerts, DP | $85-99/mo | Yes |
| CBOE | Raw Options Data | Enterprise | Yes |
| Polygon.io | Options (limited) | $79/mo | Yes |

### 7.6 Unusual Whales API Integration

From existing `unusual_whales_flow_bot.md`:

```python
class UnusualWhalesClient:
    BASE_URL = "https://api.unusualwhales.com"

    async def get_flow_alerts(self, limit: int = 50) -> List[dict]:
        """Recent options flow alerts"""

    async def get_dark_pool(self, limit: int = 50) -> List[dict]:
        """Recent dark pool activity"""

    async def get_market_tide(self) -> dict:
        """Overall market sentiment from flow"""

    async def get_ticker_flow(self, ticker: str) -> dict:
        """Flow for specific ticker"""
```

---

## 8. Data Sources Summary

### 8.1 Primary Data Sources

| Source | Data Types | Cost | Already Integrated |
|--------|------------|------|-------------------|
| Polygon.io | Prices, OHLCV, Sector ETFs | $29-79/mo | Yes |
| Unusual Whales | Options Flow, Dark Pool | $48/mo (API: Lifetime) | Planned |
| Yahoo Finance | VIX, Indices, Fundamentals | Free | Partial |
| FRED | Economic Data | Free | No |

### 8.2 Recommended Additional Sources

| Source | Data Types | Cost | Priority |
|--------|------------|------|----------|
| Alpha Vantage | Technical indicators | Free tier | Medium |
| IEX Cloud | Real-time quotes, News | $19/mo | Medium |
| Quandl/Nasdaq | Breadth data, A/D | Varies | Low |
| Interactive Brokers | Trading execution | Commissions | High (for trading) |

### 8.3 Free Alternatives

| Need | Free Option | Limitations |
|------|-------------|-------------|
| VIX Data | Yahoo Finance (^VIX) | 15-20 min delay |
| Economic Data | FRED API | Not real-time |
| News Sentiment | RSS + FinBERT | DIY sentiment |
| Technical Indicators | Calculate from OHLCV | Compute cost |

---

## 9. Implementation Recommendations

### 9.1 Proposed Services Architecture

```
services/
├── market-health/          # NEW - VIX, breadth, composite scores
├── sector-analyzer/        # PLANNED - Sector rotation, RS
├── strength-analyzer/      # PLANNED - Ticker strength rankings
├── economic-data/          # NEW - FRED integration, calendar
├── swing-signals/          # NEW - Swing trade signal generation
├── options-flow/           # PLANNED - Crime flow detection
├── trading-bot/            # NEW - IBKR day trading execution
│   ├── strategies/
│   ├── risk/
│   └── execution/
└── market-ingestor/        # EXISTS - Polygon data ingestion
```

### 9.2 Implementation Priority

**Phase 1: Data Foundation**
1. Market Health Service (VIX, breadth proxies from Polygon)
2. Economic Data Service (FRED integration)
3. Sector Analyzer (existing plan, RS and rotation)

**Phase 2: Analysis Algorithms**
4. Ticker Strength Analyzer (existing plan)
5. Swing Signal Generator
6. Options Flow Crime Detection

**Phase 3: Trading Automation**
7. IBKR Integration (paper trading first)
8. Day Trading Bot with risk controls
9. Production deployment with kill switches

### 9.3 Database Schema Additions

```sql
-- Market health snapshots
CREATE TABLE market_health (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    vix DECIMAL(6,2),
    vix_term_structure VARCHAR(20),
    ad_ratio DECIMAL(6,3),
    new_highs INT,
    new_lows INT,
    pct_above_50ma DECIMAL(5,2),
    pct_above_200ma DECIMAL(5,2),
    composite_score DECIMAL(5,2),
    regime VARCHAR(20),
    UNIQUE(timestamp)
);

-- Economic events
CREATE TABLE economic_events (
    id SERIAL PRIMARY KEY,
    event_date DATE NOT NULL,
    event_time TIME,
    event_name VARCHAR(100),
    actual DECIMAL(10,3),
    forecast DECIMAL(10,3),
    previous DECIMAL(10,3),
    surprise DECIMAL(10,3),
    impact VARCHAR(10)
);

-- Crime flow alerts
CREATE TABLE crime_flow_alerts (
    id UUID PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    ticker VARCHAR(10),
    strike DECIMAL(10,2),
    expiration DATE,
    option_type VARCHAR(4),
    premium DECIMAL(12,2),
    volume INT,
    open_interest INT,
    trade_type VARCHAR(20),
    crime_score INT,
    flags JSONB,
    raw_data JSONB
);

-- Trading bot executions
CREATE TABLE bot_trades (
    id UUID PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    strategy VARCHAR(50),
    ticker VARCHAR(10),
    side VARCHAR(4),
    quantity INT,
    price DECIMAL(10,2),
    order_type VARCHAR(20),
    status VARCHAR(20),
    pnl DECIMAL(10,2),
    notes TEXT
);
```

### 9.4 API Endpoints Summary

```
# Market Health
GET /api/v1/health/summary
GET /api/v1/health/vix
GET /api/v1/health/breadth
GET /api/v1/health/regime

# Economic
GET /api/v1/economic/calendar
GET /api/v1/economic/indicators
GET /api/v1/economic/releases

# Swing Signals
GET /api/v1/swing/signals
GET /api/v1/swing/signals/{ticker}
GET /api/v1/swing/watchlist

# Crime Flow
GET /api/v1/crime-flow/alerts
GET /api/v1/crime-flow/alerts/{ticker}
GET /api/v1/crime-flow/score/{flow_id}

# Trading Bot (internal)
POST /api/v1/bot/execute
GET /api/v1/bot/positions
GET /api/v1/bot/pnl
POST /api/v1/bot/kill-switch
```

---

## Summary

This research document covers the key components needed for building comprehensive market analytics and trading algorithms:

1. **Market Health**: VIX, breadth indicators, composite scoring
2. **Sector Health**: SPDR ETF analysis, rotation detection, RS rankings
3. **Ticker Health**: Technical + fundamental metrics, strength scoring
4. **Economic Data**: FRED integration, event calendar, regime detection
5. **Swing Trading**: Signal generation, position sizing, backtesting
6. **Day Trading**: IBKR API integration, strategies, risk controls
7. **Options Flow**: "Crime" flow detection, scoring algorithms

The existing Market Dash infrastructure (Polygon.io, news analyzer) provides a solid foundation. Next steps involve implementing the new services in priority order, starting with data foundation (market health, economic data) before moving to trading automation.

---

*Research compiled January 2026 for Market Dash platform*
