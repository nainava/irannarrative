import { motion } from "framer-motion";
import type { NarrativeEntry } from "@/data/narrativeData";
import { QuoteBlock } from "./QuoteBlock";
import { HighlightText } from "./HighlightText";

interface PersonEntryProps {
  entry: NarrativeEntry;
  sectionId: string;
  searchQuery: string;
  index: number;
}

export function PersonEntry({ entry, sectionId, searchQuery, index }: PersonEntryProps) {
  return (
    <motion.article
      id={`entry-${entry.id}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
      className="py-6 scroll-mt-32"
    >
      {/* Name + title */}
      <div className="mb-2">
        <h3 className="font-display text-lg font-bold text-foreground leading-tight">
          <HighlightText text={entry.name} query={searchQuery} />
        </h3>
        <p className="text-sm text-muted-foreground font-body">
          {entry.title}
          {entry.subtitle && (
            <span className="text-muted-foreground/60"> · {entry.subtitle}</span>
          )}
        </p>
      </div>

      {/* Quotes */}
      <div className="space-y-1">
        {entry.quotes.map((quote, qi) => (
          <QuoteBlock key={qi} quote={quote} searchQuery={searchQuery} />
        ))}
      </div>

      {/* Shift summary */}
      {entry.shiftSummary && (
        <div
          className="mt-3 px-3 py-2 rounded-sm text-sm font-body leading-relaxed"
          style={{ backgroundColor: "hsl(var(--phase-shift-bg))" }}
        >
          <span className="font-semibold text-foreground/80">Shift: </span>
          <span className="text-foreground/70">
            <HighlightText text={entry.shiftSummary} query={searchQuery} />
          </span>
        </div>
      )}
    </motion.article>
  );
}
