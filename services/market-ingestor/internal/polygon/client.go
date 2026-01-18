package polygon

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/anubiskhan/market-dash/services/market-ingestor/internal/models"
)

const baseURL = "https://api.polygon.io"

type Client struct {
	apiKey     string
	httpClient *http.Client
}

func NewClient(apiKey string) *Client {
	return &Client{
		apiKey: apiKey,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// GroupedDailyResponse represents the Polygon grouped daily API response
type GroupedDailyResponse struct {
	Status       string `json:"status"`
	QueryCount   int    `json:"queryCount"`
	ResultsCount int    `json:"resultsCount"`
	Results      []struct {
		T  string  `json:"T"`  // Ticker
		O  float64 `json:"o"`  // Open
		H  float64 `json:"h"`  // High
		L  float64 `json:"l"`  // Low
		C  float64 `json:"c"`  // Close
		V  float64 `json:"v"`  // Volume
		VW float64 `json:"vw"` // VWAP
		Ts int64   `json:"t"`  // Timestamp (prevents conflict with T)
		N  int     `json:"n"`  // Number of transactions
	} `json:"results"`
}

// PreviousCloseResponse represents the Polygon previous close API response
type PreviousCloseResponse struct {
	Status  string `json:"status"`
	Results []struct {
		T  string  `json:"T"`
		O  float64 `json:"o"`
		H  float64 `json:"h"`
		L  float64 `json:"l"`
		C  float64 `json:"c"`
		V  float64 `json:"v"`
		VW float64 `json:"vw"`
		Ts int64   `json:"t"`
		N  int     `json:"n"`
	} `json:"results"`
}

// GetGroupedDaily fetches all US stock data for a given date
func (c *Client) GetGroupedDaily(ctx context.Context, date time.Time) ([]models.DailyBar, error) {
	dateStr := date.Format("2006-01-02")
	url := fmt.Sprintf("%s/v2/aggs/grouped/locale/us/market/stocks/%s?apiKey=%s", baseURL, dateStr, c.apiKey)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("executing request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	// Read body for debugging
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading response body: %w", err)
	}

	var result GroupedDailyResponse
	if err := json.Unmarshal(body, &result); err != nil {
		// Log first 500 chars for debugging
		preview := string(body)
		if len(preview) > 500 {
			preview = preview[:500]
		}
		return nil, fmt.Errorf("decoding response: %w (preview: %s)", err, preview)
	}

	bars := make([]models.DailyBar, 0, len(result.Results))
	for _, r := range result.Results {
		bars = append(bars, models.DailyBar{
			Symbol: r.T,
			Open:   r.O,
			High:   r.H,
			Low:    r.L,
			Close:  r.C,
			Volume: int64(r.V),
			VWAP:   r.VW,
			Date:   date,
		})
	}

	return bars, nil
}

// GetPreviousClose fetches previous day's close for a single ticker
func (c *Client) GetPreviousClose(ctx context.Context, symbol string) (*models.DailyBar, error) {
	url := fmt.Sprintf("%s/v2/aggs/ticker/%s/prev?apiKey=%s", baseURL, symbol, c.apiKey)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("executing request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var result PreviousCloseResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decoding response: %w", err)
	}

	if len(result.Results) == 0 {
		return nil, fmt.Errorf("no data found for %s", symbol)
	}

	r := result.Results[0]
	return &models.DailyBar{
		Symbol: r.T,
		Open:   r.O,
		High:   r.H,
		Low:    r.L,
		Close:  r.C,
		Volume: int64(r.V),
		VWAP:   r.VW,
	}, nil
}
