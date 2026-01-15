import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon, ArrowRightIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: number
  description: string
  loading?: boolean
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  valueClassName?: string
}

export function StatCard({
  title,
  value,
  description,
  loading = false,
  trend = "neutral",
  trendValue = "0%",
  valueClassName = "",
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {trend === "up" && <ArrowUpIcon className="h-4 w-4 text-emerald-500" />}
        {trend === "down" && <ArrowDownIcon className="h-4 w-4 text-rose-500" />}
        {trend === "neutral" && <ArrowRightIcon className="h-4 w-4 text-gray-500" />}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-9 w-24 animate-pulse bg-gray-200 rounded"></div>
        ) : (
          <div className="text-2xl font-bold">
            <span className={valueClassName || ""}>{value.toLocaleString()}</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {loading ? (
            <span className="h-4 w-16 animate-pulse bg-gray-200 rounded inline-block"></span>
          ) : (
            <>
              <span
                className={trend === "up" ? "text-emerald-500" : trend === "down" ? "text-rose-500" : "text-gray-500"}
              >
                {trendValue}
              </span>{" "}
              {description}
            </>
          )}
        </p>
      </CardContent>
    </Card>
  )
}
