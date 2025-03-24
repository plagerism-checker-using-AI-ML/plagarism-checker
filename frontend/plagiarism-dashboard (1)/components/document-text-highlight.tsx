import { Card } from "@/components/ui/card"

interface DocumentTextHighlightProps {
  text?: string
}

export function DocumentTextHighlight({ text }: DocumentTextHighlightProps) {
  if (!text) {
    return (
      <Card className="p-6 border border-border/50 max-h-[300px] overflow-auto">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-muted-foreground italic">No document text available for preview.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 border border-border/50 max-h-[300px] overflow-auto">
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <p>{text}</p>
      </div>
    </Card>
  )
}

