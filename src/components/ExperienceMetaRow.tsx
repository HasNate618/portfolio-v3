import { getExperience } from "@/data/site";

/** `showRole` is off where a heading right above already names the role. */
export function ExperienceMetaRow({ org, showRole = true }: { org: string; showRole?: boolean }) {
  const experience = getExperience(org);
  if (!experience) return null;

  const dates = experience.dates.replace(/\bpresent\b/gi, "now");

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
      <span>{dates}</span>
      {showRole ? (
        <>
          <span aria-hidden="true">·</span>
          <span>{experience.role}</span>
        </>
      ) : null}
      <span aria-hidden="true">·</span>
      <span>{experience.location}</span>
    </p>
  );
}
