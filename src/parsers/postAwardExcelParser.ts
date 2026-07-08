import * as XLSX from "xlsx";
import type {
  ClientClaim,
  CorrespondenceRecord,
  InvoiceRecord,
  PostAwardCurrency,
  PostAwardSemanticModel,
  ProjectInfo,
  ProjectRegisterRow,
  ScClaim,
  ScDraft,
  SpecialAgreement,
  SubcontractAgreement,
  SubcontractReview,
  TocDlcRecord,
  VariationOrder,
} from "../types/postAward";
import { canonicalProjectName } from "../utils/projectNameAliases";

// Raw operational workbook — NOT a pre-cleaned star schema (unlike the
// Pre-Award model). Sheet layouts were inspected directly against the real
// "Ongoing Report Annual Report-2025" workbook and are matched by COLUMN
// POSITION rather than header text, because header text in this workbook is
// inconsistent (line breaks mid-header, typos — "Spicial", "Intity",
// "Submision", "Cliam Type" — trailing/leading spaces in sheet names). A
// light anchor check on row 1 guards against a silently reshuffled layout.

const CURRENCY_SET = new Set<PostAwardCurrency>(["EGP", "USD", "SAR", "EUR"]);

type Row = unknown[];

function normalizeSheetName(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function findSheet(names: string[], target: string): string | undefined {
  return names.find((n) => normalizeSheetName(n) === normalizeSheetName(target));
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
}

function num(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const cleaned = v.replace(/[,\s]/g, "").replace(/[^0-9.\-]/g, "");
    if (!cleaned) return 0;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = num(v);
  return n === 0 && typeof v === "string" && v.trim() !== "0" ? null : n;
}

function dateOrNull(v: unknown): Date | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  if (typeof v === "number") {
    // Excel serial date fallback (cellDates:true normally handles this already).
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return new Date(d.y, d.m - 1, d.d);
  }
  return null;
}

function currencyOrNull(v: unknown): PostAwardCurrency | null {
  const c = str(v).toUpperCase();
  return CURRENCY_SET.has(c as PostAwardCurrency) ? (c as PostAwardCurrency) : null;
}

/** Read a sheet as an array-of-rows, dropping any leading fully-blank rows
 * beyond what the caller already accounts for via `headerRows`. */
function sheetRows(workbook: XLSX.WorkBook, sheetName: string, headerRows: number): Row[] {
  const sheet = workbook.Sheets[sheetName];
  const all = XLSX.utils.sheet_to_json<Row>(sheet, { header: 1, defval: null, raw: true });
  return all.slice(headerRows);
}

function isBlankRow(row: Row | undefined, anchorCols: number[]): boolean {
  if (!row) return true;
  return anchorCols.every((i) => row[i] === null || row[i] === undefined || str(row[i]) === "");
}

export interface PostAwardParseResult extends PostAwardSemanticModel {
  warnings: string[];
}

