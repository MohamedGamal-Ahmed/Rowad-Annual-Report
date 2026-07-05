import * as XLSX from "xlsx";
import type { Opportunity, AgreementRecord, Currency } from "../types/domain";

// Raw row shapes as they appear in the uploaded workbook. Standardized on the
// star schema shipped in PreAward_PBI_Model.xlsx: Fact_Opportunities,
// Fact_Opp_Currency (long format), Fact_Agreements, Data_Quality_Notes. The
// earlier flat "PBI_Source" prototype sheet is retired — that was an early
// mockup format, never the real data source. Column names are still matched
// via normalizeKey() (case/whitespace/underscore tolerant), because even
// within one schema, exports drift (trailing spaces, casing).
type RawRow = Record<string, unknown>;

const CURRENCY_SET = new Set<Currency>(["EGP", "USD", "SAR", "EURO", "CFA"]);

/** Collapse whitespace/case/underscore variance so "ProjectCode",
 * " project_code ", and "PROJECT CODE" all resolve to the same logical
 * column. Does NOT bridge a "Flag_"/"Amount_" prefix onto a differently-named
 * field — those are handled by passing both forms as explicit aliases below. */
function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[\s_]+/g, "").trim();
}

/** Build a normalized-key -> actual-key lookup once per row shape. */
function buildKeyIndex(row: RawRow): Map<string, string> {
  const idx = new Map<string, string>();
  for (const k of Object.keys(row)) idx.set(normalizeKey(k), k);
  return idx;
}

/** Look up a field by logical name (plus optional aliases), tolerant of
 * whitespace/case/underscore drift. Returns undefined if truly absent. */
function field(row: RawRow, idx: Map<string, string>, ...names: string[]): unknown {
  for (const name of names) {
    const actualKey = idx.get(normalizeKey(name));
    if (actualKey !== undefined) return row[actualKey];
  }
  return undefined;
}

/** Coerce Excel cell values to numbers, tolerating comma thousands separators,
 * currency symbols, and stray whitespace (e.g. "1,250,000 " or "EGP 500"). */
