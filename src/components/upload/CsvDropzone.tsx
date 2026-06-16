"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LeadStatusBadge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { parseCsv, type ParsedLead } from "@/lib/csv";
import { createCampaignWithLeads } from "@/app/(app)/upload/actions";
import { cn } from "@/lib/utils";

type Phase = "idle" | "parsing" | "preview" | "error" | "success";

export function CsvDropzone() {
  const router = useRouter();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [fileName, setFileName] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [rows, setRows] = useState<ParsedLead[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const [isImporting, startImport] = useTransition();

  const handleFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setPhase("error");
      setErrors(["Formato inválido. Envie um arquivo .csv."]);
      return;
    }

    setFileName(file.name);
    // Sugere o nome da campanha a partir do nome do arquivo
    setCampaignName(file.name.replace(/\.csv$/i, ""));
    setPhase("parsing");

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result ?? "");
      const result = parseCsv(text);
      setRows(result.rows);
      setErrors(result.errors);
      setPhase(result.rows.length > 0 ? "preview" : "error");
    };
    reader.onerror = () => {
      setPhase("error");
      setErrors(["Não foi possível ler o arquivo."]);
    };
    reader.readAsText(file);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const reset = () => {
    setPhase("idle");
    setFileName("");
    setCampaignName("");
    setRows([]);
    setErrors([]);
    setImportError(null);
    setImportedCount(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleImport = () => {
    setImportError(null);
    startImport(async () => {
      const result = await createCampaignWithLeads(campaignName, rows);
      if (!result.ok) {
        setImportError(result.error ?? "Falha na importação.");
        toast({
          variant: "error",
          title: "Falha na importação",
          description: result.error ?? "Tente novamente.",
        });
        return;
      }
      setImportedCount(result.inserted ?? rows.length);
      setPhase("success");
      toast({
        variant: "success",
        title: "Leads importados",
        description: `${result.inserted ?? rows.length} leads em "${campaignName}".`,
      });
    });
  };

  // ---------------------------------------------------------------------------
  // Tela de sucesso
  // ---------------------------------------------------------------------------
  if (phase === "success") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-ink-800 bg-ink-900 px-6 py-16 text-center shadow-soft">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <div>
          <h3 className="text-xl font-semibold text-white">
            Importação concluída!
          </h3>
          <p className="mt-1 text-ink-400">
            {importedCount} leads importados para a campanha{" "}
            <strong className="text-ink-200">{campaignName}</strong>.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => router.push("/campaigns")}>
            <Megaphone className="h-4 w-4" />
            Ver campanhas
          </Button>
          <Button variant="secondary" onClick={reset}>
            Importar outra lista
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Zona de Drag & Drop */}
      {phase !== "preview" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-all duration-200",
            isDragging
              ? "scale-[1.01] border-brand-500 bg-brand-500/10"
              : "border-ink-700 bg-ink-900 hover:border-brand-500/60 hover:bg-ink-850"
          )}
        >
          <span
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-2xl transition-colors",
              isDragging
                ? "bg-brand-500/15 text-brand-400"
                : "bg-ink-800 text-ink-400"
            )}
          >
            {phase === "parsing" ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <UploadCloud className="h-8 w-8" />
            )}
          </span>

          <div>
            <p className="text-lg font-medium text-white">
              {isDragging
                ? "Solte o arquivo aqui"
                : "Arraste e solte seu arquivo CSV"}
            </p>
            <p className="mt-1 text-sm text-ink-400">
              ou{" "}
              <span className="font-medium text-brand-500">
                clique para selecionar
              </span>{" "}
              — colunas obrigatórias: <code>nome_empresa</code>,{" "}
              <code>telefone</code>
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      )}

      {/* Erros de validação do arquivo */}
      {phase === "error" && errors.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
          <div className="flex flex-col gap-1 text-sm text-brand-300">
            <span className="font-semibold">
              Não foi possível processar o arquivo:
            </span>
            <ul className="list-disc pl-5">
              {errors.slice(0, 5).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Pré-visualização dos leads */}
      {phase === "preview" && (
        <div className="flex flex-col gap-4 rounded-2xl border border-ink-800 bg-ink-900 shadow-soft">
          <div className="flex items-center justify-between gap-3 border-b border-ink-800 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
                <FileSpreadsheet className="h-5 w-5" />
              </span>
              <div>
                <p className="font-medium text-white">{fileName}</p>
                <p className="text-sm text-ink-400">
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    {rows.length} leads válidos
                  </span>
                  {errors.length > 0 && (
                    <span className="ml-2 text-amber-400">
                      • {errors.length} linha(s) ignorada(s)
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={reset}
              aria-label="Remover arquivo"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-ink-400 hover:bg-ink-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nome da campanha */}
          <div className="flex flex-col gap-1.5 px-6">
            <label
              htmlFor="campaignName"
              className="text-sm font-medium text-ink-300"
            >
              Nome da campanha
            </label>
            <input
              id="campaignName"
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Ex: Indústrias Metalúrgicas — SP"
              className="h-11 w-full rounded-xl border border-ink-700 bg-ink-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-ink-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Tabela de pré-visualização (até 50 linhas) */}
          <div className="scrollbar-thin max-h-[420px] overflow-auto px-6">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-ink-900">
                <tr className="border-b border-ink-800 text-xs uppercase tracking-wide text-ink-400">
                  <th className="py-3 pr-4 font-medium">#</th>
                  <th className="py-3 pr-4 font-medium">Empresa</th>
                  <th className="py-3 pr-4 font-medium">Telefone</th>
                  <th className="py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800/60">
                {rows.slice(0, 50).map((row, i) => (
                  <tr key={i} className="text-ink-300">
                    <td className="py-3 pr-4 text-ink-500">{i + 1}</td>
                    <td className="py-3 pr-4 font-medium text-white">
                      {row.company_name}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">{row.phone_number}</td>
                    <td className="py-3">
                      <LeadStatusBadge status="pending" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 50 && (
              <p className="py-3 text-center text-xs text-ink-400">
                + {rows.length - 50} leads não exibidos na pré-visualização
              </p>
            )}
          </div>

          {/* Erro de importação */}
          {importError && (
            <div className="mx-6 flex items-center gap-2 rounded-xl border border-brand-500/30 bg-brand-500/10 px-3 py-2 text-sm text-brand-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {importError}
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-col gap-3 border-t border-ink-800 px-6 py-4 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={reset} disabled={isImporting}>
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={isImporting || !campaignName.trim()}
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Importar {rows.length} leads
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
