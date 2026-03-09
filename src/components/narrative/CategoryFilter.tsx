import { cn } from "@/lib/utils";

export interface CategoryGroup {
  id: string;
  label: string;
  entryIds: string[];
}

// Entry-level category mapping (entries can appear in multiple groups)
export const categoryGroups: CategoryGroup[] = [
  {
    id: "republicans",
    label: "Republicans in Congress",
    entryIds: ["lindsey-graham", "josh-hawley"],
  },
  {
    id: "democrats",
    label: "Democrats in Congress",
    entryIds: [
      "chuck-schumer",
      "chris-coons",
      "mark-kelly",
      "tim-kaine",
      "elissa-slotkin",
      "gary-peters",
      "peter-aguilar",
      "ruben-gallego",
    ],
  },
  {
    id: "2028",
    label: "2028 Hopefuls",
    entryIds: ["gavin-newsom", "ruben-gallego", "mark-kelly", "josh-hawley"],
  },
  {
    id: "international",
    label: "International",
    entryIds: ["mark-carney", "keir-starmer"],
  },
];

interface CategoryFilterProps {
  active: string | null;
  onChange: (id: string | null) => void;
  counts: Record<string, number>;
}

export function CategoryFilter({ active, onChange, counts }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(null)}
        className={cn(
          "px-3.5 py-1.5 text-xs font-body font-semibold rounded-sm border transition-all",
          active === null
            ? "bg-foreground text-background border-foreground"
            : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
        )}
      >
        All
        <span className="ml-1.5 opacity-50">{counts["all"] || 0}</span>
      </button>
      {categoryGroups.map((group) => {
        const count = counts[group.id] || 0;
        if (count === 0) return null;
        return (
          <button
            key={group.id}
            onClick={() => onChange(active === group.id ? null : group.id)}
            className={cn(
              "px-3.5 py-1.5 text-xs font-body font-semibold rounded-sm border transition-all",
              active === group.id
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
            )}
          >
            {group.label}
            <span className="ml-1.5 opacity-50">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
