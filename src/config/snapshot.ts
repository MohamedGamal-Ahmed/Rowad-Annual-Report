// ROWAD Pre-Award Dashboard — fixed reporting-period configuration.
//
// This dashboard represents a historical business SNAPSHOT, not a live "as of
// right now" view. The snapshot date must therefore never be derived from
// new Date(), Date.now(), or system/browser time — that would silently
// re-date the report every time someone opens it, which is wrong for a
// point-in-time analytical report.
//
// Business decision (locked 2026-07-03): the snapshot date and report
// version stay hardcoded here per cycle. When H2 2026 ships, bump the
// three constants below.
export const SNAPSHOT_DATE_LABEL = "01 Jul 2026";
export const REPORT_PERIOD_LABEL = "H1 2026";
export const REPORT_VERSION = "1.0.0";
