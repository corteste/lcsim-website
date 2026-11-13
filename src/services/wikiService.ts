import { load as loadYaml } from "js-yaml";
import { supabase } from "@/supabaseClient";

export const WIKI_BUCKET = "wiki";

export interface WikiPageEntry {
  slug: string;
  storagePath: string;
  category: string;
  categoryLabel: string;
  title: string;
  order: number;
}

export interface WikiScorerEntry {
  giocatore?: string | null;
  squadra?: string | null;
  reti?: number | null;
  assist?: number | null;
  gol?: number | null;
  minuto?: number | null;
}

export interface WikiSeasonFrontmatter {
  tipo?: string | null;
  titolo?: string | null;
  stagione?: number | null;
  anno?: number | null;
  precedente?: string | null;
  successiva?: string | null;
  date?: Record<string, string | null> | null;
  squadre_partecipanti?: number | null;
  partite_disputate?: number | null;
  reti_totali?: number | null;
  formato?: string | null;
  campione?: string | null;
  finalista?: string | null;
  terzo?: string | null;
  quarto?: string | null;
  quinto?: string | null;
  sesto?: string | null;
  supercoppa?: {
    data?: string | null;
    squadre?: string[] | null;
    vincitrice?: string | null;
    risultato?: string | null;
    rigori?: string | null;
    marcatori?: WikiScorerEntry[] | null;
  } | null;
  finale?: {
    data?: string | null;
    risultato?: string | null;
    mvp?: string | null;
    arbitro?: string | null;
    marcatori?: (string | WikiScorerEntry)[] | null;
  } | null;
  premi?: {
    mvp_stagione?: string | null;
    mvp_finale?: string | null;
    capocannoniere?: WikiScorerEntry | WikiScorerEntry[] | null;
    miglior_assistman?: WikiScorerEntry | WikiScorerEntry[] | null;
    miglior_portiere?: string | null;
    miglior_difensore?: string | null;
    miglior_centrocampista?: string | null;
    miglior_attaccante?: string | null;
    rookie_dell_anno?: string | null;
    most_improved_player?: string | null;
    all_star_game_mvp?: string | null;
  } | null;
  squadre?: Array<{
    nome?: string | null;
    codice?: string | null;
    presidente?: string | null;
    amministratore_delegato?: string | null;
    allenatore?: string | null;
    colori?: string | null;
    stadio?: string | null;
    nota?: string | null;
  }> | null;
  [key: string]: unknown;
}

export interface ParsedWikiDocument {
  frontmatter: WikiSeasonFrontmatter | null;
  body: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  stagioni: "Stagioni",
  squadre: "Squadre",
  giocatori: "Giocatori",
  regolamento: "Regolamento",
  competizioni: "Competizioni",
  generale: "Generale",
};

const CATEGORY_PRIORITY: Record<string, number> = {
  stagioni: 1,
  competizioni: 2,
  squadre: 3,
  giocatori: 4,
  regolamento: 5,
  generale: 99,
};

export function normalizeWikiKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\.md$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SLUG_TITLE_OVERRIDES: Record<string, string> = {
  "mar-s-attack": "Mar's Attack",
  "average-pegio-driver": "Average Pegiò Driver",
};

const UPPERCASE_WORDS = new Set(["ac", "fc", "as", "lcsim"]);

