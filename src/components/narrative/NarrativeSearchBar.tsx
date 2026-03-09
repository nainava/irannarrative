import { useRef, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import type { NarrativeEntry } from "@/data/narrativeData";

interface NarrativeSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onJumpToEntry?: (entryId: string, sectionId: string) => void;
  matchedEntries?: { entry: NarrativeEntry; sectionId: string }[];
  placeholder?: string;
}

export function NarrativeSearchBar({
  value,
  onChange,
  onJumpToEntry,
  matchedEntries = [],
  placeholder,
}: NarrativeSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        onChange("");
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onChange]);

  const showDropdown = isFocused && value.trim().length > 0 && matchedEntries.length > 0;

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          // Delay to allow click on dropdown items
          setTimeout(() => setIsFocused(false), 200);
        }}
        placeholder={placeholder || "Search"}
        className="w-full pl-9 pr-9 py-2.5 text-sm font-body bg-background border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 placeholder:text-muted-foreground/50"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Quick-jump dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-sm shadow-lg z-50 max-h-64 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-body border-b border-border">
            {matchedEntries.length} {matchedEntries.length === 1 ? "match" : "matches"} — click to jump
          </div>
          {matchedEntries.slice(0, 8).map(({ entry, sectionId }) => (
            <button
              key={`${sectionId}-${entry.id}`}
              className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors flex items-baseline gap-2"
              onClick={() => {
                onJumpToEntry?.(entry.id, sectionId);
                inputRef.current?.blur();
              }}
            >
              <span className="text-sm font-body font-semibold text-foreground truncate">
                {entry.name}
              </span>
              <span className="text-xs text-muted-foreground truncate flex-shrink-0">
                {entry.title}
              </span>
            </button>
          ))}
          {matchedEntries.length > 8 && (
            <div className="px-3 py-1.5 text-xs text-muted-foreground/50 font-body border-t border-border">
              +{matchedEntries.length - 8} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}
