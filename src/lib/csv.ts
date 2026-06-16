// =============================================================================
// Parser de CSV leve (sem dependências) focado em colunas: nome_empresa, telefone
// Suporta cabeçalho flexível, aspas e separador ',' ou ';'.
// =============================================================================

export interface ParsedLead {
  company_name: string;
  phone_number: string;
}

export interface CsvParseResult {
  rows: ParsedLead[];
  errors: string[];
}

// Aliases aceitos para mapear o cabeçalho às colunas internas
const COMPANY_ALIASES = ["nome_empresa", "empresa", "company_name", "company", "nome"];
const PHONE_ALIASES = ["telefone", "phone", "phone_number", "celular", "whatsapp"];

function splitLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      // Aspas duplas escapadas ("")
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCsv(text: string): CsvParseResult {
  const errors: string[] = [];
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

  if (!cleaned) {
    return { rows: [], errors: ["O arquivo está vazio."] };
  }

  const lines = cleaned.split("\n").filter((l) => l.trim().length > 0);
  const delimiter = (lines[0].match(/;/g)?.length ?? 0) > (lines[0].match(/,/g)?.length ?? 0)
    ? ";"
    : ",";

  const header = splitLine(lines[0], delimiter).map((h) => h.toLowerCase());
  const companyIdx = header.findIndex((h) => COMPANY_ALIASES.includes(h));
  const phoneIdx = header.findIndex((h) => PHONE_ALIASES.includes(h));

  if (companyIdx === -1 || phoneIdx === -1) {
    return {
      rows: [],
      errors: [
        "Cabeçalho inválido. O CSV precisa conter as colunas 'nome_empresa' e 'telefone'.",
      ],
    };
  }

  const rows: ParsedLead[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitLine(lines[i], delimiter);
    const company_name = cols[companyIdx]?.trim() ?? "";
    const phone_number = cols[phoneIdx]?.trim() ?? "";

    if (!company_name && !phone_number) continue;

    if (!company_name) {
      errors.push(`Linha ${i + 1}: nome da empresa ausente.`);
      continue;
    }
    if (!phone_number) {
      errors.push(`Linha ${i + 1}: telefone ausente.`);
      continue;
    }

    rows.push({ company_name, phone_number });
  }

  return { rows, errors };
}
