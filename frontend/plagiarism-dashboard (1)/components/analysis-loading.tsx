"use client"

import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

export function AnalysisLoading() {
  const steps = [
    { id: 1, name: "Extracting text from document", status: "complete" },
    { id: 2, name: "Analyzing document structure", status: "complete" },
    { id: 3, name: "Comparing with online sources", status: "current" },
    { id: 4, name: "Generating similarity scores", status: "upcoming" },
    { id: 5, name: "Creating final report", status: "upcoming" },
  ]

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-2xl">
            <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
            Analyzing Document
          </CardTitle>
          <CardDescription className="text-base">
            Please wait while we analyze your document for plagiarism and fake data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Processing Document</h3>
              <span className="text-sm text-primary font-medium">25%</span>
            </div>
            <div className="h-2 w-full bg-secondary overflow-hidden rounded-full">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "25%" }}
                transition={{ duration: 1, ease: "easeInOut" }}
              />
            </div>
          </div>

          <div className="grid gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Current Steps</h3>
              <div className="space-y-4">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center ${
                        step.status === "complete"
                          ? "bg-green-500"
                          : step.status === "current"
                            ? "bg-blue-500 animate-pulse"
                            : "bg-secondary"
                      }`}
                    >
                      {step.status === "complete" && (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={`text-sm ${step.status === "upcoming" ? "text-muted-foreground" : "font-medium"}`}
                      >
                        {step.name}
                      </span>
                      {step.status === "current" && (
                        <span className="text-xs text-muted-foreground">In progress...</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <h3 className="text-lg font-medium">Preview</h3>
            <div className="grid gap-4">
              <div className="relative overflow-hidden rounded-xl">
                <Skeleton className="h-[125px] w-full rounded-xl" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/10 to-transparent animate-[shimmer_2s_infinite]"></div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[90%]" />
                <Skeleton className="h-4 w-[80%]" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

