import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Navbar from "@/components/Navbar";
import { WikiInfobox } from "@/components/wiki/WikiInfobox";
import {
  buildWikiLookup,
  fetchWikiPageContent,
  listWikiPages,
  normalizeWikiKey,
  parseWikiMarkdown,
  preprocessWikiLinks,
  WikiPageEntry,
} from "@/services/wikiService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderOpen,
  Home,
  Loader2,
  Search,
} from "lucide-react";

const ArchivioWiki: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: pages = [],
    isLoading: isLoadingIndex,
    error: indexError,
  } = useQuery({
    queryKey: ["wiki-pages-index"],
    queryFn: listWikiPages,
    staleTime: 5 * 60 * 1000,
  });

  const wikiLookup = useMemo(() => buildWikiLookup(pages), [pages]);

  const activePage = useMemo(() => {
    if (!slug) return null;
    return (
      pages.find((p) => p.slug === slug) ??
      wikiLookup.get(normalizeWikiKey(slug)) ??
      null
    );
  }, [slug, pages, wikiLookup]);

  const {
    data: rawContent,
    isLoading: isLoadingPage,
    error: pageError,
  } = useQuery({
    queryKey: ["wiki-page-content", activePage?.storagePath],
    queryFn: () => fetchWikiPageContent(activePage!.storagePath),
    enabled: Boolean(activePage?.storagePath),
    staleTime: 5 * 60 * 1000,
  });

  const parsedDoc = useMemo(() => {
    if (!rawContent) return null;
    return parseWikiMarkdown(rawContent);
  }, [rawContent]);

  const processedBody = useMemo(() => {
    if (!parsedDoc?.body) return "";
    return preprocessWikiLinks(parsedDoc.body);
  }, [parsedDoc]);

  const groupedPages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? pages.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.categoryLabel.toLowerCase().includes(q) ||
            p.slug.toLowerCase().includes(q)
        )
      : pages;

    const groups = new Map<string, { label: string; items: WikiPageEntry[] }>();
    for (const p of filtered) {
      if (!groups.has(p.category)) {
        groups.set(p.category, { label: p.categoryLabel, items: [] });
      }
      groups.get(p.category)!.items.push(p);
    }
    return Array.from(groups.entries());
  }, [pages, searchQuery]);

  const { prevPage, nextPage } = useMemo(() => {
    if (!activePage) return { prevPage: null, nextPage: null };

    const fmPrev = parsedDoc?.frontmatter?.precedente
      ? wikiLookup.get(normalizeWikiKey(parsedDoc.frontmatter.precedente)) ?? null
      : null;
    const fmNext = parsedDoc?.frontmatter?.successiva
      ? wikiLookup.get(normalizeWikiKey(parsedDoc.frontmatter.successiva)) ?? null
      : null;

    if (fmPrev || fmNext) {
      return { prevPage: fmPrev, nextPage: fmNext };
    }

    const sameCategory = pages.filter((p) => p.category === activePage.category);
    const idx = sameCategory.findIndex((p) => p.slug === activePage.slug);
    return {
      prevPage: idx > 0 ? sameCategory[idx - 1] : null,
      nextPage:
        idx >= 0 && idx < sameCategory.length - 1 ? sameCategory[idx + 1] : null,
    };
  }, [activePage, parsedDoc, pages, wikiLookup]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header + Breadcrumb */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <span>Archivio</span>
              <span>/</span>
              <Link to="/archivio/wiki" className="hover:text-foreground transition-colors">
                Wiki LCSIM
              </Link>
              {activePage && (
                <>
                  <span>/</span>
                  <span className="text-foreground font-medium">{activePage.title}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2.5">
              <BookOpen className="h-7 w-7 text-primary shrink-0" />
              Wiki LCSIM
            </h1>
          </div>

          {/* Selettore rapido mobile / tablet */}
          <div className="lg:hidden w-full sm:w-64">
            <Select
              value={activePage?.slug ?? "__home__"}
              onValueChange={(val) => {
                if (val === "__home__") {
                  navigate("/archivio/wiki");
                } else {
                  navigate(`/archivio/wiki/${val}`);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona una pagina..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__home__">Indice Wiki</SelectItem>
                {pages.map((p) => (
                  <SelectItem key={p.slug} value={p.slug}>
                    {p.categoryLabel} — {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {indexError ? (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-6 text-sm text-destructive">
              Errore nel caricamento dell'indice Wiki:{" "}
              {indexError instanceof Error ? indexError.message : "Errore sconosciuto"}
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Sidebar sinistra (desktop) */}
            <aside className="hidden lg:block w-64 shrink-0 sticky top-20 space-y-4">
              <Card className="border-border/70">
                <CardHeader className="p-3.5 pb-2">
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cerca nella wiki..."
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-2 pt-1 max-h-[calc(100vh-14rem)] overflow-y-auto space-y-3">
                  <Link
                    to="/archivio/wiki"
                    className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      !activePage
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Home className="h-3.5 w-3.5 shrink-0" />
                    Indice Principale
                  </Link>

                  {isLoadingIndex ? (
                    <div className="flex items-center gap-2 px-2.5 py-3 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Caricamento indice...
                    </div>
                  ) : groupedPages.length === 0 ? (
                    <p className="px-2.5 py-2 text-xs text-muted-foreground">
                      Nessuna pagina trovata.
                    </p>
                  ) : (
                    groupedPages.map(([catKey, group]) => (
                      <div key={catKey} className="space-y-1">
                        <div className="flex items-center gap-1.5 px-2.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          <FolderOpen className="h-3 w-3" />
                          {group.label}
                        </div>
                        <div className="space-y-0.5">
                          {group.items.map((item) => {
                            const isActive = activePage?.slug === item.slug;
                            return (
                              <Link
                                key={item.slug}
                                to={`/archivio/wiki/${item.slug}`}
                                className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                                  isActive
                                    ? "bg-primary text-primary-foreground font-medium"
                                    : "text-foreground/80 hover:bg-muted hover:text-foreground"
                                }`}
                              >
                                <FileText className="h-3.5 w-3.5 shrink-0 opacity-75" />
                                <span className="truncate">{item.title}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </aside>

            {/* Contenuto centrale */}
            <div className="flex-1 min-w-0 w-full">
              {!slug ? (
                /* Wiki Home / Indice */
                <div className="space-y-6">
                  <Card className="border-border/70 bg-gradient-to-br from-card to-muted/30">
                    <CardHeader>
                      <CardTitle className="text-xl">
                        Benvenuto nell'Enciclopedia Ufficiale della LCSIM
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-2">
                      <p>
                        Qui trovi la cronistoria completa della Lega Calcio Simulato:
                        riassunti delle stagioni, tabelloni playoff, statistiche, record
                        e curiosità storiche.
                      </p>
                      <p className="text-xs">
                        I collegamenti sottolineati con bordo tratteggiato indicano voci
                        enciclopediche (squadre, calciatori, presidenti) che verranno
                        attivate automaticamente non appena saranno pubblicate le relative
                        pagine.
                      </p>
                    </CardContent>
                  </Card>

                  {isLoadingIndex ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Caricamento pagine wiki...
                    </div>
                  ) : (
                    groupedPages.map(([catKey, group]) => (
                      <section key={catKey} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-semibold flex items-center gap-2">
                            <FolderOpen className="h-4 w-4 text-primary" />
                            {group.label}
                          </h2>
                          <Badge variant="outline">{group.items.length} pagine</Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                          {group.items.map((item) => (
                            <Link
                              key={item.slug}
                              to={`/archivio/wiki/${item.slug}`}
                              className="group block"
                            >
                              <Card className="h-full border-border/70 transition-all hover:border-primary/60 hover:shadow-md">
                                <CardContent className="p-4 flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                      <FileText className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                                        {item.title}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {group.label}
                                      </div>
                                    </div>
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                </CardContent>
                              </Card>
                            </Link>
                          ))}
                        </div>
                      </section>
                    ))
                  )}
                </div>
              ) : isLoadingIndex ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Ricerca pagina wiki...
                </div>
              ) : !activePage ? (
                <Card>
                  <CardContent className="p-8 text-center space-y-3">
                    <p className="text-lg font-semibold">Pagina non trovata</p>
                    <p className="text-sm text-muted-foreground">
                      La voce wiki <code className="px-1.5 py-0.5 rounded bg-muted">{slug}</code>{" "}
                      non è ancora presente nell'archivio.
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/archivio/wiki">Torna all'indice Wiki</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : isLoadingPage ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Caricamento {activePage.title}...
                </div>
              ) : pageError ? (
                <Card className="border-destructive/50 bg-destructive/5">
                  <CardContent className="p-6 text-sm text-destructive">
                    Errore nel caricamento della pagina:{" "}
                    {pageError instanceof Error ? pageError.message : "Errore sconosciuto"}
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col xl:flex-row gap-6 items-start">
                  {/* Infobox mobile/tablet (mostrata sopra l'articolo sotto xl) */}
                  {parsedDoc?.frontmatter && (
                    <div className="w-full xl:hidden">
                      <WikiInfobox frontmatter={parsedDoc.frontmatter} />
                    </div>
                  )}

                  {/* Articolo Markdown */}
                  <article className="flex-1 min-w-0 w-full">
                    <Card className="border-border/70">
                      <CardContent className="p-5 sm:p-8">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ children }) => (
                              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight border-b border-border pb-2.5 mb-5 mt-1 first:mt-0">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight border-b border-border/60 pb-1.5 mt-8 mb-3.5">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-base sm:text-lg font-semibold mt-6 mb-2.5 text-foreground">
                                {children}
                              </h3>
                            ),
                            h4: ({ children }) => (
                              <h4 className="text-sm sm:text-base font-semibold mt-4 mb-2 text-foreground/90">
                                {children}
                              </h4>
                            ),
                            p: ({ children }) => (
                              <p className="text-sm sm:text-[15px] leading-7 text-foreground/90 mb-4">
                                {children}
                              </p>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc pl-6 space-y-1.5 text-sm sm:text-[15px] leading-relaxed text-foreground/90 mb-4">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal pl-6 space-y-1.5 text-sm sm:text-[15px] leading-relaxed text-foreground/90 mb-4">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => <li className="pl-0.5">{children}</li>,
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-primary/50 bg-muted/40 px-4 py-2.5 my-4 rounded-r-md text-sm italic text-muted-foreground">
                                {children}
                              </blockquote>
                            ),
                            hr: () => <hr className="my-6 border-border/70" />,
                            table: ({ children }) => (
                              <div className="my-4 w-full overflow-x-auto rounded-lg border border-border/80">
                                <table className="w-full text-xs sm:text-sm border-collapse">
                                  {children}
                                </table>
                              </div>
                            ),
                            thead: ({ children }) => (
                              <thead className="bg-muted/70 text-foreground">
                                {children}
                              </thead>
                            ),
                            tr: ({ children }) => (
                              <tr className="border-b border-border/60 last:border-b-0 hover:bg-muted/30 transition-colors">
                                {children}
                              </tr>
                            ),
                            th: ({ children, style }) => (
                              <th
                                style={style}
                                className="px-3 py-2 text-left font-semibold whitespace-nowrap border-r border-border/40 last:border-r-0"
                              >
                                {children}
                              </th>
                            ),
                            td: ({ children, style }) => (
                              <td
                                style={style}
                                className="px-3 py-2 align-top border-r border-border/40 last:border-r-0"
                              >
                                {children}
                              </td>
                            ),
                            a: ({ href, children }) => {
                              if (href?.startsWith("#wiki:")) {
                                const rawTarget = decodeURIComponent(
                                  href.slice("#wiki:".length)
                                );
                                const matched = wikiLookup.get(
                                  normalizeWikiKey(rawTarget)
                                );
                                if (matched) {
                                  return (
                                    <Link
                                      to={`/archivio/wiki/${matched.slug}`}
                                      className="text-primary font-medium hover:underline"
                                    >
                                      {children}
                                    </Link>
                                  );
                                }
                                return (
                                  <span
                                    title={`Voce wiki "${rawTarget}" non ancora disponibile`}
                                    className="border-b border-dotted border-amber-500/60 text-foreground/90 cursor-help"
                                  >
                                    {children}
                                  </span>
                                );
                              }
                              return (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  {children}
                                </a>
                              );
                            },
                          }}
                        >
                          {processedBody}
                        </ReactMarkdown>

                        {/* Navigazione Precedente / Successiva */}
                        {(prevPage || nextPage) && (
                          <div className="mt-8 pt-5 border-t border-border/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            {prevPage ? (
                              <Button
                                asChild
                                variant="outline"
                                className="justify-start gap-2"
                              >
                                <Link to={`/archivio/wiki/${prevPage.slug}`}>
                                  <ChevronLeft className="h-4 w-4 shrink-0" />
                                  <span>{prevPage.title}</span>
                                </Link>
                              </Button>
                            ) : (
                              <div />
                            )}
                            {nextPage ? (
                              <Button
                                asChild
                                variant="outline"
                                className="justify-end gap-2"
                              >
                                <Link to={`/archivio/wiki/${nextPage.slug}`}>
                                  <span>{nextPage.title}</span>
                                  <ChevronRight className="h-4 w-4 shrink-0" />
                                </Link>
                              </Button>
                            ) : (
                              <div />
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </article>

                  {/* Infobox laterale destra (desktop xl+) */}
                  {parsedDoc?.frontmatter && (
                    <aside className="hidden xl:block w-80 2xl:w-96 shrink-0 sticky top-20">
                      <WikiInfobox frontmatter={parsedDoc.frontmatter} />
                    </aside>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ArchivioWiki;
