import { getExperience } from "@/data/site";

export function ExperienceMetaRow({ org }: { org: string }) {
  const experience = getExperience(org);
  if (!experience) return null;

  const dates = experience.dates.replace(/\bpresent\b/gi, "now");

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
      <span>{dates}</span>
      <span aria-hidden="true">·</span>
      <span>{experience.role}</span>
      <span aria-hidden="true">·</span>
      <span>{experience.location}</span>
    </p>
  );
}
