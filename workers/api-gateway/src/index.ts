import { Hono } from "hono";
import { cors } from "hono/cors";
import { cache } from "hono/cache";

type Bindings = {
	MARKET_SERVICE_URL: string;
	NEWS_SERVICE_URL: string;
	CACHE?: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS middleware
app.use(
	"*",
	cors({
		origin: ["http://localhost:3000", "https://market-dash.pages.dev"],
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type"],
	}),
);

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// Market data routes - proxy to market ingestor service
app.get("/api/market/*", async (c) => {
	const path = c.req.path.replace("/api/market", "/api/v1");
	const url = `${c.env.MARKET_SERVICE_URL}${path}`;

	try {
		const response = await fetch(url, {
			headers: { "Content-Type": "application/json" },
		});

		const data = await response.json();
		return c.json(data, response.status as 200);
	} catch (error) {
		console.error("Market service error:", error);
		return c.json({ error: "Market service unavailable" }, 503);
	}
});

// News routes - proxy to news analyzer service
app.get("/api/news/*", async (c) => {
	const path = c.req.path.replace("/api/news", "/api/v1/news");
	const url = `${c.env.NEWS_SERVICE_URL}${path}`;

	try {
		const response = await fetch(url, {
			headers: { "Content-Type": "application/json" },
		});

		const data = await response.json();
		return c.json(data, response.status as 200);
	} catch (error) {
		console.error("News service error:", error);
		return c.json({ error: "News service unavailable" }, 503);
	}
});

// Dashboard summary - aggregates data from both services
app.get("/api/dashboard", async (c) => {
	const marketUrl = `${c.env.MARKET_SERVICE_URL}/api/v1/summary`;
	const newsUrl = `${c.env.NEWS_SERVICE_URL}/api/v1/news/summary`;

	try {
		const [marketRes, newsRes] = await Promise.allSettled([
			fetch(marketUrl),
			fetch(newsUrl),
		]);

		const market =
			marketRes.status === "fulfilled"
				? await marketRes.value.json()
				: { error: "unavailable" };

		const news =
			newsRes.status === "fulfilled"
				? await newsRes.value.json()
				: { error: "unavailable" };

		return c.json({
			market,
			news,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Dashboard aggregation error:", error);
		return c.json({ error: "Failed to fetch dashboard data" }, 500);
	}
});

// 404 handler
app.notFound((c) => c.json({ error: "Not found" }, 404));

// Error handler
app.onError((err, c) => {
	console.error("Unhandled error:", err);
	return c.json({ error: "Internal server error" }, 500);
});

export default app;
