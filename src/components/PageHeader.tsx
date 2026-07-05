interface PageHeaderProps {
  title: string;
  subtitle: string;
}

/** Report title + colored page label. Reused by every page — only the two
 * strings change. */
export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="flex flex-col">
      <h1
        className="font-bold"
        style={{ fontSize: "var(--text-display)", color: "var(--color-text-primary)", whiteSpace: "nowrap" }}
      >
        {title}
      </h1>
      <p className="font-bold" style={{ fontSize: "var(--text-page-subtitle)", color: "var(--color-primary)" }}>
        {subtitle}
      </p>
    </div>
  );
}