function toNumber(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const cleaned = v.replace(/[,\s]/g, "").replace(/[^0-9.\-]/g, "");
    if (!cleaned) return 0;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** Find a sheet by any of several logical names (tried in order), tolerant of
 * case/whitespace/underscore drift. */
function findSheet(names: string[], ...targets: string[]): string | undefined {
  for (const target of targets) {
    const hit = names.find((n) => normalizeKey(n) === normalizeKey(target));
    if (hit) return hit;
  }
  return undefined;
}

/** BR (approved): Yomna/Youmna merge to one person; trim whitespace; title-case
 * single names; composite "A&B" entries kept as one bucket (joint ownership),
 * never split; Maram/Marah stay distinct (unresolved — flagged, not merged).
 * Idempotent — safe to run even though the sheet already ships a pre-cleaned
 * Assignee column; this is a safety net for whitespace/case drift only. */
function cleanAssigneeName(raw: string): string {
  const trimmed = raw.replace(/\s+/g, " ").trim();
  if (trimmed.includes("&")) {
    return trimmed
      .split("&")
      .map((part) => (/^[A-Za-z\s]+$/.test(part.trim()) ? titleCase(part.trim()) : part.trim()))
      .join("&");
  }
  const titled = /^[A-Za-z\s]+$/.test(trimmed) ? titleCase(trimmed) : trimmed;
  const manualMerge: Record<string, string> = { Youmna: "Yomna" };
  return manualMerge[titled] ?? titled;
}

function titleCase(s: string): string {
  return s
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function categorizeAgreement(agreementType: string): AgreementRecord["agreementCategory"] {
  const a = agreementType || "";
  if (a.includes("JV")) return "JV";
  if (a.includes("Consort")) return "Consortium";
  if (a.includes("Cooperation")) return "Cooperation";
  if (a.includes("Subcontract")) return "Subcontract";
  if (a.includes("NDA")) return "NDA";
  if (a.includes("MOU")) return "MOU";
  return "Other";
}

const KNOWN_AGREEMENT_CATEGORIES = new Set<AgreementRecord["agreementCategory"]>([
  "JV",
  "Consortium",
  "Cooperation",
  "Subcontract",
  "NDA",
  "MOU",
  "Other",
]);

export interface ParseResult {
  opportunities: Opportunity[];
  agreements: AgreementRecord[];
  dataQualityNotes: string[];
  /** Actual anomalies worth interrupting the user for (sheet missing, zero
   * rows survived, etc.) — surfaced as a visible UI banner. Kept separate
   * from dataQualityNotes, which are routine design-decision footnotes. */
  warnings: string[];
}

export async function parseWorkbook(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const notes: string[] = [];
  const warnings: string[] = [];

  // --- Opportunities: Fact_Opportunities (star schema — the only supported source) ---
  const sourceSheetName = findSheet(workbook.SheetNames, "Fact_Opportunities") ?? workbook.SheetNames[0];
  if (findSheet(workbook.SheetNames, "Fact_Opportunities") === undefined) {
    warnings.push(
      `"Fact_Opportunities" sheet not found by name — falling back to the first sheet ("${sourceSheetName}"). ` +
        `Workbook sheets detected: ${workbook.SheetNames.join(", ")}.`,
    );
  }
  const sourceSheet = workbook.Sheets[sourceSheetName];
  const rawSource: RawRow[] = XLSX.utils.sheet_to_json(sourceSheet, { defval: 0 });

  // --- Long-format currency table (Fact_Opp_Currency: ProjectCode/Currency/Amount) —
  // the sole source of truth for award amounts, per this workbook's own
  // Data_Quality_Notes ("don't sum across currencies... use Fact_Opp_Currency"). ---
  const currencySheetName = findSheet(workbook.SheetNames, "Fact_Opp_Currency");
  const currencyByProject = new Map<string, Partial<Record<Currency, number>>>();
  if (currencySheetName) {
    const rawCurrency: RawRow[] = XLSX.utils.sheet_to_json(workbook.Sheets[currencySheetName], { defval: 0 });
    for (const r of rawCurrency) {
      const idx = buildKeyIndex(r);
      const projectCode = String(field(r, idx, "ProjectCode") ?? "").trim();
      const currencyRaw = String(field(r, idx, "Currency") ?? "").trim().toUpperCase() as Currency;
      const amount = toNumber(field(r, idx, "Amount"));
      if (!projectCode || !CURRENCY_SET.has(currencyRaw) || amount <= 0) continue;
      const bucket = currencyByProject.get(projectCode) ?? {};
      bucket[currencyRaw] = amount;
      currencyByProject.set(projectCode, bucket);
    }
  } else {
    warnings.push('"Fact_Opp_Currency" sheet not found — awarded/total values will show as 0 for every currency.');
  }

  const opportunities: Opportunity[] = rawSource
    .map((r) => ({ r, idx: buildKeyIndex(r) }))
    .filter(({ r, idx }) => {
      const code = field(r, idx, "ProjectCode");
      return code !== undefined && code !== null && String(code).trim() !== "";
    })
    .map(({ r, idx }) => {
      const projectCode = String(field(r, idx, "ProjectCode")).trim();

      // Fact_Opp_Currency is the sole source for amounts (long format, one
      // row per project x currency). No embedded per-row Amount_* fallback —
      // that would silently reintroduce a second, potentially inconsistent
      // source of truth for the same figure.
      const amounts: Partial<Record<Currency, number>> = { ...(currencyByProject.get(projectCode) ?? {}) };

      const assigneeClean = String(field(r, idx, "Assignee") ?? "");
      const assigneeRaw = String(field(r, idx, "AssigneeRaw") ?? assigneeClean);

      return {
        projectCode,
        projectName: String(field(r, idx, "ProjectName") ?? "").trim(),
        country: String(field(r, idx, "Country") ?? "").trim(),
        assignee: cleanAssigneeName(assigneeClean),
        assigneeRaw,
        status: String(field(r, idx, "Status") ?? "").trim(),
        flagContractQualifications: toNumber(field(r, idx, "FlagContractQualifications")) === 1 ? 1 : 0,
        flagRiskAssessment: toNumber(field(r, idx, "FlagRiskAssessment")) === 1 ? 1 : 0,
        flagContractSummary: toNumber(field(r, idx, "FlagContractSummary")) === 1 ? 1 : 0,
        flagNegotiation: toNumber(field(r, idx, "FlagNegotiation")) === 1 ? 1 : 0,
        flagAward: toNumber(field(r, idx, "FlagAward")) === 1 ? 1 : 0,
        amounts,
      };
    });

  if (opportunities.length === 0) {
    const firstRowHeaders = rawSource.length > 0 ? Object.keys(rawSource[0]) : [];
    const msg =
      `0 opportunities survived parsing "${sourceSheetName}" (${rawSource.length} raw row(s) read). ` +
      `Detected headers: [${firstRowHeaders.join(", ")}]. Expected a "ProjectCode" column (any case/spacing).`;
    warnings.push(msg);
    // eslint-disable-next-line no-console
    console.warn("[excelParser]", msg);
  }

  // --- Agreements (Fact_Agreements) — standalone, never joined to Opportunities
  // (see Data_Quality_Notes: Project Name text does not match between the two
  // sheets by design). ---
  const agreementSheetName = findSheet(workbook.SheetNames, "Fact_Agreements");
  const agreements: AgreementRecord[] = [];
  if (agreementSheetName) {
    const agreementSheet = workbook.Sheets[agreementSheetName];
    const rawAgreements: RawRow[] = XLSX.utils.sheet_to_json(agreementSheet, { defval: "" });
    for (const r of rawAgreements) {
      const idx = buildKeyIndex(r);
      const projectName = String(field(r, idx, "ProjectName") ?? "").trim();
      if (!projectName) continue;
      const agreementType = String(field(r, idx, "AgreementType") ?? "").trim();
      // Prefer the sheet's own precomputed category over re-deriving from
      // free text — more reliable when present.
      const providedCategory = String(field(r, idx, "AgreementCategory") ?? "").trim() as AgreementRecord["agreementCategory"];
      const agreementCategory = KNOWN_AGREEMENT_CATEGORIES.has(providedCategory)
        ? providedCategory
        : categorizeAgreement(agreementType);
      agreements.push({
        sr: toNumber(field(r, idx, "SR")),
        projectName,
        agreementType,
        agreementCategory,
        parties: String(field(r, idx, "Parties") ?? "").replace(/\r?\n/g, " ").trim(),
        status: String(field(r, idx, "Status") ?? "").trim(),
      });
    }
  } else {
    warnings.push('"Fact_Agreements" sheet not found in this workbook — Agreement Analysis page will show empty state.');
  }

  // --- Data_Quality_Notes — the workbook's own curated caveats, surfaced
  // verbatim rather than re-stated. ---
  const dqnSheetName = findSheet(workbook.SheetNames, "Data_Quality_Notes");
  if (dqnSheetName) {
    const rawDqn: RawRow[] = XLSX.utils.sheet_to_json(workbook.Sheets[dqnSheetName], { defval: "" });
    for (const r of rawDqn) {
      const idx = buildKeyIndex(r);
      const issue = String(field(r, idx, "Issue") ?? "").trim();
      const detail = String(field(r, idx, "Detail") ?? "").trim();
      if (issue || detail) notes.push(issue ? `${issue}: ${detail}` : detail);
    }
  }

  return { opportunities, agreements, dataQualityNotes: notes, warnings };
}
