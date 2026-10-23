import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  UploadCloud,
  FileSpreadsheet,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  Search,
  Sparkles,
  ArrowRight,
  Database,
} from "lucide-react";
import { toast } from "sonner";
import {
  previewRookieImport,
  executeRookieImport,
  RookieImportPreview,
} from "@/services/rookieImportService";

interface ImportRookieModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  authorName: string;
}

export const ImportRookieModal: React.FC<ImportRookieModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  authorName,
}) => {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [preview, setPreview] = useState<RookieImportPreview | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const resetState = () => {
    setFile1(null);
    setFile2(null);
    setPreview(null);
    setIsAnalyzing(false);
    setIsImporting(false);
    setSearchQuery("");
  };

  const handleFileChange = async (fileNumber: 1 | 2, selectedFile: File | null) => {
    const updatedFile1 = fileNumber === 1 ? selectedFile : file1;
    const updatedFile2 = fileNumber === 2 ? selectedFile : file2;

    if (fileNumber === 1) setFile1(selectedFile);
    if (fileNumber === 2) setFile2(selectedFile);

    if (updatedFile1 && updatedFile2) {
      try {
        setIsAnalyzing(true);
        const [content1, content2] = await Promise.all([
          updatedFile1.text(),
          updatedFile2.text(),
        ]);

        const prev = previewRookieImport(
          content1,
          content2,
          updatedFile1.name,
          updatedFile2.name
        );
        setPreview(prev);
        if (prev.valid) {
          toast.success(
            `Analisi completata! ${prev.matchedCount} rookie pronti per l'importazione.`
          );
        } else {
          toast.error(prev.error || "Errore nella convalida dei file.");
        }
      } catch (err: any) {
        console.error("Errore lettura file rookie:", err);
        toast.error("Errore durante la lettura dei file.");
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      setPreview(null);
    }
  };

  const handleConfirmImport = async () => {
    if (!preview || !preview.valid || preview.rookies.length === 0) return;

    try {
      setIsImporting(true);
      toast.info("Importazione in corso: scrittura in ea_player_db e an_rookie...");

      const res = await executeRookieImport(preview, authorName);
      if (res.success) {
        toast.success(
          `Importazione completata con successo! ${res.count} rookie aggiunti alla Master Table e disponibili nel Draft.`
        );
        onSuccess();
        onOpenChange(false);
        resetState();
      } else {
        toast.error(res.error || "Errore durante l'importazione dei rookie.");
      }
    } catch (err: any) {
      console.error("Errore esecuzione importazione rookie:", err);
      toast.error(err.message || "Errore imprevisto.");
    } finally {
      setIsImporting(false);
    }
  };

  const filteredRookies = (preview?.rookies || []).filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.id.toString().includes(q) ||
      r.nome.toLowerCase().includes(q) ||
      r.cognome.toLowerCase().includes(q) ||
      r.posiz.toLowerCase().includes(q) ||
      r.nazionalita.toLowerCase().includes(q)
    );
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isImporting) {
          onOpenChange(v);
          if (!v) resetState();
        }
      }}
    >
      <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] flex flex-col p-0 overflow-hidden bg-card border-border/80 shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-5 border-b border-border/70 bg-muted/40">
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Procedura Ufficiale Draft
            </Badge>
          </div>
          <DialogTitle className="text-xl font-black flex items-center gap-2">
            <Database className="h-5 w-5 text-amber-500" />
            Importa Classe Rookie
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Carica i due file sincronizzati. I rookie verranno aggiunti alla Master Table EA FC 25 (senza sovrascrivere i giocatori attivi) e popoleranno la lista draft in <code>an_rookie</code>.
          </DialogDescription>
        </DialogHeader>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(92vh-150px)]">
          {/* File Upload Dual Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box File 1: Master Data */}
            <div
              className={`p-4 rounded-xl border-2 border-dashed transition-all ${
                file1
                  ? "border-emerald-500/60 bg-emerald-500/5"
                  : "border-border hover:border-amber-500/50 bg-muted/30"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider">
                      File 1: Master Data EA FC 25
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Tracciato 137 colonne (TSV / TXT)
                    </p>
                  </div>
                </div>
                {file1 && (
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold">
                    Caricato
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Contiene le statistiche fisiche, tecniche, ruoli e accessori nativi dei nuovi rookie da aggiungere a <code>ea_player_db</code>.
              </p>

              <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold cursor-pointer transition-colors shadow-xs">
                <UploadCloud className="h-4 w-4 text-emerald-500" />
                <span className="truncate max-w-[220px]">
                  {file1 ? file1.name : "Seleziona File Master Data..."}
                </span>
                <input
                  type="file"
                  accept=".txt,.tsv,.csv"
                  className="hidden"
                  onChange={(e) => handleFileChange(1, e.target.files?.[0] || null)}
                />
              </label>
            </div>

            {/* Box File 2: Anagrafica */}
            <div
              className={`p-4 rounded-xl border-2 border-dashed transition-all ${
                file2
                  ? "border-blue-500/60 bg-blue-500/5"
                  : "border-border hover:border-blue-500/50 bg-muted/30"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider">
                      File 2: Anagrafica Rookie
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      4 Colonne: ID, Nome, Cognome, Squadra
                    </p>
                  </div>
                </div>
                {file2 && (
                  <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/30 font-bold">
                    Caricato
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Assegna nome, cognome e stato di appartenenza a ciascun ID rookie per popolare la tabella <code>an_rookie</code>.
              </p>

              <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold cursor-pointer transition-colors shadow-xs">
                <UploadCloud className="h-4 w-4 text-blue-500" />
                <span className="truncate max-w-[220px]">
                  {file2 ? file2.name : "Seleziona File Anagrafica..."}
                </span>
                <input
                  type="file"
                  accept=".txt,.tsv,.csv"
                  className="hidden"
                  onChange={(e) => handleFileChange(2, e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>

          {/* Status / Error Alert */}
          {isAnalyzing && (
            <div className="p-4 rounded-xl bg-muted/60 border border-border text-center text-xs animate-pulse font-medium">
              Elaborazione ed incrocio degli ID tra File 1 e File 2 in corso...
            </div>
          )}

          {preview && !preview.valid && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
              <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block">Errore Convalida File:</strong>
                <span>{preview.error}</span>
              </div>
            </div>
          )}

          {/* Validation & Preview Summary */}
          {preview && preview.valid && (
            <div className="space-y-3">
              {/* Summary Stats */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-black text-emerald-700 dark:text-emerald-300">
                      {preview.matchedCount} Rookie Convalidati con Successo
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Tutti gli ID corrispondono tra il Master Data e l'Anagrafica.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {preview.unmatchedInFile1.length > 0 && (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]">
                      {preview.unmatchedInFile1.length} ID solo in File 1
                    </Badge>
                  )}
                  {preview.unmatchedInFile2.length > 0 && (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]">
                      {preview.unmatchedInFile2.length} ID solo in File 2
                    </Badge>
                  )}
                </div>
              </div>

              {/* Search Filter & Table Header */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="text-xs font-bold text-muted-foreground font-mono uppercase tracking-wider">
                  Anteprima Rookie Decodificati ({filteredRookies.length})
                </div>
                <div className="relative w-64">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Filtra per nome, ruolo, ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 text-xs bg-background"
                  />
                </div>
              </div>

              {/* Table Preview */}
              <div className="rounded-xl border border-border/80 overflow-hidden bg-card/60">
                <ScrollArea className="h-60 w-full">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/70 text-[11px] font-mono text-muted-foreground sticky top-0 uppercase tracking-wider border-b border-border/70">
                      <tr>
                        <th className="py-2 px-3">ID</th>
                        <th className="py-2 px-3">Calciatore</th>
                        <th className="py-2 px-3">Ruolo</th>
                        <th className="py-2 px-3">OVR / POT</th>
                        <th className="py-2 px-3">Naz</th>
                        <th className="py-2 px-3">Età</th>
                        <th className="py-2 px-3">Piede</th>
                        <th className="py-2 px-3">Stelle</th>
                        <th className="py-2 px-3">Squadra</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 font-medium">
                      {filteredRookies.slice(0, 100).map((r) => (
                        <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-1.5 px-3 font-mono font-bold text-muted-foreground text-[11px]">
                            {r.id}
                          </td>
                          <td className="py-1.5 px-3 font-black text-foreground">
                            {r.nome} {r.cognome}
                          </td>
                          <td className="py-1.5 px-3">
                            <Badge variant="outline" className="font-mono text-[10px] font-bold px-1.5 py-0">
                              {r.posiz}
                            </Badge>
                          </td>
                          <td className="py-1.5 px-3 font-mono font-bold">
                            <span className="text-emerald-600 dark:text-emerald-400">{r.ovr}</span>
                            <span className="text-muted-foreground mx-1">/</span>
                            <span className="text-blue-500">{r.potn}</span>
                          </td>
                          <td className="py-1.5 px-3 font-mono text-xs text-muted-foreground">
                            {r.nazionalita}
                          </td>
                          <td className="py-1.5 px-3 font-mono text-xs">
                            {r.eta}
                          </td>
                          <td className="py-1.5 px-3 font-mono text-xs text-muted-foreground">
                            {r.piede} ({r.piedeDebole})
                          </td>
                          <td className="py-1.5 px-3 text-amber-500 font-bold text-xs">
                            {"★".repeat(r.stelle)}
                          </td>
                          <td className="py-1.5 px-3 font-mono text-xs text-muted-foreground">
                            {r.squadra ? (
                              <Badge variant="outline" className="text-[10px] font-bold">
                                {r.squadra}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground/60 italic">Draft</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredRookies.length > 100 && (
                    <div className="p-2 text-center text-[11px] text-muted-foreground bg-muted/20 border-t border-border/50">
                      ...e altri {filteredRookies.length - 100} rookie convalidati
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-4 border-t border-border/70 bg-muted/30 flex flex-row items-center justify-between gap-3 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
            className="text-xs"
          >
            Annulla
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={!preview || !preview.valid || isImporting}
            onClick={handleConfirmImport}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs shadow-md shadow-emerald-600/20 px-5"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isImporting
              ? "Importazione in corso..."
              : `Importa ${preview?.matchedCount || 0} Rookie in Master Table e an_rookie`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
