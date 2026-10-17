import { site, type SiteAward } from "@/data/site";

/**
 * A 4-column table cannot fit 360px without sideways scroll, so narrow screens
 * get one card per award and the table is display:none (and therefore out of the
 * accessibility tree). Both read the same site.ts array.
 */
export function AwardsTable({ awards = site.awards }: { awards?: SiteAward[] }) {
  const caption =
    awards.length === site.awards.length
      ? `Hackathon awards: ${site.hackathons.awards} awards from ${site.hackathons.entered} hackathons`
      : "Four hackathon awards";

  return (
    <>
      <ul className="flex flex-col gap-4 sm:hidden">
        {awards.map((award) => (
          <li key={`${award.event}-${award.year}`} className="border-t border-rule pt-4">
            <p className="font-medium text-fg">{award.project}</p>
            <p className="text-sm text-muted">
              {award.event} · {award.year}
            </p>
            <p className="text-sm">{award.prize}</p>
            <p className="mt-1 text-xs text-muted">{award.role}</p>
          </li>
        ))}
      </ul>

      <div className="hidden sm:block">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-rule">
              <th scope="col" className="py-2 pr-4 font-semibold text-fg">Event</th>
              <th scope="col" className="py-2 pr-4 font-semibold text-fg">Year</th>
              <th scope="col" className="py-2 pr-4 font-semibold text-fg">Project</th>
              <th scope="col" className="py-2 font-semibold text-fg">Prize</th>
            </tr>
          </thead>
          <tbody>
            {awards.map((award) => (
              <tr key={`${award.event}-${award.year}`} className="border-b border-rule align-top">
                <th scope="row" className="py-3 pr-4 font-normal text-fg">{award.event}</th>
                <td className="py-3 pr-4 text-muted">{award.year}</td>
                <td className="py-3 pr-4">{award.project}</td>
                <td className="py-3">
                  {award.prize}
                  <span className="mt-1 block text-xs text-muted">{award.role}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
