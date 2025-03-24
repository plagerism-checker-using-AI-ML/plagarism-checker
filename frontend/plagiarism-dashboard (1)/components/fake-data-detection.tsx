"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, FileText, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AnalysisLoading } from "@/components/analysis-loading"
import { FakeDataResults } from "@/components/fake-data-results"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion } from "framer-motion"

export function FakeDataDetection() {
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [pdfUrl, setPdfUrl] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fakeDataResults, setFakeDataResults] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (selectedFile) {
      await uploadFile(selectedFile)
    } else if (pdfUrl) {
      // Simulate API call for URL
      setTimeout(() => {
        setIsLoading(false)
        setShowResults(true)
      }, 3000)
    } else {
      setError("Please upload a file or enter a PDF URL")
      setIsLoading(false)
    }
  }

  const uploadFile = async (file: File) => {
    try {
      // First, save the file to public directory
      const formData = new FormData()
      formData.append("file", file)
      
      // Save to public directory
      const saveResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!saveResponse.ok) {
        throw new Error(`Failed to save file: ${saveResponse.status}`)
      }

      const { filePath } = await saveResponse.json()
      console.log("File saved to:", filePath)

      // Create detailed simulated results
      setFakeDataResults({
        document_title: file.name,
        file_path: filePath,
        analysis_date: new Date().toISOString(),
        submission_id: `FD-${Date.now().toString().substring(5)}`,
        overall_score: 0.76, // Higher scores indicate higher likelihood of fake data
        total_pages: 12,
        analyzed_sections: 8,
        high_risk_sections: 3,
        ai_detection_probability: 0.82,
        data_fabrication_indicators: [
          {
            type: "Statistical Anomalies",
            score: 0.87,
            description: "Unusual distribution patterns in reported data values",
            affected_sections: ["Results", "Data Tables", "Appendix B"],
            evidence: "Z-score distribution outside expected parameters (p < 0.001)",
            confidence: "High"
          },
          {
            type: "Identical Data Patterns",
            score: 0.65,
            description: "Repeated digit patterns indicating potential data fabrication",
            affected_sections: ["Table 4", "Figure 7"],
            evidence: "Terminal digit analysis reveals non-random distribution",
            confidence: "Medium"
          },
          {
            type: "Inconsistent Methodology",
            score: 0.71,
            description: "Reported methods cannot produce the claimed results",
            affected_sections: ["Methodology", "Results"],
            evidence: "Statistical power insufficient for claimed significance levels",
            confidence: "High"
          },
          {
            type: "AI Text Generation Markers",
            score: 0.89,
            description: "Text exhibits characteristics of AI-generated content",
            affected_sections: ["Discussion", "Conclusion"],
            evidence: "Stylistic consistency analysis indicates non-human authorship",
            confidence: "Very High"
          }
        ],
        visualized_data: {
          risk_scores: [0.87, 0.65, 0.71, 0.89],
          section_analysis: [0.3, 0.4, 0.9, 0.8, 0.7, 0.9, 0.4, 0.3],
          confidence_metrics: [0.85, 0.62, 0.78, 0.91]
        }
      })

      // Show results after short delay to simulate processing
      setTimeout(() => {
        setIsLoading(false)
        setShowResults(true)
      }, 2000)
    } catch (err) {
      console.error("Error uploading file:", err)
      setError(`Error: ${err instanceof Error ? err.message : "Failed to upload file"}`)
      setIsLoading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      setSelectedFile(file)
      console.log("File dropped:", file)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      console.log("File selected:", file)
    }
  }

  const handleFileButtonClick = () => {
    fileInputRef.current?.click()
  }

  if (isLoading) {
    return <AnalysisLoading />
  }

  if (showResults) {
    return <FakeDataResults data={fakeDataResults} />
  }

  return (
    <div className="space-y-6 max-w-full">
      <Card className="border-none shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Fake Data Detection</CardTitle>
              <CardDescription className="text-base mt-1">
                Upload a PDF or provide a URL to analyze for potentially fabricated data
              </CardDescription>
            </div>
            <Badge variant="outline" className="px-3 py-1 text-xs bg-primary/5">
              Submit a PDF or URL
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="upload" className="text-sm">
                Upload PDF
              </TabsTrigger>
              <TabsTrigger value="url" className="text-sm">
                PDF URL
              </TabsTrigger>
            </TabsList>
            <form onSubmit={handleSubmit}>
              <TabsContent value="upload" className="space-y-4">
                <motion.div
                  className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 text-center transition-colors ${dragActive ? "border-primary bg-primary/5" : "border-border"}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="rounded-full bg-primary/10 p-4 mb-4">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-medium text-lg">Drag and drop your PDF here</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md">
                    Supported formats: PDF, DOCX, TXT (max 10MB)
                  </p>
                  <Button 
                    type="button" 
                    size="lg" 
                    className="relative overflow-hidden group"
                    onClick={handleFileButtonClick}
                  >
                    <span className="relative z-10 flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      Browse Files
                    </span>
                    <span className="absolute inset-0 bg-primary/10 transform translate-y-full group-hover:translate-y-0 transition-transform duration-200"></span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileInputChange}
                      className="hidden"
                      accept=".pdf,.docx,.txt"
                    />
                  </Button>
                  {selectedFile && (
                    <div className="mt-4 text-sm">
                      <p className="font-medium">Selected file: {selectedFile.name}</p>
                      <p className="text-muted-foreground">Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  )}
                </motion.div>
              </TabsContent>
              <TabsContent value="url" className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="pdf-url-fake">PDF URL</Label>
                  <div className="flex w-full items-center space-x-2">
                    <Input
                      id="pdf-url-fake"
                      placeholder="https://example.com/document.pdf"
                      value={pdfUrl}
                      onChange={(e) => setPdfUrl(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Enter a direct link to a PDF document</p>
                  {error && <p className="text-sm text-destructive mt-1">{error}</p>}
                </div>
              </TabsContent>

              <div className="space-y-4 mt-8">
                <div className="flex items-center">
                  <h3 className="font-medium text-lg">AI Detection Options</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                          <Info className="h-4 w-4 text-muted-foreground" />
                          <span className="sr-only">Info</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Our AI detection analyzes writing patterns, statistical anomalies, and linguistic features to
                          identify AI-generated content
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <Card className="border border-border/50">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm">Our advanced AI detection system will analyze your document for:</p>
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        <li>Statistical patterns typical of AI-generated text</li>
                        <li>Linguistic inconsistencies and anomalies</li>
                        <li>Stylistic uniformity across the document</li>
                        <li>Unusual distribution of words and phrases</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8">
                <Button type="submit" size="lg" className="w-full">
                  Detect Fake Data
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  By submitting, you agree to our{" "}
                  <a href="#" className="underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="underline">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

