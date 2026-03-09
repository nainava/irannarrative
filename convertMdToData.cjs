/**
 * convertMdToData.cjs
 * Reads content/*.md files and produces src/data/narrativeData.ts
 *
 * Simplified markdown format:
 *   SECTION TITLE (all-caps line, no pipe)  → new section
 *   Name | Title                            → new person entry
 *   Name | Title | Subtitle                 → new person entry with subtitle
 *   * Date, context: "quote text"           → quote
 *     * [url](url)                          → source for previous quote
 *   * Shift: summary                        → shift summary
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, 'content');
const OUTPUT_FILE = path.join(__dirname, 'src', 'data', 'narrativeData.ts');

// ── helpers ────────────────────────────────────────────────────────────

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractUrls(line) {
  const urls = [];
  const mdLink = /\[([^\]]*)\]\(([^)]+)\)/g;
  let m;
  while ((m = mdLink.exec(line)) !== null) {
    let url = m[2].replace(/\?utm_source=chatgpt\.com/g, '');
    urls.push(url);
  }
  if (urls.length === 0) {
    const bareUrl = /https?:\/\/[^\s*)\]>]+/g;
    while ((m = bareUrl.exec(line)) !== null) {
      let url = m[0].replace(/\?utm_source=chatgpt\.com/g, '');
      urls.push(url);
    }
  }
  return urls;
}

function cleanText(s) {
  if (!s) return '';
  return s
    .replace(/\\/g, '')
    .replace(/\*{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

// ── main parser ────────────────────────────────────────────────────────

function parseMdFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n');

  const sections = [];
  let currentSection = null;
  let currentEntry = null;

  function flushEntry() {
    if (currentEntry && currentSection) {
      if (currentEntry.quotes.length > 0 || currentEntry.shiftSummary) {
        currentSection.entries.push(currentEntry);
      }
      currentEntry = null;
    }
  }

  function ensureSection(title) {
    flushEntry();
    const cleanTitle = title.replace(/\\/g, '').trim();
    const id = slugify(cleanTitle);
    let existing = sections.find(s => s.id === id);
    if (existing) {
      currentSection = existing;
      return;
    }
    currentSection = { id, title: cleanTitle, entries: [] };
    sections.push(currentSection);
  }

  // Default section
  currentSection = { id: 'overview', title: 'Overview', entries: [] };
  sections.push(currentSection);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) continue;

    // Skip the title line
    if (trimmed.startsWith('Iran Narrative')) continue;

    // ── Section headers: ALL CAPS lines without pipes ──
    const upperCount = (trimmed.match(/[A-Z]/g) || []).length;
    const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
    const isUpperCase = letterCount > 3 && (upperCount / letterCount) > 0.6;

    if (isUpperCase && !trimmed.includes('|') && !trimmed.startsWith('*') && !trimmed.startsWith('-')) {
      ensureSection(trimmed);
      continue;
    }

    // ── Person entry: "Name | Title" ──
    if (trimmed.includes('|') && !trimmed.startsWith('*') && !trimmed.startsWith('-')) {
      flushEntry();
      const parts = trimmed.split('|').map(p => p.replace(/\\/g, '').replace(/\*{1,3}/g, '').trim());
      const name = parts[0];
      const title = parts[1] || '';
      const subtitle = parts.slice(2).join(' | ') || undefined;

      // Auto-detect: if a Democrat ends up in international section, move them
      const fullLine = parts.join(' ');
      if (currentSection && currentSection.id === 'international-eu') {
        if (/\(D[\s-]/.test(fullLine)) {
          const demSection = sections.find(s => s.id === 'democrats-in-congress');
          if (demSection) currentSection = demSection;
        } else if (/\(R[\s-]/.test(fullLine)) {
          const repSection = sections.find(s => s.id === 'overview');
          if (repSection) currentSection = repSection;
        }
      }

      currentEntry = {
        id: slugify(name),
        name,
        title,
        subtitle,
        category: currentSection ? currentSection.id : 'overview',
        quotes: [],
        shiftSummary: '',
      };
      continue;
    }

    // ── Person entry without pipe: "Name (D - STATE)" or "Chris Coons (D \- DE)" ──
    const noPipePersonMatch = trimmed.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*\(([^)]+)\)\s*$/);
    if (noPipePersonMatch && !trimmed.startsWith('*') && !trimmed.startsWith('-')) {
      flushEntry();
      const name = noPipePersonMatch[1].trim();
      const title = noPipePersonMatch[2].replace(/\\/g, '').replace(/\s+/g, ' ').trim();

      currentEntry = {
        id: slugify(name),
        name,
        title,
        subtitle: undefined,
        category: currentSection ? currentSection.id : 'overview',
        quotes: [],
        shiftSummary: '',
      };
      continue;
    }

    // ── Shift line ──
    const shiftMatch = trimmed.match(/^\*\s*Shift:\s*(.+)$/i) ||
                       trimmed.match(/^\*\s*Claims:\s*(.+)$/i);
    if (shiftMatch && currentEntry) {
      currentEntry.shiftSummary = cleanText(shiftMatch[1]);
      continue;
    }

    // ── Source URL line (indented bullet with link) ──
    if (/^\s+\*\s/.test(line) && trimmed.startsWith('*')) {
      const urls = extractUrls(trimmed);
      if (urls.length > 0 && currentEntry && currentEntry.quotes.length > 0) {
        const lastQuote = currentEntry.quotes[currentEntry.quotes.length - 1];
        if (!lastQuote.sourceUrl) {
          lastQuote.sourceUrl = urls[0];
        } else if (lastQuote.sourceUrl !== urls[0]) {
          lastQuote.context = (lastQuote.context ? lastQuote.context + ' | ' : '') + urls[0];
        }
        for (const url of urls.slice(1)) {
          lastQuote.context = (lastQuote.context ? lastQuote.context + ' | ' : '') + url;
        }
      }
      continue;
    }

    // ── Quote line: "* Date, context: quote text" ──
    if (trimmed.startsWith('*') && currentEntry) {
      const quoteText = trimmed.replace(/^\*\s*/, '').trim();

      // Extract date from beginning
      const dateMatch = quoteText.match(/^((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*\d*(?:–\d+)?\s*(?:,\s*[^:]+)?)\s*:\s*(.+)$/i) ||
                        quoteText.match(/^(Before\s+[^:]+)\s*:\s*(.+)$/i) ||
                        quoteText.match(/^(WELKER|SEN\.\s*[^:]+)\s*:\s*(.+)$/i);

      let date = '';
      let text = '';

      if (dateMatch) {
        date = dateMatch[1].trim();
        text = cleanText(dateMatch[2]);
      } else {
        text = cleanText(quoteText);
      }

      // Remove URLs from display text
      text = text.replace(/https?:\/\/[^\s*)\]]+/g, '').replace(/→\s*/g, '').trim();

      // Extract URLs
      const urls = extractUrls(trimmed);

      if (text) {
        currentEntry.quotes.push({
          phase: 'note',
          date,
          text,
          sourceUrl: urls[0] || '',
          context: urls.length > 1 ? urls.slice(1).join(' | ') : undefined,
        });
      }
      continue;
    }

    // ── Continuation lines ──
    if (currentEntry && currentEntry.quotes.length > 0 && trimmed.length > 10) {
      const lastQuote = currentEntry.quotes[currentEntry.quotes.length - 1];
      const urls = extractUrls(trimmed);
      const addText = cleanText(trimmed).replace(/https?:\/\/[^\s*)\]]+/g, '').replace(/→\s*/g, '').trim();
      if (addText) {
        lastQuote.text = lastQuote.text + ' ' + addText;
      }
      if (urls.length > 0 && !lastQuote.sourceUrl) {
        lastQuote.sourceUrl = urls[0];
      }
    }
  }

  flushEntry();
  return sections.filter(s => s.entries.length > 0);
}

