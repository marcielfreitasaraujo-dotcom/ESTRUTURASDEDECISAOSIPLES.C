import { cn } from "@/lib/utils";

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "success" | "warning" | "danger" | "info" | "neutral";
}) {
  const toneClass = {
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-destructive/15 text-destructive",
    info: "bg-info/15 text-info",
    neutral: "bg-muted text-muted-foreground",
  }[tone];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium", toneClass)}>
      {children}
    </span>
  );
}

export function DataTable({
  headers,
  children,
  minWidth = "720px",
}: {
  headers: string[];
  children: React.ReactNode;
  minWidth?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead className="bg-muted/40 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <tr>
            {headers.map((head) => (
              <th key={head} className="whitespace-nowrap px-3 py-2.5">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}
