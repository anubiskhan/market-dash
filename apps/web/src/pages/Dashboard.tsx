import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useMarketSummary } from "@/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { EmptyState } from "@/components/ui/EmptyState";

function IndexCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-6 w-16" />
      </CardContent>
    </Card>
  );
}

function StockListSkeleton() {
  return (
    <div className="space-y-2">
      {["s1", "s2", "s3", "s4", "s5"].map((id) => (
        <Skeleton key={id} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function Dashboard() {
  const {
    data: market,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useMarketSummary();

  if (isError) {
    return (
      <div className="p-6">
        <h1 className="mb-6 text-2xl font-bold">Market Overview</h1>
        <ErrorMessage
          title="Failed to load market data"
          error={error}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const indices = market?.indices ?? [];
  const topGainers = market?.top_gainers?.slice(0, 5) ?? [];
  const topLosers = market?.top_losers?.slice(0, 5) ?? [];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Market Overview</h1>
        {isFetching && !isLoading && (
          <LoadingSpinner size="sm" className="text-slate-400" />
        )}
      </div>

      {/* Index Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <IndexCardSkeleton />
            <IndexCardSkeleton />
            <IndexCardSkeleton />
            <IndexCardSkeleton />
          </>
        ) : indices.length > 0 ? (
          indices.map((index) => (
            <Card key={index.symbol}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{index.name}</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(index.price)}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 text-lg font-semibold",
                    index.change_pct >= 0 ? "text-green-500" : "text-red-500"
                  )}
                >
                  {index.change_pct >= 0 ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : (
                    <TrendingDown className="h-5 w-5" />
                  )}
                  {formatPercent(index.change_pct)}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-4">
            <EmptyState
              variant="data"
              title="No index data available"
              description="Market data will appear here once the market opens"
            />
          </div>
        )}
      </div>

      {/* Gainers and Losers */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Top Gainers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <StockListSkeleton />
            ) : topGainers.length > 0 ? (
              <div className="space-y-2">
                {topGainers.map((stock) => (
                  <div
                    key={stock.symbol}
                    className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2"
                  >
                    <div>
                      <span className="font-medium">{stock.symbol}</span>
                      {stock.price && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          {formatCurrency(stock.price)}
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-green-500">
                      {formatPercent(stock.change_pct)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                variant="data"
                title="No gainers today"
                description="Top gaining stocks will appear here"
                className="py-8"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Top Losers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <StockListSkeleton />
            ) : topLosers.length > 0 ? (
              <div className="space-y-2">
                {topLosers.map((stock) => (
                  <div
                    key={stock.symbol}
                    className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2"
                  >
                    <div>
                      <span className="font-medium">{stock.symbol}</span>
                      {stock.price && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          {formatCurrency(stock.price)}
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-red-500">
                      {formatPercent(stock.change_pct)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                variant="data"
                title="No losers today"
                description="Top losing stocks will appear here"
                className="py-8"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Last Updated */}
      {market?.last_updated && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Last updated: {new Date(market.last_updated).toLocaleString()}
        </p>
      )}
    </div>
  );
}
