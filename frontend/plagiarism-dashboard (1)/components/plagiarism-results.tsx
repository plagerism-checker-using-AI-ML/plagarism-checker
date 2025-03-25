"use client"

import { useState } from "react"
import { ArrowRight, Download, BarChart2, ArrowLeft, Share2, Printer } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { SourceCard } from "@/components/source-card"
import { OverallScoreChart } from "@/components/overall-score-chart"
import { SimilarityMetricsChart } from "@/components/similarity-metrics-chart"
import { motion } from "framer-motion"
import { Separator } from "@/components/ui/separator"
import { DocumentTextHighlight } from "@/components/document-text-highlight"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface PlagiarismResultsProps {
  data: any
}

export function PlagiarismResults({ data }: PlagiarismResultsProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")

  // Extract data from the API response
  const overallScore = data?.plagiarism_overall_score || 0
  const wordCount = data?.total_word_count || 0
  const sources = data?.plagiarism_results || []
  const isAiGenerated = data?.ai_detection_results?.overall_is_ai_generated || false
  const aiProbability = data?.ai_detection_results?.overall_ai_probability || 0

  // Function to handle full report navigation
  const handleFullReport = () => {
    // Store data in localStorage
    localStorage.setItem('reportData', JSON.stringify(data))
    router.push('/report')
  }

  // Function to handle printing
  const handlePrint = () => {
    // Store data in localStorage
    localStorage.setItem('reportData', JSON.stringify(data))
    
    // Open report in new window and wait for it to load
    const reportUrl = `${window.location.origin}/report`
    const printWindow = window.open(reportUrl)
    
    // Wait for the window to load and check for data
    if (printWindow) {
      const checkData = setInterval(() => {
        const reportData = printWindow.localStorage.getItem('reportData')
        if (reportData) {
          clearInterval(checkData)
          printWindow.print()
        }
      }, 100)
    }
  }

  // Function to handle PDF download
  const handleDownload = async () => {
    try {
      // Store data in localStorage
      localStorage.setItem('reportData', JSON.stringify(data))
      
      // Open report in new window
      const reportUrl = `${window.location.origin}/report`
      const reportWindow = window.open(reportUrl)
      
      // Wait for the window to load and check for data
      if (reportWindow) {
        await new Promise<void>((resolve) => {
          const checkData = setInterval(() => {
            const reportData = reportWindow.localStorage.getItem('reportData')
            if (reportData) {
              clearInterval(checkData)
              resolve()
            }
          }, 100)
        })

        // Add a small delay to ensure components are rendered
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Create PDF
        const pdf = new jsPDF('p', 'mm', 'a4')
        const canvas = await html2canvas(reportWindow.document.body)
        const imgData = canvas.toDataURL('image/png')
        
        // Add image to PDF
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
        
        // Download PDF
        pdf.save('plagiarism-report.pdf')
        
        // Close the window
        reportWindow.close()
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    }
  }

  // Function to handle sharing
  const handleShare = async () => {
    // Store data in localStorage
    localStorage.setItem('reportData', JSON.stringify(data))
    const reportUrl = `${window.location.origin}/report`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Plagiarism Analysis Report',
          text: 'Check out this plagiarism analysis report',
          url: reportUrl
        })
      } catch (error) {
        console.error('Error sharing:', error)
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(reportUrl)
        alert('Report URL copied to clipboard!')
      }
    } else {
      // Fallback to copying to clipboard
      await navigator.clipboard.writeText(reportUrl)
      alert('Report URL copied to clipboard!')
    }
  }

  return (
    <motion.div
      className="space-y-6 w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h2 className="text-2xl font-bold">Analysis Results</h2>
          <Badge 
            variant={overallScore > 0.5 ? "destructive" : overallScore > 0.3 ? "secondary" : "default"} 
            className={cn(
              "ml-2",
              overallScore <= 0.3 && "bg-green-600 hover:bg-green-700 text-white border-transparent"
            )}
          >
            {overallScore > 0.5 ? "High Plagiarism" : overallScore > 0.3 ? "Medium Plagiarism" : "Low Plagiarism"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
      
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button size="sm" onClick={handleFullReport}>
            <BarChart2 className="mr-2 h-4 w-4" />
            Full Report
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="pb-2 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <CardTitle className="text-xl">Document Analysis Summary</CardTitle>
              <CardDescription className="text-sm">
                Analysis completed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </CardDescription>
            </div>
            <Badge variant="outline" className="w-fit">
              Document ID: DOC-{Math.floor(Math.random() * 1000000)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6 pt-4 border-b">
              <TabsList className="h-10 w-full grid grid-cols-3 p-1 max-w-full overflow-x-auto">
                <TabsTrigger value="overview" className="text-sm">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="sources" className="text-sm">
                  Matching Sources
                </TabsTrigger>
                <TabsTrigger value="metrics" className="text-sm">
                  Similarity Metrics
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="overview" className="space-y-6 mt-0">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex flex-col space-y-4">
                    <h3 className="text-lg font-medium">Overall Plagiarism Score</h3>
                    <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-xl p-6">
                      <OverallScoreChart score={overallScore} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Document Statistics</h3>
                    <div className="bg-muted/30 rounded-xl p-6 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Total Word Count</span>
                          <span className="text-sm font-mono">{wordCount.toLocaleString()}</span>
                        </div>
                        <Progress value={100} className="h-2" />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">AI-Generated Content</span>
                          <span className="text-sm font-mono">{(aiProbability * 100).toFixed(2)}%</span>
                        </div>
                        <Progress value={aiProbability * 100} className="h-2" />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Plagiarized Content</span>
                          <span className="text-sm font-mono">{(overallScore * 100).toFixed(2)}%</span>
                        </div>
                        <Progress value={overallScore * 100} className="h-2" />
                      </div>

                      <Separator className="my-2" />

                      <div className="pt-2">
                        <h4 className="text-sm font-medium mb-3">Analysis Result</h4>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge 
                            variant={overallScore > 0.5 ? "destructive" : overallScore > 0.3 ? "secondary" : "default"}
                            className={cn(
                              "px-3 py-1",
                              overallScore <= 0.3 && "bg-green-600 hover:bg-green-700 text-white border-transparent"
                            )}
                          >
                            {overallScore > 0.5 ? "High Plagiarism Detected" : overallScore > 0.3 ? "Medium Plagiarism Detected" : "Low Plagiarism"}
                          </Badge>
                          <Badge variant="secondary" className="px-3 py-1">
                            {isAiGenerated ? "AI-Generated" : "Human-Written"}
                          </Badge>
                          <Badge variant="outline" className="px-3 py-1">
                            Academic Paper
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Top Matching Sources</h3>
                    <Button variant="link" onClick={() => setActiveTab("sources")} className="p-0 h-auto">
                      View All Sources
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-4">
                    {sources.slice(0, 3).map((source) => (
                      <SourceCard key={source.reference_id} source={source} />
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Document Preview with Highlights</h3>
                  <DocumentTextHighlight text={data?.sections?.title} />
                </div>
              </TabsContent>

              <TabsContent value="sources" className="space-y-6 mt-0 w-full">
                <div className="space-y-4 w-full">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">All Matching Sources</h3>
                    <div className="text-sm text-muted-foreground">Showing {sources.length} sources</div>
                  </div>
                  <div className="grid gap-4 w-full">
                    {sources.map((source) => (
                      <SourceCard key={source.reference_id} source={source} />
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="metrics" className="space-y-6 mt-0">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Similarity Metrics</h3>
                    <div className="bg-muted/30 rounded-xl p-6">
                      <SimilarityMetricsChart data={data} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Metric Explanations</h3>
                    <div className="bg-muted/30 rounded-xl p-6 space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Semantic Similarity</h4>
                        <p className="text-sm text-muted-foreground">
                          Measures how similar the meaning of the text is to other sources, even if different words are
                          used. High semantic similarity indicates potential paraphrasing.
                        </p>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">N-gram Similarity</h4>
                        <p className="text-sm text-muted-foreground">
                          Detects exact matches of word sequences between the document and other sources. High n-gram
                          similarity indicates direct copying of text.
                        </p>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Fuzzy Similarity</h4>
                        <p className="text-sm text-muted-foreground">
                          Identifies text that has been slightly modified from the original source, such as word
                          substitutions or minor edits to disguise plagiarism.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  )
}

