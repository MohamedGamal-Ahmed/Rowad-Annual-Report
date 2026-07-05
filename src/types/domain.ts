// ROWAD Pre-Award BI — Semantic Model Types
// Mirrors the star schema validated in the Power BI prototype (Fact_Opportunities,
// Fact_Opp_Currency, Dim_Assignee, Dim_Country, Fact_Agreements).

export type Currency = "EGP" | "USD" | "SAR" | "EURO" | "CFA";

export const CURRENCY_SORT_ORDER: Currency[] = ["EGP", "USD", "SAR", "EURO", "CFA"];

export interface Opportunity {
  projectCode: string;
  projectName: string;
  country: string;
  assignee: string; // cleaned per approved business rule
  assigneeRaw: string;
  status: string; // BR-002: kept as source of truth, never derived
  flagContractQualifications: 0 | 1;
  flagRiskAssessment: 0 | 1;
  flagContractSummary: 0 | 1;
  flagNegotiation: 0 | 1;
  flagAward: 0 | 1;
  amounts: Partial<Record<Currency, number>>; // only non-zero currencies present
}

export interface AgreementRecord {
  sr: number;
  projectName: string;
  agreementType: string; // raw sub-type, e.g. "Prebid JV"
  agreementCategory: AgreementCategory;
  parties: string;
  status: string;
}

export type AgreementCategory = "JV" | "Consortium" | "Cooperation" | "Subcontract" | "NDA" | "MOU" | "Other";

export interface SemanticModel {
  opportunities: Opportunity[];
  agreements: AgreementRecord[];
  countries: string[];
  assignees: string[];
  dataQualityNotes: string[];
}

export interface DashboardFilters {
  country: string | null;
  assignee: string | null;
  status: string | null;
  currency: Currency | null; // disconnected selector, defaults to EGP; null = "All" (every currency shown separately, never blended)
}
