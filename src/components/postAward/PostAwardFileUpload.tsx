import { useRef } from "react";
import { Upload } from "lucide-react";
import { usePostAwardStore } from "../../store/usePostAwardStore";

/** Post-Award counterpart of FileUpload.tsx — same "only this component
 * knows about Excel" architecture, wired to usePostAwardStore instead of
 * useDashboardStore. Independent upload from the Pre-Award tab: the two
 * reports never share a workbook. */
export function PostAwardFileUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { loadWorkbook, isLoading, error, fileName } = usePostAwardStore();

  return (
    <div className="flex flex-col items-center justify-center gap-3 h-full">
      <Upload size={32} color="var(--color-secondary)" />
      <p className="text-sm text-text-muted">
        {fileName ? `Loaded: ${fileName}` : "Upload the Post-Award (Ongoing Report) Excel workbook to begin"}
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
