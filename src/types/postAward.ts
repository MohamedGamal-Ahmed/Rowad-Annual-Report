// ROWAD Post-Award BI — Semantic Model Types
// Source workbook: "Ongoing Report Annual Report-2025" — a raw operational
// tracking book (11 real data sheets + 1 dropdown/rollup sheet), NOT a
// pre-cleaned star schema like the Pre-Award model. Each interface below
// mirrors one source sheet 1:1; the parser (postAwardExcelParser.ts) is
// responsible for cleaning/normalizing, this file just names the shape.

/** Post-Award workbook only uses 4 currencies (no CFA, unlike Pre-Award). */
export type PostAwardCurrency = "EGP" | "USD" | "SAR" | "EUR";

export const POST_AWARD_CURRENCY_ORDER: PostAwardCurrency[] = ["EGP", "USD", "SAR", "EUR"];

/** Fact_ProjectInfo — one row per project, the contract-level master record.
 * Source sheet: "Project Information". */
export interface ProjectInfo {
  projectName: string;
  status: string; // "Ongoing" | "Pending DLC" | "Completed" (as recorded — never re-derived)
  currency: PostAwardCurrency | null;
  commencementOriginal: Date | null;
  commencementRevised: Date | null;
  durationOriginalMonths: number | null;
  durationRevisedMonths: number | null;
  completionOriginal: Date | null;
  completionRevised: Date | null;
  amountOriginal: Partial<Record<PostAwardCurrency, number>>;
  amountRevised: Partial<Record<PostAwardCurrency, number>>;
  ipcSubmissionFrequencyDays: number | null;
  ownerEntity: string; // Private / Semi Governmental / Governmental / Army
  continent: string;
  location1: string;
  location2: string;
  clientName: string;
}

/** Fact_ClientClaims — claims raised against the client (EOT, escalation,
 * prolongation, cost, suspension). Source sheet: " Client Claim". */
export interface ClientClaim {
  projectName: string;
  claimDescription: string;
  claimType: string; // Escalation | EOT | Prolongation | Cost Claim | Cost Else | Suspension
  /** Days claimed — numeric on most rows; null when unrecorded or non-numeric
   * (e.g. a stray "-"). Only meaningful for claimType === "EOT" rows. */
  submittedEot: number | null;
  currency: PostAwardCurrency | null;
  submittedTotalCost: number;
  submittedDate: Date | null;
  year: number | null;
  status: string; // Pending | Approved | Rejected | Settled
  approvedTotalCost: number | null;
  /** Days approved — numeric on most rows; null when unrecorded or when the
   * sheet records "settled" instead of a day count. */
  approvedEot: number | null;
  approvedDate: Date | null;
  note: string;
  pendingAmount: number;
}

/** Fact_VO — Variation Orders. Source sheet: "VO". */
export interface VariationOrder {
  projectName: string;
  submittedVoNo: number | null;
  currency: PostAwardCurrency | null;
  submittedTotalAmount: number;
  approvedVoNo: number | null;
  approvedTotalAmount: number;
  pendingVoNo: number | null;
  pendingAmount: number;
  cancelRejectNo: number | null;
  cancelRejectAmount: number;
  totalOmission: number;
}

/** Fact_Invoice — IPC/invoice cycle: submitted -> certified -> paid, with
 * delay tracking. Source sheet: "Invoice". */
export interface InvoiceRecord {
  projectName: string;
  invoiceNo: string;
  currency: PostAwardCurrency | null;
  grossSubmitted: number;
  grossCertified: number;
  netCertified: number;
  paymentAmount: number;
  totalDelayedPayments: number;
  paymentDate: Date | null;
  paymentContractualDurationDays: number | null;
}

/** Fact_TocDlc — Taking-Over / Defects Liability Certificate close-out
 * tracking. Source sheet: "HO  TOC". */
export interface TocDlcRecord {
  projectName: string;
  tocSubmittedDate: Date | null;
  tocSubmittedAmount: number | null;
  tocDate: Date | null;
  status: string; // Not Due | pending | Partial | Issued | Approved
  dlcDate: Date | null;
  dlcStatus: string; // Not Due | Pending
  currency: PostAwardCurrency | null;
}

/** Fact_ScClaim — subcontractor-raised claims against ROWAD. Source sheet:
 * "SC Claim". */
