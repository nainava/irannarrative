import { motion } from "framer-motion";
import type { NarrativeSection } from "@/data/narrativeData";
import { PersonEntry } from "./PersonEntry";

interface SectionGroupProps {
  section: NarrativeSection;
  searchQuery: string;
}

export function SectionGroup({ section, searchQuery }: SectionGroupProps) {
  return (
    <motion.section
      id={`section-${section.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mb-12"
    >
      <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-1 tracking-tight">
        {section.title}
      </h2>
      <div className="h-[2px] bg-foreground/15 mb-4" />

      <div className="divide-y divide-border">
        {section.entries.map((entry, i) => (
          <PersonEntry
            key={entry.id}
            entry={entry}
            sectionId={section.id}
            searchQuery={searchQuery}
            index={i}
          />
        ))}
      </div>
    </motion.section>
  );
}
