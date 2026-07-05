import { useRef } from "react";
import { Upload } from "lucide-react";
import { useDashboardStore } from "../store/useDashboardStore";

/** Data source is an Excel upload today. Per the architecture, this is the
 * ONLY component that knows about Excel — everything downstream consumes
 * the semantic model in the store. Swapping to a FastAPI/REST source later
 * means replacing this component's onChange handler (and the store's
 * loadWorkbook action) — no other component changes. */
export function FileUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { loadWorkbook, isLoading, error, fileName } = useDashboardStore();

  return (
    <div className="flex flex-col items-center justify-center gap-3 h-full">
      <Upload size={32} color="var(--color-secondary)" />
      <p className="text-sm text-text-muted">
        {fileName ? `Loaded: ${fileName}` : "Upload the Pre-Award Excel workbook to begin"}
      </p>
      <button
        className="text-sm font-semibold text-white px-4 py-2 rounded-md"
        style={{ background: "var(--color-primary)" }}
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
      >
        {isLoading ? "Parsing..." : "Choose Excel File"}
      </button>
      {error && <p className="text-xs" style={{ color: "var(--color-error)" }}>{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) loadWorkbook(file);
        }}
      />
    </div>
  );
}
