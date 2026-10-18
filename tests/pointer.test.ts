import { test } from "node:test";
import assert from "node:assert/strict";
import { availabilityAsked, choosePointer, pointerWhitelist } from "../src/app/api/chat/lib/pointer";
import { site } from "../src/data/site";
import { siteBaseUrl } from "../src/lib/site-url";

type PointerInput = Parameters<typeof choosePointer>[0];

const ask = (overrides: Partial<PointerInput> = {}) =>
  choosePointer({
    namedSubjectId: null,
    intent: "general",
    turn: 1,
    contactAsked: false,
    availabilityAsked: false,
    ...overrides,
  });

const linkHref = (label: string) => site.contact.links.find((link) => link.label === label)!.href;
const RESUME = linkHref("Resume PDF");
const LINKEDIN = linkHref("LinkedIn");
const EMAIL = `mailto:${site.contact.email}`;

test("a named project points at its own page, not at the résumé", () => {
  assert.equal(ask({ namedSubjectId: "aware" }).url, `${siteBaseUrl()}/projects/aware`);
  assert.equal(ask({ namedSubjectId: "campus" }).url, `${siteBaseUrl()}/projects/campus`);
});

test("a project with no page points at its own repository", () => {
  const ferret = site.projects.find((project) => project.id === "ferret")!;
  assert.equal(ask({ namedSubjectId: "ferret" }).url, ferret.links[0].href);
});

test("a named role points at its own page", () => {
  assert.equal(ask({ namedSubjectId: "terago" }).url, `${siteBaseUrl()}/experience/terago`);
});

test("a subject with no page and no link falls back to the résumé", () => {
  assert.equal(ask({ namedSubjectId: "wemars" }).url, RESUME);
});

test("a broad or hiring first turn points at the résumé", () => {
  assert.equal(ask().url, RESUME);
  assert.equal(ask({ intent: "recruiter" }).url, RESUME);
});

test("a hiring thread points at the email, and so does an availability question", () => {
  assert.equal(ask({ intent: "recruiter", turn: 2 }).url, EMAIL);
  assert.equal(ask({ availabilityAsked: true }).url, EMAIL);
});

/*
 * The spec's table is a priority order, so a contact question only reaches the
 * LinkedIn row when the rows above it do not fire: it has to also be a second
 * turn, because the first turn always points at the résumé.
 */
test("a contact question points at LinkedIn", () => {
  assert.equal(ask({ contactAsked: true, turn: 2 }).url, LINKEDIN);
});

test("the availability question is recognised in its plural shapes", () => {
  assert.ok(availabilityAsked("Is he available for internships?"));
  assert.ok(availabilityAsked("Any internship openings?"));
  assert.ok(!availabilityAsked("What does Campus do?"));
});

test("every pointer is a URL the site actually offers", () => {
  const whitelist = pointerWhitelist();
  assert.ok(whitelist.includes(RESUME), "the résumé PDF is offerable");
  assert.ok(whitelist.includes(EMAIL), "the email is offerable");
  for (const link of site.contact.links) assert.ok(whitelist.includes(link.href), `${link.label} is offerable`);
  for (const project of site.projects) {
    for (const link of project.links) assert.ok(whitelist.includes(link.href), `${project.name} ${link.label}`);
  }
});

test("no code path can pick a URL outside the whitelist", () => {
  const whitelist = new Set(pointerWhitelist());
  const subjects = [null, ...site.projects.map((p) => p.id), ...site.experience.map((role) => role.id)];

  for (const namedSubjectId of subjects) {
    for (const intent of ["general", "recruiter"] as const) {
      for (const turn of [1, 2, 3]) {
        for (const contactAsked of [false, true]) {
          for (const availabilityAsked of [false, true]) {
            const pointer = choosePointer({ namedSubjectId, intent, turn, contactAsked, availabilityAsked });
            assert.ok(pointer.url.startsWith("http") || pointer.url.startsWith("mailto:"), pointer.url);
            assert.ok(whitelist.has(pointer.url), `${namedSubjectId} ${intent} ${turn} picked ${pointer.url}`);
            assert.ok(pointer.label.length > 0);
          }
        }
      }
    }
  }
});
