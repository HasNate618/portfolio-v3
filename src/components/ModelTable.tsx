import type { ModelRow } from "@/data/site";
import { modelTableHtml } from "@/lib/tables";

/**
 * Renders the shared table markup. The `models` content fence emits the same HTML,
 * so there is one implementation of the table rather than two that drift.
 */
export function ModelTable({ rows, caption }: { rows: ModelRow[]; caption: string }) {
  const html = modelTableHtml(rows, caption);
  if (!html) return null;
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
