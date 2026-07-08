import type {
  ClientClaim,
  CorrespondenceRecord,
  InvoiceRecord,
  PostAwardCurrency,
  ProjectInfo,
  ScClaim,
  ScDraft,
  SpecialAgreement,
  SubcontractReview,
  TocDlcRecord,
  VariationOrder,
} from "../types/postAward";
import { POST_AWARD_CURRENCY_ORDER } from "../types/postAward";

// ============================================================
// Currency-safe aggregation — same rule as the Pre-Award report: amounts
// are NEVER summed across currencies. Every aggregator below returns a
// per-currency breakdown; picking one currency to display is the caller's
// (page's) job, driven by the Currency filter.
// ============================================================
export function sumByCurrency<T>(
  rows: T[],
  getCurrency: (r: T) => PostAwardCurrency | null,
  getValue: (r: T) => number,
): Partial<Record<PostAwardCurrency, number>> {
  const out: Partial<Record<PostAwardCurrency, number>> = {};
  for (const r of rows) {
    const c = getCurrency(r);
    if (!c) continue;
    const v = getValue(r);
    if (!v) continue;
    out[c] = (out[c] ?? 0) + v;
  }
  return out;
}

export function formatCompact(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)}K`;
  return `${sign}${abs.toFixed(0)}`;
}

export function formatAmountsBreakdown(amounts: Partial<Record<PostAwardCurrency, number>>): string {
  const parts = POST_AWARD_CURRENCY_ORDER.filter((c) => (amounts[c] ?? 0) !== 0).map(
    (c) => `${c} ${formatCompact(amounts[c] as number)}`,
  );
  return parts.length > 0 ? parts.join(", ") : "No value recorded";
}

export function countBy<T>(rows: T[], key: (r: T) => string): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const k = key(r) || "Unspecified";
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

/** Attach a share-of-total `pct` to a countBy() result so it can feed
 * HorizontalBarList directly (label/count/pct). */
export function toBarRows(counts: { label: string; count: number }[]): { label: string; count: number; pct: number }[] {
  const total = counts.reduce((s, c) => s + c.count, 0);
  return counts.map((c) => ({ ...c, pct: total === 0 ? 0 : c.count / total }));
}

// ============================================================
// Portfolio Overview (Project Information)
// ============================================================
export function projectStatusCounts(projects: ProjectInfo[]): { label: string; count: number }[] {
  return countBy(projects, (p) => p.status);
}

export function ongoingCount(projects: ProjectInfo[]): number {
  return projects.filter((p) => /ongoing/i.test(p.status)).length;
}

export function contractValueOriginal(projects: ProjectInfo[]): Partial<Record<PostAwardCurrency, number>> {
  const out: Partial<Record<PostAwardCurrency, number>> = {};
  for (const p of projects) {
    for (const c of POST_AWARD_CURRENCY_ORDER) {
      const v = p.amountOriginal[c];
      if (v) out[c] = (out[c] ?? 0) + v;
    }
  }
  return out;
}

export function contractValueRevised(projects: ProjectInfo[]): Partial<Record<PostAwardCurrency, number>> {
  const out: Partial<Record<PostAwardCurrency, number>> = {};
  for (const p of projects) {
    for (const c of POST_AWARD_CURRENCY_ORDER) {
      const v = p.amountRevised[c];
      if (v) out[c] = (out[c] ?? 0) + v;
    }
  }
  return out;
}

/** Revised - Original, per currency, only where a revised figure exists at
 * all (revised sheet cells are 0/blank for most projects — no variance to
 * report there, not a -100% swing to 0). */
export function contractValueVariance(projects: ProjectInfo[]): Partial<Record<PostAwardCurrency, number>> {
  const out: Partial<Record<PostAwardCurrency, number>> = {};
  for (const p of projects) {
    for (const c of POST_AWARD_CURRENCY_ORDER) {
      const rev = p.amountRevised[c];
      const orig = p.amountOriginal[c];
      if (rev !== undefined && orig !== undefined) out[c] = (out[c] ?? 0) + (rev - orig);
    }
  }
  return out;
}

export function projectsByOwnerEntity(projects: ProjectInfo[]): { label: string; count: number }[] {
  return countBy(projects, (p) => p.ownerEntity);
}

export function projectsByContinent(projects: ProjectInfo[]): { label: string; count: number }[] {
  return countBy(projects, (p) => p.continent);
}

export interface DurationSlippage {
  projectName: string;
  originalMonths: number;
  revisedMonths: number;
  deltaMonths: number;
}

/** Projects where a revised duration was recorded AND it actually differs
 * from the original (not just "a revised value exists" — some rows carry
 * the same figure in both columns, which is not a real schedule change).
 * This is the concrete EOT-impact signal: duration slippage, in months. */
export function durationSlippageProjects(projects: ProjectInfo[]): DurationSlippage[] {
  return projects
    .filter((p) => p.durationOriginalMonths !== null && p.durationRevisedMonths !== null && p.durationOriginalMonths !== p.durationRevisedMonths)
    .map((p) => ({
      projectName: p.projectName,
      originalMonths: p.durationOriginalMonths as number,
      revisedMonths: p.durationRevisedMonths as number,
      deltaMonths: (p.durationRevisedMonths as number) - (p.durationOriginalMonths as number),
    }))
    .sort((a, b) => b.deltaMonths - a.deltaMonths);
}

export interface ValueVariance {
  projectName: string;
  currency: PostAwardCurrency;
  original: number;
  revised: number;
  deltaPct: number;
}

/** Projects where the revised contract value (in the project's own
 * recorded currency) actually differs from the original — the value-impact
 * counterpart to durationSlippageProjects. Never compares across
 * currencies: each row uses only that project's single recorded currency. */
export function valueVarianceProjects(projects: ProjectInfo[]): ValueVariance[] {
  const out: ValueVariance[] = [];
  for (const p of projects) {
    if (!p.currency) continue;
    const orig = p.amountOriginal[p.currency] ?? 0;
    const rev = p.amountRevised[p.currency];
    if (rev === undefined || rev === orig || orig === 0) continue;
    out.push({ projectName: p.projectName, currency: p.currency, original: orig, revised: rev, deltaPct: (rev - orig) / orig });
  }
  return out.sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct));
}

// ============================================================
// Claims & Variation Orders
// ============================================================
export function claimsByStatus(claims: ClientClaim[]): { label: string; count: number }[] {
  return countBy(claims, (c) => c.status);
}

export function claimsByType(claims: ClientClaim[]): { label: string; count: number }[] {
  return countBy(claims, (c) => c.claimType);
}

export function pendingClaimAmountByCurrency(claims: ClientClaim[]): Partial<Record<PostAwardCurrency, number>> {
  return sumByCurrency(claims, (c) => c.currency, (c) => c.pendingAmount);
}

export function submittedClaimAmountByCurrency(claims: ClientClaim[]): Partial<Record<PostAwardCurrency, number>> {
  return sumByCurrency(claims, (c) => c.currency, (c) => c.submittedTotalCost);
}

export function approvedClaimAmountByCurrency(claims: ClientClaim[]): Partial<Record<PostAwardCurrency, number>> {
  return sumByCurrency(claims, (c) => c.currency, (c) => c.approvedTotalCost ?? 0);
}

/** Claims resolved as Approved or Settled, as a share of ALL claims
 * (including still-Pending ones) — the headline approval-rate KPI. Rejected
 * claims count against the rate (they are a resolved, unfavorable
 * outcome), Pending claims count against it too (not yet a win). */
export function claimsApprovalRate(claims: ClientClaim[]): number {
  if (claims.length === 0) return 0;
  const won = claims.filter((c) => /^approved$|^settled$/i.test(c.status)).length;
  return won / claims.length;
}

/** Average calendar days from Submitted Date to Approved Date, for claims
 * where both are recorded. Most claims are still Pending (no approved
 * date yet), so this average is necessarily computed over a subset —
 * callers should show the sample size alongside the average. */
export function claimsCycleTimeAvgDays(claims: ClientClaim[]): { avgDays: number; sampleSize: number } {
  const withBoth = claims.filter((c) => c.submittedDate && c.approvedDate);
  if (withBoth.length === 0) return { avgDays: 0, sampleSize: 0 };
  const totalDays = withBoth.reduce((sum, c) => {
    const days = (c.approvedDate!.getTime() - c.submittedDate!.getTime()) / (1000 * 60 * 60 * 24);
    return sum + Math.max(0, days);
  }, 0);
  return { avgDays: totalDays / withBoth.length, sampleSize: withBoth.length };
}

export function topProjectsByPendingClaim(claims: ClientClaim[], limit = 6): { project: string; amounts: Partial<Record<PostAwardCurrency, number>>; total: number }[] {
  const byProject = new Map<string, ClientClaim[]>();
  for (const c of claims) {
    const arr = byProject.get(c.projectName) ?? [];
    arr.push(c);
    byProject.set(c.projectName, arr);
  }
  return Array.from(byProject.entries())
    .map(([project, rows]) => {
      const amounts = sumByCurrency(rows, (c) => c.currency, (c) => c.pendingAmount);
      const total = Object.values(amounts).reduce((s, v) => s + (v ?? 0), 0);
      return { project, amounts, total };
    })
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

/** Total EOT days claimed/approved across all EOT-type claims. Only rows
 * where the sheet recorded an actual day count are included — rows marked
 * "settled" or "-" are excluded from both the sum and the sample size, not
 * counted as 0 days. */
export function totalSubmittedEotDays(claims: ClientClaim[]): { totalDays: number; sampleSize: number } {
  const withDays = claims.filter((c) => c.submittedEot !== null);
  return { totalDays: withDays.reduce((s, c) => s + (c.submittedEot ?? 0), 0), sampleSize: withDays.length };
}

export function totalApprovedEotDays(claims: ClientClaim[]): { totalDays: number; sampleSize: number } {
  const withDays = claims.filter((c) => c.approvedEot !== null);
  return { totalDays: withDays.reduce((s, c) => s + (c.approvedEot ?? 0), 0), sampleSize: withDays.length };
}

export interface ClaimTypeCurrencyBreakdown {
  claimType: string;
  currency: PostAwardCurrency;
  submitted: number;
  approved: number;
  pending: number;
}

/** Submitted / Approved / Pending amount per claim type, broken out per
 * currency (never blended) — mirrors last year's report, which shows each
 * claim type (Prolongation, Cost Else, Escalation, ...) as its own
 * per-currency bars rather than one aggregate "Claims by Type" count. Rows
 * with 0 in all three amount fields are dropped (nothing to show). */
export function claimsByTypeCurrencyBreakdown(claims: ClientClaim[]): ClaimTypeCurrencyBreakdown[] {
  const map = new Map<string, ClaimTypeCurrencyBreakdown>();
  for (const c of claims) {
    if (!c.currency) continue;
    const key = `${c.claimType}|${c.currency}`;
    const entry = map.get(key) ?? { claimType: c.claimType, currency: c.currency, submitted: 0, approved: 0, pending: 0 };
    entry.submitted += c.submittedTotalCost || 0;
    entry.approved += c.approvedTotalCost ?? 0;
    entry.pending += c.pendingAmount || 0;
    map.set(key, entry);
  }
  return Array.from(map.values())
    .filter((r) => r.submitted !== 0 || r.approved !== 0 || r.pending !== 0)
    .sort((a, b) => a.claimType.localeCompare(b.claimType) || a.currency.localeCompare(b.currency));
}

export function voSubmittedByCurrency(vos: VariationOrder[]): Partial<Record<PostAwardCurrency, number>> {
  return sumByCurrency(vos, (v) => v.currency, (v) => v.submittedTotalAmount);
}

export function voApprovedByCurrency(vos: VariationOrder[]): Partial<Record<PostAwardCurrency, number>> {
  return sumByCurrency(vos, (v) => v.currency, (v) => v.approvedTotalAmount);
}

export function voPendingByCurrency(vos: VariationOrder[]): Partial<Record<PostAwardCurrency, number>> {
  return sumByCurrency(vos, (v) => v.currency, (v) => v.pendingAmount);
}

/** Record count (not amount) of pending VOs per currency — feeds the
 * VO Pending donut, which sizes slices by count so it never blends money
 * across currencies. */
export function voPendingCountByCurrency(vos: VariationOrder[]): Partial<Record<PostAwardCurrency, number>> {
  const out: Partial<Record<PostAwardCurrency, number>> = {};
  for (const v of vos) {
    if (!v.currency || !(v.pendingAmount > 0)) continue;
    out[v.currency] = (out[v.currency] ?? 0) + 1;
  }
  return out;
}

export function voCancelledByCurrency(vos: VariationOrder[]): Partial<Record<PostAwardCurrency, number>> {
  return sumByCurrency(vos, (v) => v.currency, (v) => v.cancelRejectAmount);
}

export function voOmissionByCurrency(vos: VariationOrder[]): Partial<Record<PostAwardCurrency, number>> {
  return sumByCurrency(vos, (v) => v.currency, (v) => v.totalOmission);
}

/** The "No." columns on the VO sheet are themselves COUNTS of variation
 * orders per project/status (e.g. "Submitted VO No. = 2" means 2 VOs were
 * submitted for that project) — not identifiers. Summing them gives the
 * real VO counts by stage, which the amount-only KPIs never surfaced. */
export function voSubmittedCountTotal(vos: VariationOrder[]): number {
  return vos.reduce((s, v) => s + (v.submittedVoNo ?? 0), 0);
}

export function voApprovedCountTotal(vos: VariationOrder[]): number {
  return vos.reduce((s, v) => s + (v.approvedVoNo ?? 0), 0);
}

export function voPendingCountTotal(vos: VariationOrder[]): number {
  return vos.reduce((s, v) => s + (v.pendingVoNo ?? 0), 0);
}

export function voCancelledCountTotal(vos: VariationOrder[]): number {
  return vos.reduce((s, v) => s + (v.cancelRejectNo ?? 0), 0);
}

/** Approved VO count / Submitted VO count. Distinct from the amount-based
 * KPIs — a project can have more submitted VOs than approved simply
 * because some are still pending or were rejected, independent of value. */
export function voApprovalRate(vos: VariationOrder[]): number {
  const submitted = voSubmittedCountTotal(vos);
  return submitted === 0 ? 0 : voApprovedCountTotal(vos) / submitted;
}

// ============================================================
// Invoicing & Cashflow
// ============================================================
export function invoiceGrossSubmittedByCurrency(invoices: InvoiceRecord[]): Partial<Record<PostAwardCurrency, number>> {
  return sumByCurrency(invoices, (i) => i.currency, (i) => i.grossSubmitted);
}

export function invoiceGrossCertifiedByCurrency(invoices: InvoiceRecord[]): Partial<Record<PostAwardCurrency, number>> {
  return sumByCurrency(invoices, (i) => i.currency, (i) => i.grossCertified);
}

export function invoicePaidByCurrency(invoices: InvoiceRecord[]): Partial<Record<PostAwardCurrency, number>> {
  return sumByCurrency(invoices, (i) => i.currency, (i) => i.paymentAmount);
}

export function invoiceDelayedByCurrency(invoices: InvoiceRecord[]): Partial<Record<PostAwardCurrency, number>> {
  return sumByCurrency(invoices, (i) => i.currency, (i) => i.totalDelayedPayments);
}

export function invoicesWithDelayCount(invoices: InvoiceRecord[]): number {
  return invoices.filter((i) => i.totalDelayedPayments > 0).length;
}

export function invoiceNetCertifiedByCurrency(invoices: InvoiceRecord[]): Partial<Record<PostAwardCurrency, number>> {
  return sumByCurrency(invoices, (i) => i.currency, (i) => i.netCertified);
}

// NOTE: A "Gross Certified - Net Certified = retention deduction" KPI was
// considered here and deliberately dropped after verification against the
// real workbook: for several rows (e.g. EGAT Projects: gross 1.74B vs net
// 53M EGP) the gap is 30-40x, far beyond any plausible retention rate —
// meaning Gross and Net Certified are not reliably comparable at the
// per-row level in this sheet (likely cumulative-to-date vs per-IPC
// figures, or another mismatch). Showing both raw columns (see
// invoiceGrossCertifiedByCurrency / invoiceNetCertifiedByCurrency) is
// honest; subtracting them is not.

/** How many invoices actually record a Payment Date — this workbook has
 * that field populated for a minority of rows, so any "payment aging"
 * figure must be read alongside this coverage count, not presented as if
 * it covers the whole register. */
export function invoicesWithPaymentDateCount(invoices: InvoiceRecord[]): number {
  return invoices.filter((i) => i.paymentDate !== null).length;
}

export function avgPaymentContractualDurationDays(invoices: InvoiceRecord[]): { avgDays: number; sampleSize: number } {
  const withDuration = invoices.filter((i) => i.paymentContractualDurationDays !== null);
  if (withDuration.length === 0) return { avgDays: 0, sampleSize: 0 };
  const total = withDuration.reduce((s, i) => s + (i.paymentContractualDurationDays ?? 0), 0);
  return { avgDays: total / withDuration.length, sampleSize: withDuration.length };
}

export function topDelayedProjects(invoices: InvoiceRecord[], limit = 6): { project: string; amounts: Partial<Record<PostAwardCurrency, number>>; total: number }[] {
  const byProject = new Map<string, InvoiceRecord[]>();
  for (const inv of invoices) {
    const arr = byProject.get(inv.projectName) ?? [];
    arr.push(inv);
    byProject.set(inv.projectName, arr);
  }
  return Array.from(byProject.entries())
    .map(([project, rows]) => {
      const amounts = sumByCurrency(rows, (i) => i.currency, (i) => i.totalDelayedPayments);
      const total = Object.values(amounts).reduce((s, v) => s + (v ?? 0), 0);
      return { project, amounts, total };
    })
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

// ============================================================
// TOC / DLC Closeout
// ============================================================
export function tocStatusCounts(rows: TocDlcRecord[]): { label: string; count: number }[] {
  return countBy(rows, (r) => r.status);
}

export function dlcStatusCounts(rows: TocDlcRecord[]): { label: string; count: number }[] {
  return countBy(rows, (r) => r.dlcStatus);
}

export function closedOutCount(rows: TocDlcRecord[]): number {
  return rows.filter((r) => /approved|issued/i.test(r.status)).length;
}

export function pendingCloseoutProjects(rows: TocDlcRecord[]): TocDlcRecord[] {
  return rows.filter((r) => !/not due/i.test(r.status) && !/approved|issued/i.test(r.status));
}

/** Count of projects where a TOC has actually been submitted (date on
 * file) — a small subset of the register, since most projects are still
 * "Not Due". Read alongside closedOutCount, which is the approval outcome
 * rather than the submission event. */
export function tocSubmittedCount(rows: TocDlcRecord[]): number {
  return rows.filter((r) => r.tocSubmittedDate !== null).length;
}

export function tocSubmittedAmountByCurrency(rows: TocDlcRecord[]): Partial<Record<PostAwardCurrency, number>> {
  return sumByCurrency(rows, (r) => r.currency, (r) => r.tocSubmittedAmount ?? 0);
}

// ============================================================
// Subcontractor Management (SC Claims, SC Drafts, Subcontract Review, SC Agreements)
// ============================================================
export function scClaimActionCounts(rows: ScClaim[]): { label: string; count: number }[] {
  return countBy(rows, (r) => r.action);
}

export function scClaimTotalAmount(rows: ScClaim[]): number {
  return rows.reduce((sum, r) => sum + r.amount, 0);
}

export function scClaimTotalSaving(rows: ScClaim[]): number {
  return rows.reduce((sum, r) => sum + (r.saving ?? 0), 0);
}

export function scDraftStatusCounts(rows: ScDraft[]): { label: string; count: number }[] {
  return countBy(rows, (r) => r.status);
}

export function scDraftValueByCurrency(rows: ScDraft[]): Partial<Record<PostAwardCurrency, number>> {
  return sumByCurrency(rows, (r) => r.currency, (r) => r.contractValue);
}

export function reviewOutcomeCounts(rows: SubcontractReview[]): { label: string; count: number }[] {
  return countBy(rows, (r) => r.note);
}

export function avgReviewDurationDays(rows: SubcontractReview[]): number {
  const withDuration = rows.filter((r) => r.reviewDurationDays !== null);
  if (withDuration.length === 0) return 0;
  return withDuration.reduce((s, r) => s + (r.reviewDurationDays ?? 0), 0) / withDuration.length;
}

export function overBudgetCount(rows: SubcontractReview[]): number {
  return rows.filter((r) => r.overBudget && !/^n\/?a$/i.test(r.overBudget)).length;
}

export function overBudgetTotalValue(rows: SubcontractReview[]): number {
  return rows.reduce((s, r) => s + (r.overBudgetValue ?? 0), 0);
}

/** Whether the Over Budget column has ANY data at all in this workbook.
 * On the reference "Ongoing Report Annual Report-2025" file it is 0/79
 * populated — completely empty, not "zero over-budget packages". The UI
 * must show that distinction explicitly rather than rendering a bare 0,
 * which would misleadingly read as a clean bill of health. */
export function overBudgetDataPopulated(rows: SubcontractReview[]): boolean {
  return rows.some((r) => r.overBudget !== null || r.overBudgetValue !== null);
}

export function reviewsByDepartment(rows: SubcontractReview[]): { label: string; count: number }[] {
  return countBy(rows, (r) => r.departmentName);
}

export interface ReviewDepartmentCurrencyRow {
  department: string;
  EGP: number;
  USD: number;
  EUR: number;
  SAR: number;
}

/** Reviewed subcontract amount per department, broken out per currency —
 * mirrors last year's report's Department x Currency table. `amount` is
 * this sheet's base (EGP-denominated) figure; `dollars`/`euros`/`sar` are
 * the sheet's own supplementary columns for packages reviewed in those
 * currencies. Summed independently per column, never blended, consistent
 * with the rest of this model. Includes a synthetic "Total" row. */
export function reviewAmountByDepartmentCurrency(rows: SubcontractReview[]): ReviewDepartmentCurrencyRow[] {
  const map = new Map<string, ReviewDepartmentCurrencyRow>();
  for (const r of rows) {
    const dept = r.departmentName || "Unassigned";
    const entry = map.get(dept) ?? { department: dept, EGP: 0, USD: 0, EUR: 0, SAR: 0 };
    entry.EGP += r.amount || 0;
    entry.USD += r.dollars ?? 0;
    entry.EUR += r.euros ?? 0;
    entry.SAR += r.sar ?? 0;
    map.set(dept, entry);
  }
  const out = Array.from(map.values()).sort((a, b) => b.EGP - a.EGP);
  const total: ReviewDepartmentCurrencyRow = { department: "Total", EGP: 0, USD: 0, EUR: 0, SAR: 0 };
  for (const r of out) {
    total.EGP += r.EGP;
    total.USD += r.USD;
    total.EUR += r.EUR;
    total.SAR += r.SAR;
  }
  return [...out, total];
}

export interface RevisionCycleCounts {
  rev1Only: number;
  rev2: number;
  rev3: number;
}

/** How many packages needed only 1 review cycle vs required a 2nd/3rd
 * round — a rework indicator the Review Duration average alone doesn't
 * show. Based on which Rev-in dates are actually populated (a package
 * that reached Rev.2 (in) needed a second pass, etc.). */
export function revisionCycleCounts(rows: SubcontractReview[]): RevisionCycleCounts {
  let rev1Only = 0;
  let rev2 = 0;
  let rev3 = 0;
  for (const r of rows) {
    if (r.rev3In) rev3++;
    else if (r.rev2In) rev2++;
    else rev1Only++;
  }
  return { rev1Only, rev2, rev3 };
}

/** Bucket boundaries verified against the real workbook: every recorded
 * Review Duration Days value in the reference snapshot is 1-5 days (max
 * observed = 5) — a wider 0-30+ scheme (as first drafted) would show 4 of
 * 5 buckets permanently empty. Day-by-day buckets plus a "6d+" catch-all
 * keep this meaningful if a future upload has a wider spread. */
const REVIEW_DURATION_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: "1d", min: 1, max: 1 },
  { label: "2d", min: 2, max: 2 },
  { label: "3d", min: 3, max: 3 },
  { label: "4d", min: 4, max: 4 },
  { label: "5d", min: 5, max: 5 },
  { label: "6d+", min: 6, max: Infinity },
];

/** Distribution of Review Duration Days across fixed buckets — this field
 * is well populated (79/80 rows), so unlike most Subcontractor Management
 * metrics this one supports a real histogram, not just an average. */
export function reviewDurationBuckets(rows: SubcontractReview[]): { label: string; count: number }[] {
  const withDuration = rows.filter((r) => r.reviewDurationDays !== null);
  return REVIEW_DURATION_BUCKETS.map((bucket) => ({
    label: bucket.label,
    count: withDuration.filter((r) => (r.reviewDurationDays ?? 0) >= bucket.min && (r.reviewDurationDays ?? 0) <= bucket.max).length,
  }));
}

// ============================================================
// Special Agreements
// ============================================================
export function agreementStatusCounts(rows: SpecialAgreement[]): { label: string; count: number }[] {
  return countBy(rows, (r) => r.status);
}

export function agreementTypeCounts(rows: SpecialAgreement[]): { label: string; count: number }[] {
  return countBy(rows, (r) => r.contractType);
}

// ============================================================
// Correspondence
// ============================================================
export function totalMainContractLetters(rows: CorrespondenceRecord[]): number {
  return rows.reduce((s, r) => s + r.mainContractLetters, 0);
}

export function totalSubcontractorLetters(rows: CorrespondenceRecord[]): number {
  return rows.reduce((s, r) => s + r.scLetters + r.scLetters2, 0);
}

/** Main + both subcontractor letter columns, summed across every tracked
 * project — the single headline "Total Correspondence Issued" figure last
 * year's report leads with, in addition to the Main/Subcontractor split. */
export function totalCorrespondenceIssued(rows: CorrespondenceRecord[]): number {
  return rows.reduce((s, r) => s + r.mainContractLetters + r.scLetters + r.scLetters2, 0);
}

export function topProjectsByLetterVolume(rows: CorrespondenceRecord[], limit = 8): { project: string; total: number }[] {
  return rows
    .map((r) => ({ project: r.projectName, total: r.mainContractLetters + r.scLetters + r.scLetters2 }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}
