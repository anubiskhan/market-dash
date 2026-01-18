import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { cn, formatCurrency, formatPercent, formatVolume } from "@/lib/utils";
import { Filter } from "lucide-react";
import { useMostActive } from "@/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { EmptyState } from "@/components/ui/EmptyState";

export function Screener() {
  const {
    data: stocks,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useMostActive();

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Stock Screener</h1>
          {isFetching && !isLoading && <LoadingSpinner size="sm" />}
        </div>
        <button type="button" className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/80">
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      {isError ? (
        <ErrorMessage
          title="Failed to load screener data"
          error={error}
          onRetry={() => refetch()}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Most Active Stocks</CardTitle>
            <p className="text-sm text-muted-foreground">
              Stocks with highest trading volume today
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SkeletonTable rows={5} />
            ) : stocks && stocks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left text-sm text-muted-foreground">
                      <th className="pb-3 pr-4">Symbol</th>
                      <th className="pb-3 pr-4">Name</th>
                      <th className="pb-3 pr-4 text-right">Price</th>
                      <th className="pb-3 pr-4 text-right">Change</th>
                      <th className="pb-3 pr-4 text-right">Volume</th>
                      <th className="pb-3 text-right">Vol Ratio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stocks.map((stock) => (
                      <tr
                        key={stock.symbol}
                        className="border-b border-border/50 transition-colors hover:bg-secondary/30"
                      >
                        <td className="py-3 pr-4 font-medium">{stock.symbol}</td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {stock.name || stock.symbol}
                        </td>
                        <td className="py-3 pr-4 text-right">
                          {formatCurrency(stock.price)}
                        </td>
                        <td
                          className={cn(
                            "py-3 pr-4 text-right font-medium",
                            stock.change_pct >= 0 ? "text-green-500" : "text-red-500"
                          )}
                        >
                          {formatPercent(stock.change_pct)}
                        </td>
                        <td className="py-3 pr-4 text-right">
                          {formatVolume(stock.volume)}
                        </td>
                        <td className="py-3 text-right text-muted-foreground">
                          {stock.volume_ratio
                            ? `${stock.volume_ratio.toFixed(2)}x`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                variant="data"
                title="No stocks found"
                description="Active stocks will appear here when the market is open"
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
