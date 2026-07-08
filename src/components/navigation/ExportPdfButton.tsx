import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Download, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { exportReportAsPdf, exportPostAwardReportAsPdf } from "../../services/pdfExport";

/** "Export PDF" button in the sidebar bottom. Captures every implemented
 *  route as a high-DPI PNG via html2canvas, composes them into a single
 *  A4 landscape PDF via jsPDF, downloads the file, and restores the user
 *  to the route they were on. During capture, the button hides itself
 *  (visibility: hidden via `body.pdf-exporting` — see index.css) so the
 *  PDF pages don't include a button in the sidebar. */
export function ExportPdfButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    document.body.classList.add("pdf-exporting");
    try {
      const isPostAward = location.pathname.startsWith("/post-award");
      const exportFn = isPostAward ? exportPostAwardReportAsPdf : exportReportAsPdf;
      await exportFn((path) => navigate(path), location.pathname);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      document.body.classList.remove("pdf-exporting");
      setBusy(false);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={busy}
      className="pdf-export-button flex items-center gap-2 no-print"
      style={{
        padding: "9px 12px",
        borderRadius: 10,
        background: "var(--color-primary)",
        color: "#fff",
        border: "none",
        cursor: busy ? "wait" : "pointer",
        width: "100%",
        fontSize: "var(--text-nav)",
        fontWeight: 600,
        opacity: busy ? 0.7 : 1,
      }}
      whileHover={busy ? {} : { background: "var(--color-primary-dark)" }}
      transition={{ duration: 0.15 }}
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
      <span>{busy ? "Generating PDF..." : "Export PDF"}</span>
    </motion.button>
  );
}
