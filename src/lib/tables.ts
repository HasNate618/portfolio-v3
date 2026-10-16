import type { ModelRow } from "@/data/site";

const esc = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * The single place the model table's markup is written. The ModelTable component
 * and the `models` content fence both call this, so <caption> and scope="col"
 * cannot drift between the two rendering paths.
 */
export function modelTableHtml(rows: ModelRow[], caption: string): string {
  if (rows.length === 0) return "";

  const head =
    '<tr class="border-b border-rule">' +
    '<th scope="col" class="py-2 pr-4 text-left font-semibold text-fg">Model</th>' +
    '<th scope="col" class="py-2 pr-4 text-left font-semibold text-fg">Job</th>' +
    '<th scope="col" class="py-2 text-left font-semibold text-fg">Runtime</th>' +
    "</tr>";

  const body = rows
    .map(
      (row) =>
        '<tr class="border-b border-rule align-top">' +
        `<th scope="row" class="py-3 pr-4 text-left font-normal text-fg">${esc(row.name)}</th>` +
        `<td class="py-3 pr-4">${esc(row.job)}</td>` +
        `<td class="py-3 text-muted">${esc(row.runtime)}</td>` +
        "</tr>"
    )
    .join("");

  return (
    '<div class="my-6 overflow-x-auto">' +
    '<table class="w-full border-collapse text-left text-sm">' +
    `<caption class="sr-only">${esc(caption)}</caption>` +
    `<thead>${head}</thead><tbody>${body}</tbody>` +
    "</table></div>"
  );
}
