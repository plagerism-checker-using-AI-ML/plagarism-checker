"use client"

import { useTheme } from "next-themes"
import { PieChart, Pie, Cell, ResponsiveContainer } from "@/components/ui/chart"
import { motion } from "framer-motion"

interface OverallScoreChartProps {
  score: number
}

export function OverallScoreChart({ score }: OverallScoreChartProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const data = [
    { name: "Plagiarized", value: score },
    { name: "Original", value: 1 - score },
  ]

  const COLORS = isDark
    ? ["hsl(var(--destructive))", "hsl(var(--primary))"]
    : ["hsl(var(--destructive))", "hsl(var(--primary))"]

  return (
    <div className="relative h-60 w-60">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            animationDuration={1500}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <span className="text-4xl font-bold">{(score * 100).toFixed(1)}%</span>
        <span className="text-sm text-muted-foreground">Plagiarism</span>
      </motion.div>
    </div>
  )
}

