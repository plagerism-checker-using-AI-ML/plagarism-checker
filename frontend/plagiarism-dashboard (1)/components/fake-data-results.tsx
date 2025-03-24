"use client"

import { Download, BarChart2, AlertTriangle, FileText, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface FakeDataResultsProps {
  data: any;
}

export function FakeDataResults({ data }: FakeDataResultsProps) {
  // Use data or fallback to mock data if not available
  const results = data || {
    overall_score: 0.76,
    ai_detection_probability: 0.82,
    data_fabrication_indicators: [
      {
        type: "Statistical Anomalies",
        score: 0.87,
        confidence: "High"
      },
      {
        type: "Identical Data Patterns",
        score: 0.65,
        confidence: "Medium"
      }
    ]
  };

  const aiProbability = results.ai_detection_probability;
  const humanProbability = 1 - aiProbability;
  
  const formattedDate = data?.analysis_date 
    ? new Date(data.analysis_date).toLocaleDateString() 
    : new Date().toLocaleDateString();
  
  const formattedTime = data?.analysis_date 
    ? new Date(data.analysis_date).toLocaleTimeString() 
    : new Date().toLocaleTimeString();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Fake Data Detection Results</h2>
          {data?.document_title && (
            <p className="text-muted-foreground">Document: {data.document_title}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
          <Button variant="outline" size="sm">
            <BarChart2 className="mr-2 h-4 w-4" />
            Detailed Analytics
          </Button>
        </div>
      </div>

      {/* Overall Risk Score Card */}
      <Card>
        <CardHeader>
          <CardTitle>Fabricated Data Detection</CardTitle>
          <CardDescription>
            Analysis completed on {formattedDate} at {formattedTime}
            {data?.submission_id && <span> • ID: {data.submission_id}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Detection Results</h3>
              <div className="p-6 border rounded-lg flex flex-col items-center justify-center text-center space-y-4">
                <Badge 
                  className="text-lg px-4 py-2" 
                  variant={results.overall_score > 0.7 ? "destructive" : 
                           results.overall_score > 0.4 ? "secondary" : "default"}
                >
                  {results.overall_score > 0.7 ? "High Risk of Fake Data" : 
                   results.overall_score > 0.4 ? "Medium Risk of Fake Data" : "Low Risk of Fake Data"}
                </Badge>
                <div className="text-4xl font-bold">{(results.overall_score * 100).toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground">
                  Risk score - higher values indicate higher likelihood of fabricated data
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">AI Content Detection</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">AI-Generated Probability</span>
                    <span className="text-sm">{(aiProbability * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={aiProbability * 100} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Human-Written Probability</span>
                    <span className="text-sm">{(humanProbability * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={humanProbability * 100} className="h-2" />
                </div>
              </div>

              {data?.total_pages && (
                <div className="pt-2">
                  <div className="flex justify-between text-sm">
                    <span>Pages analyzed: {data.total_pages}</span>
                    <span>High-risk sections: {data.high_risk_sections}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detected Indicators */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Detected Indicators</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.data_fabrication_indicators.map((indicator: any, index: number) => (
                <Card key={index} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                          {indicator.type}
                        </h4>
                        {indicator.description && (
                          <p className="text-sm text-muted-foreground mt-1">{indicator.description}</p>
                        )}
                      </div>
                      <Badge variant={
                        indicator.confidence === "Very High" ? "destructive" :
                        indicator.confidence === "High" ? "destructive" :
                        indicator.confidence === "Medium" ? "secondary" : "default"
                      }>
                        {indicator.confidence}
                      </Badge>
                    </div>
                    {indicator.evidence && (
                      <div className="mt-3 pt-2 border-t">
                        <p className="text-xs font-medium">Evidence:</p>
                        <p className="text-xs">{indicator.evidence}</p>
                      </div>
                    )}
                    {indicator.affected_sections && (
                      <div className="mt-2">
                        <p className="text-xs">Affected sections:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {indicator.affected_sections.map((section: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {section}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Recommendations</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-medium flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  Further Investigation
                </h4>
                <ul className="text-sm space-y-1 list-disc pl-4">
                  <li>Verify statistical methods and calculations</li>
                  <li>Check for data collection methodology inconsistencies</li>
                  <li>Compare results with similar studies in the field</li>
                  <li>Examine raw data files if available</li>
                  <li>Review documentation for experimental procedures</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-medium flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-blue-500" />
                  Academic Considerations
                </h4>
                <ul className="text-sm space-y-1 list-disc pl-4">
                  <li>Consider the source and reputation of the authors</li>
                  <li>Check author institutional affiliations</li>
                  <li>Review previous publications for similar patterns</li>
                  <li>Examine funding sources and potential conflicts</li>
                  <li>Consider requesting access to raw data</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

