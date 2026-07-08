/**
 * A handful of sheets in the source workbook spell certain project names
 * differently than "Project Information" — the sheet that defines the
 * known project list for the Project/Owner-Entity filter (see
 * `allowedProjectNames()` in usePostAwardStore.ts). Left unresolved, a row
 * whose name isn't a byte-for-byte match to Project Information silently
 * disappears the moment the user filters by any Project or Owner Entity
 * (it still shows fine under "All", which is why this was easy to miss).
 *
 * These are confirmed, high-confidence aliases — same project, different
 * spelling/abbreviation — checked by hand against the real workbook.
 * Everything that still doesn't match after this table is applied is a
 * genuine data gap (the name is absent from Project Information entirely,
 * or too different to confidently guess), and is surfaced instead as a
 * data-quality note in postAwardExcelParser.ts rather than silently aliased.
 */
export const PROJECT_NAME_ALIASES: Record<string, string> = {
  "Altsom New Cabling Factory": "Alstom Factory",
  "El Haer STP": "Al Haer STP - KSA",
  "MAFI": "MAFI Food Complex",
  "EGAT": "EGAT Projects",
};

export function canonicalProjectName(name: string): string {
  return PROJECT_NAME_ALIASES[name] ?? name;
}
