// Concatena classes condicionais de forma simples (sem dependências externas).
// Aceita strings, undefined, null e false — ignorando valores não verdadeiros.
export function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(" ");
}

// Formata números grandes de forma compacta (ex: 1.2k) para painéis de dados.
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}
