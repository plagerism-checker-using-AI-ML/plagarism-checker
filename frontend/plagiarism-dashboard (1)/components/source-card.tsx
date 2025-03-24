"use client"

import { ExternalLink, FileText } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

interface SourceCardProps {
  source: {
    reference_id: number
    paper_info: {
      title: string
      author: string
      link: string
      source: string
    }
    overall_score: number
    semantic_similarity: number
    ngram_similarity: number
    fuzzy_similarity: number
    is_plagiarized: boolean
  }
}

export function SourceCard({ source }: SourceCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="overflow-hidden border-border/50 hover:border-border transition-colors duration-200">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-primary/10 p-2 mt-0.5">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base">
                <Button variant="link" className="p-0 h-auto text-base font-semibold justify-start" asChild>
                  <a href={source.paper_info.link} target="_blank" rel="noopener noreferrer">
                    {source.paper_info.title}
                  </a>
                </Button>
              </CardTitle>
              <CardDescription className="flex items-center flex-wrap gap-2">
                <span>Source #{source.reference_id}</span>
                <span>•</span>
                <span>Author: {source.paper_info.author}</span>
                <Badge variant={source.overall_score > 0.5 ? "destructive" : "outline"} className="ml-1">
                  {source.is_plagiarized ? "Plagiarism Detected" : "Moderate Match"}
                </Badge>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">Overall Match</span>
                <span className="text-xs font-mono">{(source.overall_score * 100).toFixed(2)}%</span>
              </div>
              <Progress
                value={source.overall_score * 100}
                className="h-2"
                indicatorClassName={source.overall_score > 0.5 ? "bg-destructive" : "bg-primary"}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">Semantic</span>
                <span className="text-xs font-mono">{(source.semantic_similarity * 100).toFixed(2)}%</span>
              </div>
              <Progress
                value={source.semantic_similarity * 100}
                className="h-2"
                indicatorClassName={source.semantic_similarity > 0.8 ? "bg-destructive" : "bg-primary"}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">N-gram</span>
                <span className="text-xs font-mono">{(source.ngram_similarity * 100).toFixed(4)}%</span>
              </div>
              <Progress value={source.ngram_similarity * 100} max={1} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">Fuzzy</span>
                <span className="text-xs font-mono">{(source.fuzzy_similarity * 100).toFixed(2)}%</span>
              </div>
              <Progress
                value={source.fuzzy_similarity * 100}
                className="h-2"
                indicatorClassName={source.fuzzy_similarity > 0.6 ? "bg-destructive" : "bg-primary"}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <Button variant="outline" size="sm" className="w-full group" asChild>
            <a href={source.paper_info.link} target="_blank" rel="noopener noreferrer">
              View Source
              <ExternalLink className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-1" />
            </a>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

