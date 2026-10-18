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
 */
export function thirdPerson(text: string): string {
  return text
    .replace(/\bI'm\b/g, "he is")
    .replace(/\bI've\b/g, "he has")
    .replace(/\bI\b/g, "he")
    .replace(/\bmy\b/gi, "his")
    .replace(/\bmine\b/gi, "his")
    .replace(/\bme\b/g, "him")
    .replace(/\bour\b/gi, "his")
    .replace(/\bwe\b/gi, "he")
    .replace(/\bus\b/g, "him");
}

/** True when a line still speaks as Nathan, which is what the card and corpus check. */
export function speaksAsNathan(text: string): boolean {
  return /\bI\b|\bmy\b|\bmine\b|\bme\b|\bour\b|\bwe\b|\bus\b/i.test(text);
}
