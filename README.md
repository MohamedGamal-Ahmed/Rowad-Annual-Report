# ROWAD Pre-Award — Executive Reporting

An interactive, print-safe executive dashboard for ROWAD's semi-annual Pre-Award report. Upload your tracking sheet and the report is generated on the fly — six pages, one executive question per page, exportable as a single versioned PDF.

**Live demo:** _(deploy on Vercel and paste URL here)_

---

## What it does

- Reads a ROWAD-format Pre-Award tracking workbook (`.xlsx`) entirely in the browser — no server, no uploads to anyone else.
- Renders six focused executive pages:
  1. **Executive Overview** — snapshot KPIs + Awarded vs Open by country + highlights
  2. **Geographic Analysis** — country footprint with a 5-milestone heat matrix
  3. **Pipeline Analysis** — milestone flags + status distribution + project register
  4. **Team Performance** — assignee workload with composite (joint-ownership) support
  5. **Awards Performance** — per-currency awarded value + project list
  6. **Agreements Register** — pre-bid partnerships by category, signed vs unsigned, top partners
- One-click **PDF export**: the full six-page report as A4 landscape with confidential footer, snapshot date, report version, active-filter record, and page numbering.
- Facts-only reporting: every number is traceable to a source cell. No inferred trends, no fabricated comparisons.

## Business rules (frozen)

1. Excel workbook is the single source of truth.
2. A project is **Awarded** if and only if `Amount > 0` in any currency.
3. Currency amounts are **never blended** across currencies.
4. The 5 milestone flags are **independent completion counts**, not a sequential funnel.
5. `Fact_Agreements` is standalone — never joined to `Fact_Opportunities`.
6. No date dimension → no monthly/quarterly trend charts, no "vs previous period" claims.

## Expected workbook schema

The uploaded `.xlsx` must contain these sheets:

| Sheet | Columns |
|---|---|
| `Fact_Opportunities` | `ProjectCode`, `ProjectName`, `Country`, `Assignee`, `Assignee_Raw`, `Status`, `Flag_ContractQualifications`, `Flag_RiskAssessment`, `Flag_ContractSummary`, `Flag_Negotiation`, `Flag_Award`, `Amount_EGP`, `Amount_USD`, `Amount_SAR`, `Amount_EURO`, `Amount_CFA` |
| `Fact_Opp_Currency` | `ProjectCode`, `Currency` (EGP / USD / SAR / EURO / CFA), `Amount` |
| `Dim_Country` | `Country` |
| `Dim_Assignee` | `Assignee`, `IsComposite` |
| `Fact_Agreements` | `SR`, `ProjectName`, `AgreementType`, `AgreementCategory`, `Parties`, `Status` |
| `Data_Quality_Notes` | `Issue`, `Detail` (surfaced on the About page) |

Column-name matching is case- and whitespace-tolerant.

## Getting started (local)

```bash
git clone https://github.com/YOUR-USERNAME/rowad-preaward-report.git
cd rowad-preaward-report
npm install
npm run dev
```

Open http://localhost:5173, upload a workbook, and the report renders.

Available scripts:
- `npm run dev` — start Vite dev server
- `npm run build` — TypeScript check + production build
- `npm run preview` — preview production build locally
- `npm run lint` — oxlint

## Deploying on Vercel

The app is 100% static; a single-page routing config is included (`vercel.json`).

1. Push this repo to GitHub.
2. In Vercel, **Add New Project** → import the repo.
3. Framework preset: **Vite** (auto-detected).
4. Build command: `npm run build` · Output directory: `dist`.
5. Click Deploy. That's it — no environment variables required.

The workbook stays on the visitor's device; nothing is uploaded to the server.

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Zustand · React Router · Recharts · Motion (Framer) · SheetJS (xlsx) · html2canvas · jsPDF · oxlint

## License

Internal ROWAD project. Ask before reusing.
#
