import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";

const config = new pulumi.Config();
const accountId = config.require("cloudflareAccountId");

// KV Namespace for caching market data
const cacheKv = new cloudflare.WorkersKvNamespace("market-cache", {
	accountId,
	title: "market-dash-cache",
});

// D1 Database for user data
const database = new cloudflare.D1Database("market-db", {
	accountId,
	name: "market-dash",
});

// Cloudflare Pages for frontend (deployed via wrangler, config here for reference)
// The actual deployment happens via GitHub Actions or wrangler CLI

// Worker script deployment is handled by wrangler in workers/api-gateway
// This Pulumi config manages the underlying resources

// Export resource IDs for use in wrangler.toml and other configs
export const kvNamespaceId = cacheKv.id;
export const d1DatabaseId = database.id;

// Output configuration for local development
export const localDevConfig = pulumi.interpolate`
# Add these to workers/api-gateway/wrangler.toml:

[[kv_namespaces]]
binding = "CACHE"
id = "${cacheKv.id}"

[[d1_databases]]
binding = "DB"
database_name = "market-dash"
database_id = "${database.id}"
`;

pulumi.log.info("Infrastructure resources created. Update wrangler.toml with the output IDs.");
