"use client"

import { useTheme } from "next-themes"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "@/components/ui/chart"

interface SimilarityMetricsChartProps {
  data?: any
}

export function SimilarityMetricsChart({ data }: SimilarityMetricsChartProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const highestMatch = data?.highest_match || {}
  
  // Extract thresholds from the API request (if available) or use default values
  const thresholds = data?.thresholds || {
    semantic: 0.85,
    ngram: 0.4,
    fuzzy: 0.7,
  }

  const chartData = [
    {
      name: "Semantic",
      value: highestMatch.semantic_similarity || 0,
      threshold: thresholds.semantic,
    },
    {
      name: "N-gram",
      value: highestMatch.ngram_similarity || 0,
      threshold: thresholds.ngram,
    },
    {
      name: "Fuzzy",
      value: highestMatch.fuzzy_similarity || 0,
      threshold: thresholds.fuzzy,
    },
  ]

  const getBarColor = (value: number, threshold: number) => {
    return value >= threshold ? "var(--destructive)" : "var(--primary)"
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" tick={{ fill: isDark ? "hsl(var(--foreground))" : "hsl(var(--foreground))" }} />
          <YAxis
            tick={{ fill: isDark ? "hsl(var(--foreground))" : "hsl(var(--foreground))" }}
            domain={[0, 1]}
            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? "hsl(var(--background))" : "white",
              borderColor: "hsl(var(--border))",
            }}
            formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, "Value"]}
          />
          <Legend />
          <Bar dataKey="value" name="Similarity Score" radius={[4, 4, 0, 0]} animationDuration={1500}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.value, entry.threshold)} />
            ))}
          </Bar>
          <Bar
            dataKey="threshold"
            name="Threshold"
            fill="var(--muted-foreground)"
            fillOpacity={0.3}
            radius={[4, 4, 0, 0]}
            animationDuration={1500}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

