"use client"

import { useEffect, useState } from "react"
import { OverallScoreChart } from "@/components/overall-score-chart"
import { SimilarityMetricsChart } from "@/components/similarity-metrics-chart"
import { SourceCard } from "@/components/source-card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { DocumentTextHighlight } from "@/components/document-text-highlight"
import { cn } from "@/lib/utils"

export default function ReportPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    // Get data from localStorage
    const reportData = localStorage.getItem('reportData')
    if (reportData) {
      setData(JSON.parse(reportData))
    }
  }, [])

  if (!data) {
    return <div>No report data available</div>
  }

  const overallScore = data?.plagiarism_overall_score || 0
  const wordCount = data?.total_word_count || 0
  const sources = data?.plagiarism_results || []
  const isAiGenerated = data?.ai_detection_results?.overall_is_ai_generated || false
  const aiProbability = data?.ai_detection_results?.overall_ai_probability || 0

  return (
    <div className="min-h-screen bg-white p-8 space-y-8 print:p-0">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold">Plagiarism Analysis Report</h1>
            <p className="text-sm text-muted-foreground">
              Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </p>
          </div>
          <Badge 
            variant={overallScore > 0.5 ? "destructive" : overallScore > 0.3 ? "secondary" : "default"}
            className={cn(
              overallScore <= 0.3 && "bg-green-600 hover:bg-green-700 text-white border-transparent"
            )}
          >
            {overallScore > 0.5 ? "High Plagiarism" : overallScore > 0.3 ? "Medium Plagiarism" : "Low Plagiarism"}
          </Badge>
        </div>

        {/* Overall Score */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Overall Plagiarism Score</h2>
            <div className="bg-muted/30 rounded-xl p-6 flex items-center justify-center">
              <OverallScoreChart score={overallScore} />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Document Statistics</h2>
            <div className="bg-muted/30 rounded-xl p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Total Word Count</span>
                  <span className="font-mono">{wordCount.toLocaleString()}</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">AI-Generated Content</span>
                  <span className="font-mono">{(aiProbability * 100).toFixed(2)}%</span>
                </div>
                <Progress value={aiProbability * 100} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Plagiarized Content</span>
                  <span className="font-mono">{(overallScore * 100).toFixed(2)}%</span>
                </div>
                <Progress value={overallScore * 100} className="h-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Similarity Metrics */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Similarity Metrics</h2>
          <div className="bg-muted/30 rounded-xl p-6">
            <SimilarityMetricsChart data={data} />
          </div>
        </div>

        {/* Matching Sources */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Matching Sources</h2>
          <div className="grid gap-4">
            {sources.map((source: any) => (
              <SourceCard key={source.reference_id} source={source} />
            ))}
          </div>
        </div>

        {/* Document Preview */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Document Preview with Highlights</h2>
          <div className="bg-muted/30 rounded-xl p-6">
            <DocumentTextHighlight text={data?.sections?.title} />
          </div>
        </div>
      </div>
    </div>
  )
} 