export async function parsePostAwardWorkbook(file: File): Promise<PostAwardParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetNames = workbook.SheetNames;
  const warnings: string[] = [];
  const notes: string[] = [];

  function required(logicalName: string, ...sheetNameCandidates: string[]): string | undefined {
    for (const candidate of sheetNameCandidates) {
      const hit = findSheet(sheetNames, candidate);
      if (hit) return hit;
    }
    warnings.push(`"${logicalName}" sheet not found (expected one of: ${sheetNameCandidates.join(" / ")}) — that section will show empty.`);
    return undefined;
  }

  // --- Project Information ---
  const projects: ProjectInfo[] = [];
  const piName = required("Project Information", "Project Information");
  if (piName) {
    for (const r of sheetRows(workbook, piName, 1)) {
      if (isBlankRow(r, [0])) continue;
      const amountOriginal: Partial<Record<PostAwardCurrency, number>> = {};
      if (num(r[9]) > 0) amountOriginal.EGP = num(r[9]);
      if (num(r[10]) > 0) amountOriginal.USD = num(r[10]);
      if (num(r[11]) > 0) amountOriginal.EUR = num(r[11]);
      if (num(r[12]) > 0) amountOriginal.SAR = num(r[12]);
      const amountRevised: Partial<Record<PostAwardCurrency, number>> = {};
      if (num(r[13]) > 0) amountRevised.EGP = num(r[13]);
      if (num(r[14]) > 0) amountRevised.USD = num(r[14]);
      if (num(r[15]) > 0) amountRevised.EUR = num(r[15]);
      if (num(r[16]) > 0) amountRevised.SAR = num(r[16]);
      projects.push({
        projectName: str(r[0]),
        status: str(r[1]),
        currency: currencyOrNull(r[2]),
        commencementOriginal: dateOrNull(r[3]),
        commencementRevised: dateOrNull(r[4]),
        durationOriginalMonths: numOrNull(r[5]),
        durationRevisedMonths: numOrNull(r[6]),
        completionOriginal: dateOrNull(r[7]),
        completionRevised: dateOrNull(r[8]),
        amountOriginal,
        amountRevised,
        ipcSubmissionFrequencyDays: numOrNull(r[17]),
        ownerEntity: str(r[18]),
        continent: str(r[19]),
        location1: str(r[20]),
        location2: str(r[21]),
        clientName: str(r[22]),
      });
    }
    if (projects.length === 0) warnings.push(`0 projects survived parsing "${piName}".`);
  }

  // --- Client Claim ---
  const clientClaims: ClientClaim[] = [];
  const ccName = required("Client Claim", " Client Claim", "Client Claim");
  if (ccName) {
    for (const r of sheetRows(workbook, ccName, 1)) {
      if (isBlankRow(r, [0])) continue;
      clientClaims.push({
        projectName: str(r[0]),
        claimDescription: str(r[1]),
        claimType: str(r[2]),
        submittedEot: numOrNull(r[3]),
        currency: currencyOrNull(r[4]),
        submittedTotalCost: num(r[5]),
        submittedDate: dateOrNull(r[6]),
        year: numOrNull(r[7]),
        status: str(r[8]),
        approvedTotalCost: numOrNull(r[9]),
        approvedEot: numOrNull(r[10]),
        approvedDate: dateOrNull(r[11]),
        note: str(r[12]),
        pendingAmount: num(r[13]),
      });
    }
    if (clientClaims.some((c) => c.claimType === "EOT")) {
      notes.push('Approved EOT is recorded as "settled" (text) on several rows instead of a day count — those rows are excluded from the Total Approved EOT Days KPI, not counted as 0.');
    }
  }

  // --- VO ---
  const variationOrders: VariationOrder[] = [];
  const voName = required("Variation Orders", "VO");
  if (voName) {
    for (const r of sheetRows(workbook, voName, 1)) {
      if (isBlankRow(r, [0])) continue;
      variationOrders.push({
        projectName: str(r[0]),
        submittedVoNo: numOrNull(r[1]),
        currency: currencyOrNull(r[2]),
        submittedTotalAmount: num(r[3]),
        approvedVoNo: numOrNull(r[4]),
        approvedTotalAmount: num(r[5]),
        pendingVoNo: numOrNull(r[6]),
        pendingAmount: num(r[7]),
        cancelRejectNo: numOrNull(r[8]),
        cancelRejectAmount: num(r[9]),
        totalOmission: num(r[10]),
      });
    }
  }

  // --- Invoice ---
  const invoices: InvoiceRecord[] = [];
  const invName = required("Invoices", "Invoice");
  if (invName) {
    for (const r of sheetRows(workbook, invName, 1)) {
      if (isBlankRow(r, [0])) continue;
      invoices.push({
        projectName: str(r[0]),
        invoiceNo: str(r[1]),
        currency: currencyOrNull(r[2]),
        grossSubmitted: num(r[3]),
        grossCertified: num(r[4]),
        netCertified: num(r[5]),
        paymentAmount: num(r[6]),
        totalDelayedPayments: num(r[7]),
        paymentDate: dateOrNull(r[8]),
        paymentContractualDurationDays: numOrNull(r[9]),
      });
    }
  }

  // --- HO TOC (Taking Over / DLC closeout) ---
  const tocDlc: TocDlcRecord[] = [];
  const tocName = required("TOC/DLC Closeout", "HO  TOC", "HO TOC");
  if (tocName) {
    for (const r of sheetRows(workbook, tocName, 1)) {
      if (isBlankRow(r, [0])) continue;
      tocDlc.push({
        projectName: str(r[0]),
        tocSubmittedDate: dateOrNull(r[1]),
        tocSubmittedAmount: numOrNull(r[2]),
        tocDate: dateOrNull(r[3]),
        status: str(r[4]),
        dlcDate: dateOrNull(r[5]),
        dlcStatus: str(r[6]),
        currency: currencyOrNull(r[7]),
      });
    }
  }

  // --- SC Claim (subcontractor claims against ROWAD) ---
  const scClaims: ScClaim[] = [];
  const scClaimName = required("Subcontractor Claims", "SC Claim");
  if (scClaimName) {
    for (const r of sheetRows(workbook, scClaimName, 1)) {
      if (isBlankRow(r, [0])) continue;
      scClaims.push({
        projectName: str(r[0]),
        subcontractorName: str(r[1]),
        claimDescription: str(r[2]),
        claimReceiptDate: dateOrNull(r[3]),
        amount: num(r[4]),
        action: str(r[5]),
        claimType: str(r[6]),
        actionDate: dateOrNull(r[7]),
        granted: str(r[8]),
        saving: numOrNull(r[9]),
        notes: str(r[10]),
      });
    }
  }

  // --- SC Draft 2025 ---
  const scDrafts: ScDraft[] = [];
  const scDraftName = required("Subcontract Drafts", "SC Draft 2025");
  if (scDraftName) {
    for (const r of sheetRows(workbook, scDraftName, 1)) {
      if (isBlankRow(r, [1])) continue;
      scDrafts.push({
        no: numOrNull(r[0]),
        projectName: str(r[1]),
        contractDate: dateOrNull(r[2]),
        contractYear: numOrNull(r[3]),
        contractType: str(r[4]),
        subcontractorName: str(r[5]),
        scopeOfWork: str(r[6]),
        currency: currencyOrNull(r[7]),
        contractValue: num(r[8]),
        status: str(r[9]),
        remarks: str(r[10]),
      });
    }
  }

  // --- Corresponences (letter volume) ---
  const correspondence: CorrespondenceRecord[] = [];
  const corrName = required("Correspondence", "Corresponences", "Correspondences");
  if (corrName) {
    for (const r of sheetRows(workbook, corrName, 1)) {
      if (isBlankRow(r, [0])) continue;
      correspondence.push({
        projectName: str(r[0]),
        mainContractLetters: num(r[1]),
        scName: str(r[2]),
        scLetters: num(r[3]),
        scName2: str(r[4]),
        scLetters2: num(r[5]),
      });
    }
  }

  // --- Special Agreements ---
  const specialAgreements: SpecialAgreement[] = [];
  const spName = required("Special Agreements", "Spicial Agreement  ", "Spicial Agreement", "Special Agreement");
  if (spName) {
    for (const r of sheetRows(workbook, spName, 1)) {
      if (isBlankRow(r, [0])) continue;
      specialAgreements.push({
        project: str(r[0]),
        agreement: str(r[1]),
        contractType: str(r[2]),
        parties: str(r[3]),
        status: str(r[4]),
      });
    }
  }

  // --- Subcontract Review 2025 ---
  const subcontractReviews: SubcontractReview[] = [];
  const reviewName = required("Subcontract Review", "Subcontract Review 2025");
  if (reviewName) {
    for (const r of sheetRows(workbook, reviewName, 1)) {
      if (isBlankRow(r, [2])) continue;
      subcontractReviews.push({
        no: numOrNull(r[0]),
        departmentName: str(r[1]),
        projectName: str(r[2]),
        dateReceived: dateOrNull(r[3]),
        month: str(r[4]),
        contractRef: str(r[5]),
        contractorName: str(r[6]),
        scopeOfWork: str(r[7]),
        amount: num(r[8]),
        outDate: dateOrNull(r[9]),
        reviewDurationDays: numOrNull(r[10]),
        rev1In: dateOrNull(r[11]),
        rev1Out: dateOrNull(r[12]),
        rev2In: dateOrNull(r[13]),
        rev2Out: dateOrNull(r[14]),
        rev3In: dateOrNull(r[15]),
        rev3Out: dateOrNull(r[16]),
        overBudgetValue: numOrNull(r[17]),
        overBudget: str(r[18]) || null,
        dollars: numOrNull(r[19]),
        euros: numOrNull(r[20]),
        sar: numOrNull(r[21]),
        note: str(r[22]),
      });
    }
    if (subcontractReviews.length > 0 && !subcontractReviews.some((r) => r.overBudget !== null || r.overBudgetValue !== null)) {
      notes.push('"Over Budget" / "Over Budget Value" columns on Subcontract Review are entirely empty in this snapshot (0 of ' + subcontractReviews.length + ' rows) — the Over-Budget KPI reads 0 because the data was never recorded, not because nothing was over budget.');
    }
  }

  // --- SubContract Agreement (signed register — template, frequently empty) ---
  const subcontractAgreements: SubcontractAgreement[] = [];
  const scaName = required("Subcontract Agreements", "SubContract Agreement ", "SubContract Agreement");
  if (scaName) {
    for (const r of sheetRows(workbook, scaName, 1)) {
      if (isBlankRow(r, [0])) continue;
      subcontractAgreements.push({
        project: str(r[0]),
        contractType: str(r[1]),
        contractSignYear: numOrNull(r[2]),
        status: str(r[3]),
        amountEGP: numOrNull(r[4]),
        amountSAR: numOrNull(r[5]),
        subcontractorName: str(r[6]),
      });
    }
    if (subcontractAgreements.length === 0) {
      notes.push('"Subcontract Agreement" register has no signed entries yet in this snapshot — sheet is a template awaiting data.');
    }
  }

  // --- Drob List -> per-project master register/rollup (2 header rows) ---
  const projectRegister: ProjectRegisterRow[] = [];
  const drobName = required("Project Register", "Drob List");
  if (drobName) {
    for (const r of sheetRows(workbook, drobName, 2)) {
      if (isBlankRow(r, [0])) continue;
      projectRegister.push({
        projectName: str(r[0]),
        status: str(r[1]),
        currency: currencyOrNull(r[2]),
        tocStatus: str(r[3]),
        dlcStatus: str(r[4]),
        scopeOfWork: str(r[5]),
        contractType: str(r[6]),
        scDraftStatus: str(r[7]),
        scClaimAction: str(r[8]),
        scClaimType: str(r[9]),
        specialAgreementStatus: str(r[10]),
        agreementContractType: str(r[11]),
        agreementName: str(r[12]),
        agreementDeptType: str(r[13]),
        departmentName: str(r[14]),
      });
    }
  }

  notes.push('"Drob List" is the source workbook\'s own consolidated per-project register, spanning status/TOC-DLC/SC-drafts/claims/special agreements — shown as-is, not recomputed.');
  notes.push("Post-Award amounts are never blended across currencies (EGP/USD/SAR/EUR), same rule as the Pre-Award report.");
  if (clientClaims.some((c) => c.currency === null)) {
    notes.push('Some Client Claim rows record currency as "-" (unspecified) — excluded from per-currency totals, counted separately.');
  }
  if (invoices.length > 0) {
    notes.push('Invoice "Gross Certified" vs "Net Certified" differ by 10-30x on several rows — not treated as a per-invoice retention figure (see Invoicing & Cashflow page note); both are shown as separate raw totals only.');
  }
  if (projects.length > 0) {
    notes.push("Duration/Value Revised columns on Project Information are sparsely populated and, on a few rows, repeat the identical figure across unrelated projects — treat revised-vs-original comparisons as directional, and verify against source for any single project before quoting externally.");
  }

  // --- Cross-sheet project-name integrity check ---
  // projectName is the only join key shared across all sheets — it drives
  // the Project/Owner-Entity filter (allowedProjectNames() in
  // usePostAwardStore.ts). A row whose name has no match in "Project
  // Information" (after applying the confirmed aliases in
  // utils/projectNameAliases.ts) still displays under "All Projects", but
  // silently disappears the instant a Project or Owner Entity filter is
  // applied — worth flagging per sheet rather than letting it look like a
  // filter bug.
  const knownProjectNames = new Set(projects.map((p) => p.projectName));
  function reportNameMismatches(sheetLabel: string, names: string[]) {
    const distinct = Array.from(new Set(names.filter((n) => n !== "")));
    const unmatched = distinct.filter((n) => !knownProjectNames.has(canonicalProjectName(n)));
    if (unmatched.length > 0) {
      notes.push(
        `${sheetLabel}: ${unmatched.length} of ${distinct.length} project names have no match in "Project Information" (e.g. ${unmatched.slice(0, 4).join(", ")}) — these rows vanish if you filter by Project or Owner Entity, though they still show under "All Projects".`,
      );
    }
  }
  reportNameMismatches("Client Claim", clientClaims.map((c) => c.projectName));
  reportNameMismatches("Special Agreements", specialAgreements.map((s) => s.project));
  reportNameMismatches("Subcontract Review 2025", subcontractReviews.map((r) => r.projectName));
  reportNameMismatches("Drob List (Project Register)", projectRegister.map((r) => r.projectName));

  return {
    projects,
    clientClaims,
    variationOrders,
    invoices,
    tocDlc,
    scClaims,
    scDrafts,
    correspondence,
    specialAgreements,
    subcontractReviews,
    subcontractAgreements,
    projectRegister,
    dataQualityNotes: notes,
    warnings,
  };
}