function formatTitleFromSlug(slug: string): string {
  const override = SLUG_TITLE_OVERRIDES[slug.toLowerCase()];
  if (override) return override;

  return slug
    .split("-")
    .filter(Boolean)
    .map((part) =>
      UPPERCASE_WORDS.has(part.toLowerCase())
        ? part.toUpperCase()
        : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join(" ");
}

function extractNumericOrder(slug: string): number {
  const match = slug.match(/(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function getCategoryLabel(category: string): string {
  return (
    CATEGORY_LABELS[category.toLowerCase()] ??
    formatTitleFromSlug(category)
  );
}

/**
 * Elenca tutte le pagine .md presenti nel bucket Supabase Storage `wiki`.
 * Supporta sia file nella root sia sottocartelle (es. `stagioni/`, `squadre/`, ecc.).
 */
export async function listWikiPages(): Promise<WikiPageEntry[]> {
  const { data: rootItems, error: rootError } = await supabase.storage
    .from(WIKI_BUCKET)
    .list("", { limit: 200, sortBy: { column: "name", order: "asc" } });

  if (rootError) {
    throw new Error(`Impossibile elencare la wiki: ${rootError.message}`);
  }

  const entries: WikiPageEntry[] = [];
  const folders: string[] = [];

  for (const item of rootItems ?? []) {
    if (!item?.name || item.name === ".emptyFolderPlaceholder") continue;
    // In Supabase Storage, le cartelle hanno id === null
    if (item.id === null) {
      folders.push(item.name);
    } else if (item.name.toLowerCase().endsWith(".md")) {
      const slug = item.name.replace(/\.md$/i, "");
      entries.push({
        slug,
        storagePath: item.name,
        category: "generale",
        categoryLabel: getCategoryLabel("generale"),
        title: formatTitleFromSlug(slug),
        order: extractNumericOrder(slug),
      });
    }
  }

  if (folders.length > 0) {
    const folderResults = await Promise.all(
      folders.map(async (folder) => {
        const { data, error } = await supabase.storage
          .from(WIKI_BUCKET)
          .list(folder, { limit: 500, sortBy: { column: "name", order: "asc" } });
        if (error) {
          console.warn(`Errore lettura cartella wiki/${folder}:`, error.message);
          return [];
        }
        return (data ?? [])
          .filter(
            (file) =>
              file?.name &&
              file.id !== null &&
              file.name.toLowerCase().endsWith(".md")
          )
          .map((file): WikiPageEntry => {
            const slug = file.name.replace(/\.md$/i, "");
            return {
              slug,
              storagePath: `${folder}/${file.name}`,
              category: folder,
              categoryLabel: getCategoryLabel(folder),
              title: formatTitleFromSlug(slug),
              order: extractNumericOrder(slug),
            };
          });
      })
    );

    for (const items of folderResults) {
      entries.push(...items);
    }
  }

  entries.sort((a, b) => {
    const catA = CATEGORY_PRIORITY[a.category.toLowerCase()] ?? 50;
    const catB = CATEGORY_PRIORITY[b.category.toLowerCase()] ?? 50;
    if (catA !== catB) return catA - catB;
    if (a.category !== b.category) return a.category.localeCompare(b.category, "it");
    if (a.order !== b.order) return a.order - b.order;
    return a.title.localeCompare(b.title, "it");
  });

  return entries;
}

/**
 * Scarica il contenuto Markdown grezzo di una pagina dal bucket `wiki`.
 */
export async function fetchWikiPageContent(storagePath: string): Promise<string> {
  const { data } = supabase.storage.from(WIKI_BUCKET).getPublicUrl(storagePath);
  const response = await fetch(data.publicUrl, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(
      `Impossibile caricare la pagina wiki (${response.status} ${response.statusText})`
    );
  }
  return response.text();
}

/**
 * Separa il frontmatter YAML dal corpo Markdown e lo converte in oggetto tipizzato.
 */
export function parseWikiMarkdown(raw: string): ParsedWikiDocument {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return { frontmatter: null, body: raw };
  }

  const yamlBlock = match[1];
  const body = raw.slice(match[0].length);

  try {
    const parsed = loadYaml(yamlBlock);
    const frontmatter =
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as WikiSeasonFrontmatter)
        : null;
    return { frontmatter, body };
  } catch (err) {
    console.warn("Errore parsing YAML frontmatter wiki:", err);
    return { frontmatter: null, body };
  }
}

/**
 * Converte i wikilink Obsidian `[[Target]]` e `[[Target|Label]]`
 * in link Markdown standard `[Label](#wiki:Target)` sicuri per react-markdown.
 */
export function preprocessWikiLinks(markdown: string): string {
  return markdown.replace(
    /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
    (_full, rawTarget: string, rawLabel?: string) => {
      const target = rawTarget.trim();
      const label = (rawLabel ?? rawTarget).trim();
      return `[${label}](#wiki:${encodeURIComponent(target)})`;
    }
  );
}

/**
 * Costruisce una mappa di ricerca veloce da chiave normalizzata a WikiPageEntry.
 */
export function buildWikiLookup(pages: WikiPageEntry[]): Map<string, WikiPageEntry> {
  const map = new Map<string, WikiPageEntry>();
  for (const page of pages) {
    map.set(normalizeWikiKey(page.slug), page);
    map.set(normalizeWikiKey(page.title), page);
  }
  return map;
}
