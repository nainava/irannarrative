import { ExternalLink } from "lucide-react";
import type { Quote } from "@/data/narrativeData";
import { HighlightText } from "./HighlightText";

interface QuoteBlockProps {
  quote: Quote;
  searchQuery: string;
}

export function QuoteBlock({ quote, searchQuery }: QuoteBlockProps) {
  return (
    <blockquote className="pl-4 py-2 my-3 border-l-[3px] border-border">
      {quote.date && (
        <p className="text-xs text-muted-foreground font-body mb-1">
          {quote.date}
        </p>
      )}

      <p className="text-sm leading-relaxed font-body text-foreground/90 whitespace-pre-line">
        <HighlightText text={quote.text} query={searchQuery} />
      </p>

      {quote.sourceUrl && (
        <a
          href={quote.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary/70 hover:text-primary mt-1.5 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Source
        </a>
      )}
    </blockquote>
  );
}
