import { useState, useCallback, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { narrativeSections, type NarrativeEntry } from "@/data/narrativeData";
import { PersonEntry } from "@/components/narrative/PersonEntry";
import { CategoryFilter, categoryGroups } from "@/components/narrative/CategoryFilter";
import { NarrativeSearchBar } from "@/components/narrative/NarrativeSearchBar";

function matchesSearch(text: string, q: string) {
  return text.toLowerCase().includes(q);
}

// Interest-ranked order — scroll position implies ranking
const rankedOrder: string[] = [
  "gavin-newsom",
  "elissa-slotkin",
  "lindsey-graham",
  "mark-carney",
  "keir-starmer",
  "ruben-gallego",
  "tim-kaine",
  "chuck-schumer",
  "mark-kelly",
  "chris-coons",
  "gary-peters",
  "josh-hawley",
  "peter-aguilar",
];

export default function NarrativeTracker() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQueryState] = useState(
    searchParams.get("q") || ""
  );
  const [activeGroup, setActiveGroupState] = useState<string | null>(
    searchParams.get("cat") || null
  );

  const setSearchQuery = useCallback(
    (q: string) => {
      setSearchQueryState(q);
      const p = new URLSearchParams(searchParams);
      if (q.trim()) p.set("q", q);
      else p.delete("q");
      setSearchParams(p, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const setActiveGroup = useCallback(
    (group: string | null) => {
      setActiveGroupState(group);
      const p = new URLSearchParams(searchParams);
      if (group) p.set("cat", group);
      else p.delete("cat");
      setSearchParams(p, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    const q = searchParams.get("q") || "";
    const c = searchParams.get("cat") || null;
    if (q !== searchQuery) setSearchQueryState(q);
    if (c !== activeGroup) setActiveGroupState(c);
  }, [searchParams]);

  // Flatten all entries, deduplicate, sort by ranked order
  const allEntries = useMemo(() => {
    const seen = new Set<string>();
    const entries: NarrativeEntry[] = [];
    for (const section of narrativeSections) {
      for (const entry of section.entries) {
        if (!seen.has(entry.id)) {
          seen.add(entry.id);
          entries.push(entry);
        }
      }
    }
    entries.sort((a, b) => {
      const ai = rankedOrder.indexOf(a.id);
      const bi = rankedOrder.indexOf(b.id);
      return (ai === -1 ? rankedOrder.length : ai) - (bi === -1 ? rankedOrder.length : bi);
    });
    return entries;
  }, []);

  // Get entry IDs for active filter
  const activeEntryIds = useMemo(() => {
    if (!activeGroup) return null;
    const group = categoryGroups.find((g) => g.id === activeGroup);
    return group ? new Set(group.entryIds) : null;
  }, [activeGroup]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    let entries = allEntries;

    if (activeEntryIds) {
      entries = entries.filter((e) => activeEntryIds.has(e.id));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter(
        (entry) =>
          matchesSearch(entry.name, q) ||
          matchesSearch(entry.title, q) ||
          matchesSearch(entry.shiftSummary, q) ||
          (entry.subtitle && matchesSearch(entry.subtitle, q)) ||
          entry.quotes.some(
            (quote) =>
              matchesSearch(quote.text, q) || matchesSearch(quote.date, q)
          )
      );
    }

    return entries;
  }, [allEntries, activeEntryIds, searchQuery]);

  // Search dropdown matches
  const matchedEntries = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allEntries
      .filter(
        (entry) =>
          matchesSearch(entry.name, q) ||
          matchesSearch(entry.title, q) ||
          matchesSearch(entry.shiftSummary, q) ||
          (entry.subtitle && matchesSearch(entry.subtitle, q)) ||
          entry.quotes.some(
            (quote) => matchesSearch(quote.text, q) || matchesSearch(quote.date, q)
          )
      )
      .map((entry) => ({ entry, sectionId: "flat" }));
  }, [searchQuery, allEntries]);

  // Group counts for filter badges
  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const allIds = new Set(allEntries.map((e) => e.id));
    counts["all"] = allEntries.length;
    for (const group of categoryGroups) {
      counts[group.id] = group.entryIds.filter((id) => allIds.has(id)).length;
    }
    return counts;
  }, [allEntries]);

  // Compact header on scroll
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Jump to entry
  const handleJumpToEntry = useCallback(
    (entryId: string) => {
      if (activeGroup) {
        const group = categoryGroups.find((g) => g.id === activeGroup);
        if (group && !group.entryIds.includes(entryId)) {
          setActiveGroup(null);
        }
      }
      requestAnimationFrame(() => {
        const el = document.getElementById(`entry-${entryId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    },
    [activeGroup, setActiveGroup]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm transition-all duration-200">
        <div className="max-w-3xl mx-auto px-4">
          <div className={`transition-all duration-200 ${scrolled ? "py-2" : "py-4"}`}>
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${scrolled ? "flex items-center gap-3" : ""}`}
            >
              <h1
                className={`font-display font-bold text-foreground leading-tight cursor-pointer hover:text-primary transition-all duration-200 ${
                  scrolled
                    ? "text-base sm:text-lg whitespace-nowrap flex-shrink-0"
                    : "text-2xl sm:text-3xl text-center"
                }`}
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                Iran War Narrative Tracker
              </h1>
              {!scrolled && (
                <p className="text-center text-xs text-muted-foreground font-body mt-1">
                  Tracking rhetoric shifts from key political figures since February
                  28, 2026
                </p>
              )}
              <div className={`${scrolled ? "flex-1 min-w-0" : "mt-3"}`}>
                <NarrativeSearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onJumpToEntry={(entryId) => handleJumpToEntry(entryId)}
                  matchedEntries={matchedEntries}
                  placeholder={scrolled ? "Search…" : undefined}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8">

        {/* Group filters */}
        <div className="mb-8">
          <CategoryFilter
            active={activeGroup}
            onChange={setActiveGroup}
            counts={groupCounts}
          />
        </div>

        {/* Result count when filtering */}
        {(searchQuery || activeGroup) && (
          <p className="text-xs text-muted-foreground font-body mb-6">
            Showing {filteredEntries.length}{" "}
            {filteredEntries.length === 1 ? "entry" : "entries"}
            {activeGroup && (
              <>
                {" "}in{" "}
                <span className="font-semibold">
                  {categoryGroups.find((g) => g.id === activeGroup)?.label}
                </span>
              </>
            )}
            {searchQuery && (
              <>
                {" "}matching &ldquo;
                <span className="font-semibold">{searchQuery}</span>&rdquo;
              </>
            )}
          </p>
        )}

        {/* Flat ranked list */}
        {filteredEntries.length > 0 ? (
          <div className="divide-y divide-border">
            {filteredEntries.map((entry, i) => (
              <PersonEntry
                key={entry.id}
                entry={entry}
                sectionId="flat"
                searchQuery={searchQuery}
                index={i}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-body text-sm italic">
              No entries match your search.
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-border pt-6 pb-10 mt-12">
          <p className="text-sm text-muted-foreground font-body text-center">
            The Over Under is a{" "}
            <a
              href="http://tideloop.co/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/70 hover:text-primary transition-colors underline underline-offset-2"
            >
              Tide Loop
            </a>{" "}
            project. Reach out{" "}
            <a
              href="https://forms.gle/Ei3Qpp1RbZsy3tbc7"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/70 hover:text-primary transition-colors underline underline-offset-2"
            >
              here
            </a>{" "}
            to add more.
          </p>
          <p className="text-xs text-muted-foreground/50 font-body text-center mt-2">
            All quotes linked to original sources. Updated March 2026.
          </p>
        </footer>
      </main>
    </div>
  );
}
