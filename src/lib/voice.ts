/**
 * site.ts writes his summaries in his own voice: "My courses are spread across six
 * Brightspace pages", "the post-event work is mine", "team; I built the Unity
 * mini-games". Both surfaces that hand that text to the model, the profile card and
 * the corpus projection, are read as a claim about him, and the prompt forbids
 * speaking as Nathan. So the pronouns are turned around at the boundary instead of
 * being left for the model to trip on.
 *
 * This is a pronoun swap, not a rewrite: it does not repair a sentence whose
 * grammar depended on the first person.
 *
 * A team "we" becomes "the team", never "he". Handing Nathan the first person plural
 * credits him with everyone else's work, which is the one direction this must not lean,
 * and it was what "we shaped the concept" became before this rule.
 */
export function thirdPerson(text: string): string {
  return text
    .replace(/\bI'm\b/g, "he is")
    .replace(/\bI've\b/g, "he has")
    .replace(/\bI\b/g, "he")
    .replace(/\bmy\b/gi, "his")
    .replace(/\bmine\b/gi, "his")
    .replace(/\bme\b/g, "him")
    .replace(/\bour\b/gi, (match) => (match === "Our" ? "The team's" : "the team's"))
    .replace(/\bwe\b/gi, (match) => (match === "We" ? "The team" : "the team"))
    .replace(/\bus\b/g, "the team");
}

/** True when a line still speaks as Nathan, which is what the card and corpus check. */
export function speaksAsNathan(text: string): boolean {
  return /\bI\b|\bmy\b|\bmine\b|\bme\b|\bour\b|\bwe\b|\bus\b/i.test(text);
}
