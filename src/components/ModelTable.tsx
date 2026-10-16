import type { ModelRow } from "@/data/site";

export function ModelTable({ rows, caption }: { rows: ModelRow[]; caption: string }) {
  if (rows.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-rule">
            <th scope="col" className="py-2 pr-4 font-semibold text-fg">Model</th>
            <th scope="col" className="py-2 pr-4 font-semibold text-fg">Job</th>
            <th scope="col" className="py-2 font-semibold text-fg">Runtime</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-rule align-top">
              <th scope="row" className="py-3 pr-4 font-normal text-fg">{row.name}</th>
              <td className="py-3 pr-4">{row.job}</td>
              <td className="py-3 text-muted">{row.runtime}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
