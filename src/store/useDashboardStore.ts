import { create } from "zustand";
import type { AgreementRecord, Currency, Opportunity } from "../types/domain";
import { parseWorkbook } from "../parsers/excelParser";
import { applyCoreFilters } from "../services/calculations";

interface DashboardState {
  // --- Data layer (swap this for a FastAPI/REST call later; nothing
  // below this comment should need to change when the source does) ---
  isLoaded: boolean;
  isLoading: boolean;
  fileName: string | null;
  loadedAt: Date | null; // real timestamp of the last successful upload — never a fabricated business date
  error: string | null;
  opportunities: Opportunity[];
  agreements: AgreementRecord[];
  dataQualityNotes: string[];
  warnings: string[];

  // --- Filters ---
  country: string | null;
  assignee: string | null;
  status: string | null;
  /** null = "All" — every currency shown separately, never blended. */
  currency: Currency | null;

  // --- Actions ---
  loadWorkbook: (file: File) => Promise<void>;
  setCountry: (v: string | null) => void;
  setAssignee: (v: string | null) => void;
  setStatus: (v: string | null) => void;
  setCurrency: (v: Currency | null) => void;
  resetFilters: () => void;

  // --- Derived (memo-free, cheap at this data volume) ---
  filteredOpportunities: () => Opportunity[];
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  isLoaded: false,
  isLoading: false,
  fileName: null,
  loadedAt: null,
  error: null,
  opportunities: [],
  agreements: [],
  dataQualityNotes: [],
  warnings: [],

  country: null,
  assignee: null,
  status: null,
  currency: null, // "All" by default — user preference 2026-07-04; report opens neutral

  loadWorkbook: async (file: File) => {
    set({ isLoading: true, error: null });
    try {
      const { opportunities, agreements, dataQualityNotes, warnings } = await parseWorkbook(file);
      set({
        opportunities,
        agreements,
        dataQualityNotes,
        warnings,
        fileName: file.name,
        loadedAt: new Date(),
        isLoaded: true,
        isLoading: false,
      });
    } catch (e) {
      // Reject: clear stale data so the app never silently keeps showing a
      // previous workbook after a failed re-upload. The FileUpload / About
      // page surfaces `error` and returns the user to the upload state.
      set({
        error: e instanceof Error ? e.message : "Failed to parse workbook",
        isLoading: false,
        isLoaded: false,
        opportunities: [],
        agreements: [],
        dataQualityNotes: [],
        warnings: [],
        fileName: null,
        loadedAt: null,
      });
    }
  },

  setCountry: (v) => set({ country: v }),
  setAssignee: (v) => set({ assignee: v }),
  setStatus: (v) => set({ status: v }),
  setCurrency: (v) => set({ currency: v }),
  resetFilters: () => set({ country: null, assignee: null, status: null, currency: null }),

  filteredOpportunities: () => {
    const { opportunities, country, assignee, status } = get();
    return applyCoreFilters(opportunities, { country, assignee, status });
  },
}));