// ── generate output ────────────────────────────────────────────────────

function main() {
  const mdFiles = fs.readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.md'))
    .sort();

  if (mdFiles.length === 0) {
    console.error('No .md files found in content/');
    process.exit(1);
  }

  let allSections = [];

  for (const file of mdFiles) {
    console.log(`Parsing ${file}...`);
    const sections = parseMdFile(path.join(CONTENT_DIR, file));
    for (const sec of sections) {
      const existing = allSections.find(s => s.id === sec.id);
      if (existing) {
        existing.entries.push(...sec.entries);
      } else {
        allSections.push(sec);
      }
    }
  }

  // Deduplicate entries
  for (const sec of allSections) {
    const seen = new Map();
    const deduped = [];
    for (const entry of sec.entries) {
      if (seen.has(entry.id)) {
        const existing = seen.get(entry.id);
        existing.quotes.push(...entry.quotes);
        if (entry.shiftSummary && !existing.shiftSummary) {
          existing.shiftSummary = entry.shiftSummary;
        }
      } else {
        seen.set(entry.id, entry);
        deduped.push(entry);
      }
    }
    sec.entries = deduped;
  }

  const output = `// Auto-generated by convertMdToData.cjs — do not edit manually
// Run: npm run convert

export interface Quote {
  phase: "before" | "mid" | "after" | "walkback" | "undercut" | "note";
  date: string;
  text: string;
  sourceUrl: string;
  context?: string;
}

export interface NarrativeEntry {
  id: string;
  name: string;
  title: string;
  subtitle?: string;
  category: string;
  quotes: Quote[];
  shiftSummary: string;
}

export interface NarrativeSection {
  id: string;
  title: string;
  entries: NarrativeEntry[];
}

export const narrativeSections: NarrativeSection[] = ${JSON.stringify(allSections, null, 2)};

export const allCategories: string[] = ${JSON.stringify([...new Set(allSections.map(s => s.id))])};
`;

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');

  const totalEntries = allSections.reduce((sum, s) => sum + s.entries.length, 0);
  const totalQuotes = allSections.reduce((sum, s) =>
    sum + s.entries.reduce((es, e) => es + e.quotes.length, 0), 0);

  console.log(`\nGenerated ${OUTPUT_FILE}`);
  console.log(`  ${allSections.length} sections, ${totalEntries} entries, ${totalQuotes} quotes`);
}

main();