export interface ScClaim {
  projectName: string;
  subcontractorName: string;
  claimDescription: string;
  claimReceiptDate: Date | null;
  amount: number;
  action: string; // e.g. Invalidated
  claimType: string;
  actionDate: Date | null;
  granted: string;
  saving: number | null;
  notes: string;
}

/** Fact_ScDraft — subcontract drafts issued in the reporting year. Source
 * sheet: "SC Draft 2025". */
export interface ScDraft {
  no: number | null;
  projectName: string;
  contractDate: Date | null;
  contractYear: number | null;
  contractType: string;
  subcontractorName: string;
  scopeOfWork: string;
  currency: PostAwardCurrency | null;
  contractValue: number;
  status: string;
  remarks: string;
}

/** Fact_Correspondence — letter-volume tracking, main contract vs up to two
 * subcontractors. Source sheet: "Corresponences". */
export interface CorrespondenceRecord {
  projectName: string;
  mainContractLetters: number;
  scName: string;
  scLetters: number;
  scName2: string;
  scLetters2: number;
}

/** Fact_SpecialAgreement — JV/Novation/Consortium/Settlement agreements.
 * Source sheet: "Spicial Agreement  " (name kept from source; trimmed on
 * lookup). */
export interface SpecialAgreement {
  project: string;
  agreement: string;
  contractType: string; // JV | Novation | Settlement | Consultancy | ...
  parties: string;
  status: string; // Signed | Under Signature | Suspended
}

/** Fact_SubcontractReview — subcontract package review turnaround (in/out
 * dates across up to 3 revision cycles) and over-budget flags. Source sheet:
 * "Subcontract Review 2025". */
export interface SubcontractReview {
  no: number | null;
  departmentName: string;
  projectName: string;
  dateReceived: Date | null;
  month: string;
  contractRef: string;
  contractorName: string;
  scopeOfWork: string;
  amount: number;
  outDate: Date | null;
  reviewDurationDays: number | null;
  rev1In: Date | null;
  rev1Out: Date | null;
  rev2In: Date | null;
  rev2Out: Date | null;
  rev3In: Date | null;
  rev3Out: Date | null;
  overBudgetValue: number | null;
  overBudget: string | null;
  dollars: number | null;
  euros: number | null;
  sar: number | null;
  note: string; // approval outcome, e.g. "Approved", "Correction required"
}

/** Fact_SubcontractAgreement — signed subcontract agreement register.
 * Source sheet: "SubContract Agreement " (template — frequently empty in
 * practice; handled as a graceful empty state, not an error). */
export interface SubcontractAgreement {
  project: string;
  contractType: string;
  contractSignYear: number | null;
  status: string;
  amountEGP: number | null;
  amountSAR: number | null;
  subcontractorName: string;
}

/** Dim_ProjectRegister — the workbook's own per-project rollup across every
 * other sheet (status, TOC/DLC, SC drafts, claims action, special agreement,
 * department). Source sheet: "Drob List". Treated as a read-only master
 * register/cross-reference table, not re-derived — it already reflects the
 * workbook owner's own consolidation. */
export interface ProjectRegisterRow {
  projectName: string;
  status: string;
  currency: PostAwardCurrency | null;
  tocStatus: string;
  dlcStatus: string;
  scopeOfWork: string;
  contractType: string;
  scDraftStatus: string;
  scClaimAction: string;
  scClaimType: string;
  specialAgreementStatus: string;
  agreementContractType: string;
  agreementName: string;
  agreementDeptType: string;
  departmentName: string;
}

export interface PostAwardSemanticModel {
  projects: ProjectInfo[];
  clientClaims: ClientClaim[];
  variationOrders: VariationOrder[];
  invoices: InvoiceRecord[];
  tocDlc: TocDlcRecord[];
  scClaims: ScClaim[];
  scDrafts: ScDraft[];
  correspondence: CorrespondenceRecord[];
  specialAgreements: SpecialAgreement[];
  subcontractReviews: SubcontractReview[];
  subcontractAgreements: SubcontractAgreement[];
  projectRegister: ProjectRegisterRow[];
  dataQualityNotes: string[];
}

export interface PostAwardFilters {
  project: string | null;
  ownerEntity: string | null;
  status: string | null;
  /** null = "All" — every currency shown separately, never blended, same
   * rule as the Pre-Award report. */
  currency: PostAwardCurrency | null;
}
