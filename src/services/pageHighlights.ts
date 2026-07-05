// ============================================================
// Executive Highlights generators for Pages 3-6 (Awards, Pipeline,
// Assignees, Agreements). Same descriptive style as
// generateGeographicHighlights on Page 2: icon + one bold headline + one
// short factual explanation. Every string is derived from live metrics
// already computed in services/calculations.ts — no inferred causes, no
// predictions, no risk classifications, no vs-previous-period claims.
// ============================================================

import { Trophy, Coins, Globe2, Users, Handshake, ClipboardCheck, ShieldAlert, FileText } from "lucide-react";
import type { Opportunity, AgreementRecord } from "../types/domain";
import type { Insight } from "../components/ExecutiveHighlights";
import {
  MIN_SAMPLE_FOR_WINRATE_RANKING,
  agreementsByCategory,
  awardedProjects,
  compositeAssigneeCount,
  conversionRate,
  countriesWithAwards,
  isAwarded,
  milestoneCounts,
  multiCurrencyAwardCount,
  statsByAssignee,
  statusDistribution,
  totalAgreements,
  totalOpportunities,
} from "./calculations";

// ------------------------------------------------------------
// Page 3 — Awards
// ------------------------------------------------------------
export function generateAwardHighlights(opps: Opportunity[]): Insight[] {
  const total = totalOpportunities(opps);
  const awarded = awardedProjects(opps);

  // 1) Awarded count
  const h1: Insight = {
    icon: Trophy,
    tone: "rose",
    title: `${awarded} project${awarded === 1 ? "" : "s"} have been awarded`,
    description: `Out of ${total} total opportunities.`,
  };

  // 2) Multi-currency awards
  const multiCurProjects = opps
    .filter(isAwarded)
    .filter((o) => Object.values(o.amounts).filter((v) => (v ?? 0) > 0).length >= 2);
  const multiCurCount = multiCurrencyAwardCount(opps);
  const h2: Insight = {
    icon: Coins,
    tone: "gold",
    title: `${multiCurCount} project${multiCurCount === 1 ? "" : "s"} have amounts in ≥2 currencies`,
    description:
      multiCurProjects.length > 0 && multiCurProjects.length <= 3
        ? multiCurProjects.map((o) => o.projectCode).join(", ")
        : "Across multiple contracts.",
  };

  // 3) Countries with awards
  const countriesCount = countriesWithAwards(opps);
  const countryNames = Array.from(new Set(opps.filter(isAwarded).map((o) => o.country)));
  const h3: Insight = {
    icon: Globe2,
    tone: "navy",
    title: `${countriesCount} countr${countriesCount === 1 ? "y has" : "ies have"} at least one awarded project`,
    description: countryNames.length > 0 ? countryNames.join(", ") : "No awarded projects in the current filter.",
  };

  // 4) Top awarded country by count
  const byCountry = new Map<string, number>();
  for (const o of opps.filter(isAwarded)) byCountry.set(o.country, (byCountry.get(o.country) ?? 0) + 1);
  const ranked = Array.from(byCountry.entries()).sort((a, b) => b[1] - a[1]);
  const top = ranked[0];
  const h4: Insight = top
    ? {
        icon: Trophy,
        tone: "teal",
        title: `${top[0]} leads with ${top[1]} awarded project${top[1] === 1 ? "" : "s"}`,
        description: `${top[1]} of ${awarded} total awards.`,
      }
    : {
        icon: Trophy,
        tone: "teal",
        title: "No awarded projects in the current filter.",
        description: "Adjust the filters to see award highlights.",
      };

  return [h1, h2, h3, h4];
}

// ------------------------------------------------------------
// Page 4 — Pipeline
// ------------------------------------------------------------
export function generatePipelineHighlights(opps: Opportunity[]): Insight[] {
  const m = milestoneCounts(opps);
  const rate = conversionRate(opps);
  const statuses = statusDistribution(opps);
  const inNegotiation = statuses.find((s) => s.status === "In Negotiation")?.count ?? 0;
  const inRiskAssessment = statuses.find((s) => s.status === "Risk Assessment")?.count ?? 0;

  return [
    {
      icon: Trophy,
      tone: "rose",
      title: `${m.award} of ${m.contractQualifications} qualified opportunities have been awarded (${(rate * 100).toFixed(1)}% conversion)`,
      description: "Award / Contract Qualifications.",
    },
    {
      icon: ClipboardCheck,
      tone: "teal",
      title: `${m.contractSummary} opportunit${m.contractSummary === 1 ? "y has" : "ies have"} completed Contract Summary`,
      description: "Milestone independent of Negotiation.",
    },
    {
      icon: Handshake,
      tone: "gold",
      title: `${inNegotiation} opportunit${inNegotiation === 1 ? "y is" : "ies are"} currently in Negotiation`,
      description: "Status = In Negotiation.",
    },
    {
      icon: ShieldAlert,
      tone: "navy",
      title: `${inRiskAssessment} opportunit${inRiskAssessment === 1 ? "y remains" : "ies remain"} in Risk Assessment status`,
      description: "Status = Risk Assessment.",
    },
  ];
}

