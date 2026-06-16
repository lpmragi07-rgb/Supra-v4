import { Download, Info } from "lucide-react";
import { CsvDropzone } from "@/components/upload/CsvDropzone";

export default function UploadPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Cabeçalho */}
      <header>
        <span className="kicker">Importação</span>
        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
          Upload de <span className="accent-italic">lista</span>
        </h1>
        <p className="mt-2 max-w-xl text-ink-400">
          Importe seus leads em massa via CSV. Mapeamos automaticamente as
          colunas de empresa e telefone.
        </p>
      </header>

      {/* Aviso de formato + download do modelo */}
      <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3 text-sm text-sky-200">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
          <p>
            O arquivo deve conter as colunas{" "}
            <code className="rounded bg-ink-950/60 px-1 py-0.5 font-mono text-xs">
              nome_empresa
            </code>{" "}
            e{" "}
            <code className="rounded bg-ink-950/60 px-1 py-0.5 font-mono text-xs">
              telefone
            </code>
            . Separador aceito: vírgula ou ponto e vírgula.
          </p>
        </div>
        <a
          href="/exemplo-leads.csv"
          download
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sm font-medium text-sky-300 transition-colors hover:bg-sky-500/20"
        >
          <Download className="h-4 w-4" />
          Baixar modelo
        </a>
      </div>

      <CsvDropzone />
    </div>
  );
}
