import { create } from "zustand";
import type {
  ClientClaim,
  CorrespondenceRecord,
  InvoiceRecord,
  PostAwardCurrency,
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
import { parsePostAwardWorkbook } from "../parsers/postAwardExcelParser";
import { canonicalProjectName } from "../utils/projectNameAliases";

interface PostAwardState {
  isLoaded: boolean;
  isLoading: boolean;
  fileName: string | null;
  loadedAt: Date | null;
  error: string | null;

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
  warnings: string[];

  // --- Filters --- (mirrors Pre-Award: Currency is a disconnected selector
  // that only scopes financial figures, never row counts)
  project: string | null;
  ownerEntity: string | null;
  currency: PostAwardCurrency | null;

  loadWorkbook: (file: File) => Promise<void>;
  setProject: (v: string | null) => void;
  setOwnerEntity: (v: string | null) => void;
  setCurrency: (v: PostAwardCurrency | null) => void;
  resetFilters: () => void;

  /** Project names surviving the current Owner-Entity + Project filters —
   * every other sheet is filtered against this set, since projectName is
   * the only key shared across all 12 sheets. */
  allowedProjectNames: () => Set<string> | null; // null = no restriction
  filteredProjects: () => ProjectInfo[];
}

function emptyData() {
  return {
    projects: [] as ProjectInfo[],
    clientClaims: [] as ClientClaim[],
    variationOrders: [] as VariationOrder[],
    invoices: [] as InvoiceRecord[],
    tocDlc: [] as TocDlcRecord[],
    scClaims: [] as ScClaim[],
    scDrafts: [] as ScDraft[],
    correspondence: [] as CorrespondenceRecord[],
    specialAgreements: [] as SpecialAgreement[],
    subcontractReviews: [] as SubcontractReview[],
    subcontractAgreements: [] as SubcontractAgreement[],
    projectRegister: [] as ProjectRegisterRow[],
    dataQualityNotes: [] as string[],
    warnings: [] as string[],
  };
}

export const usePostAwardStore = create<PostAwardState>((set, get) => ({
  isLoaded: false,
  isLoading: false,
  fileName: null,
  loadedAt: null,
  error: null,
  ...emptyData(),

  project: null,
  ownerEntity: null,
  currency: null,

  loadWorkbook: async (file: File) => {
    set({ isLoading: true, error: null });
    try {
      const result = await parsePostAwardWorkbook(file);
      set({
        ...result,
        fileName: file.name,
        loadedAt: new Date(),
        isLoaded: true,
        isLoading: false,
      });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to parse workbook",
        isLoading: false,
        isLoaded: false,
        ...emptyData(),
        fileName: null,
        loadedAt: null,
      });
    }
  },

  setProject: (v) => set({ project: v }),
  setOwnerEntity: (v) => set({ ownerEntity: v }),
  setCurrency: (v) => set({ currency: v }),
  resetFilters: () => set({ project: null, ownerEntity: null, currency: null }),

  allowedProjectNames: () => {
    const { projects, project, ownerEntity } = get();
    if (!project && !ownerEntity) return null;
    let names = new Set(projects.map((p) => p.projectName));
    if (ownerEntity) {
      names = new Set(projects.filter((p) => p.ownerEntity === ownerEntity).map((p) => p.projectName));
    }
    if (project) {
      names = names.has(project) ? new Set([project]) : new Set<string>();
    }
    return names;
  },

  filteredProjects: () => {
    const { projects } = get();
    const allowed = get().allowedProjectNames();
    return allowed ? projects.filter((p) => allowed.has(p.projectName)) : projects;
  },
}));

/** Generic helper for pages: filter any sheet's rows by the current
 * Project/Owner-Entity selection, given how to read the project name off
 * that row shape (field name differs — "projectName" vs "project"). Runs
 * the raw name through canonicalProjectName() first so confirmed spelling
 * variants (see utils/projectNameAliases.ts) still match Project Information
 * instead of silently vanishing under an active filter. */
export function filterByAllowedProjects<T>(rows: T[], allowed: Set<string> | null, getName: (r: T) => string): T[] {
  return allowed ? rows.filter((r) => allowed.has(canonicalProjectName(getName(r)))) : rows;
}