// ------------------------------------------------------------
// Page 5 — Assignees
// ------------------------------------------------------------
export function generateAssigneeHighlights(opps: Opportunity[]): Insight[] {
  const total = totalOpportunities(opps);
  const stats = statsByAssignee(opps, null);

  // 1) Largest portfolio (by total opportunities, not awarded count)
  const byTotal = [...stats].sort((a, b) => b.totalOpportunities - a.totalOpportunities);
  const largest = byTotal[0];
  const h1: Insight = largest
    ? {
        icon: Users,
        tone: "rose",
        title: `${largest.assignee} holds ${largest.totalOpportunities} opportunit${largest.totalOpportunities === 1 ? "y" : "ies"}, the largest portfolio`,
        description: `${largest.totalOpportunities} of ${total} total opportunities.`,
      }
    : { icon: Users, tone: "rose", title: "No assignees in current filter.", description: "" };

  // 2) Composite ownership
  const compositeCount = compositeAssigneeCount(opps);
  const compositeRows = stats.filter((s) => s.assignee.includes("&"));
  const h2: Insight = {
    icon: Handshake,
    tone: "gold",
    title: `${compositeCount} assignee${compositeCount === 1 ? "" : "s"} have composite ownership (joint pairs)`,
    description:
      compositeRows.length > 0
        ? compositeRows.map((r) => `${r.assignee} = ${r.totalOpportunities} opportunities`).join(", ")
        : "No composite (joint) assignees in the current filter.",
  };

  // 3) At least one award
  const withAward = stats.filter((s) => s.awardedProjects > 0).length;
  const h3: Insight = {
    icon: Trophy,
    tone: "teal",
    title: `${withAward} assignee${withAward === 1 ? "" : "s"} have at least one awarded project`,
    description: `${withAward} of ${stats.length} assignees.`,
  };

  // 4) Highest win rate on a real sample (>= MIN_SAMPLE_FOR_WINRATE_RANKING)
  const qualified = stats
    .filter((s) => s.totalOpportunities >= MIN_SAMPLE_FOR_WINRATE_RANKING)
    .sort((a, b) => b.winRate - a.winRate);
  const bestQualified = qualified[0];
  const h4: Insight = bestQualified
    ? {
        icon: Trophy,
        tone: "navy",
        title: `Highest win rate: ${bestQualified.assignee} at ${(bestQualified.winRate * 100).toFixed(0)}%`,
        description: `${bestQualified.awardedProjects} of ${bestQualified.totalOpportunities} opportunities awarded (min. ${MIN_SAMPLE_FOR_WINRATE_RANKING} opportunities).`,
      }
    : largest
      ? {
          icon: Trophy,
          tone: "navy",
          title: `${largest.assignee} leads by opportunity count`,
          description: `No assignee has ${MIN_SAMPLE_FOR_WINRATE_RANKING}+ opportunities to rank a reliable win rate.`,
        }
      : { icon: Trophy, tone: "navy", title: "No assignees in current filter.", description: "" };

  return [h1, h2, h3, h4];
}

// ------------------------------------------------------------
// Page 6 — Agreements (standalone — never filtered by Country/Assignee/Status,
// never joined to Opportunities per Data_Quality_Notes)
// ------------------------------------------------------------
export function generateAgreementHighlights(agreements: AgreementRecord[]): Insight[] {
  const total = totalAgreements(agreements);
  const signed = agreements.filter((a) => a.status === "Signed").length;
  const unsigned = total - signed;
  const byCategory = agreementsByCategory(agreements);
  const rankedCategories = (Object.entries(byCategory) as [string, number][])
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);
  const topCategory = rankedCategories[0];
  const secondCategory = rankedCategories[1];
  const unsignedRows = agreements.filter((a) => a.status !== "Signed");

  return [
    {
      icon: FileText,
      tone: "navy",
      title: `${total} agreements recorded`,
      description: `${signed} signed, ${unsigned} unsigned.`,
    },
    topCategory
      ? {
          icon: Handshake,
          tone: "rose",
          title: `${topCategory[0]} is the most-used partnership category (${topCategory[1]} of ${total})`,
          description: secondCategory ? `${secondCategory[0]} is second with ${secondCategory[1]}.` : "No other category is in use.",
        }
      : { icon: Handshake, tone: "rose", title: "No agreements recorded.", description: "" },
    {
      icon: ShieldAlert,
      tone: "gold",
      title: `${unsigned} agreement${unsigned === 1 ? "" : "s"} remain unsigned`,
      description:
        unsignedRows.length > 0
          ? unsignedRows.map((a) => `SR ${a.sr} (${a.projectName})`).join(", ")
          : "All agreements are signed.",
    },
    {
      icon: Globe2,
      tone: "teal",
      title: "Agreements are standalone in the source data",
      description: "Not linked to specific opportunity project codes.",
    },
  ];
}
