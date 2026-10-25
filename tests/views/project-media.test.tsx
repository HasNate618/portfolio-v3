import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { ProjectMedia } from "../../src/components/ProjectMedia";
import { getProject } from "../../src/data/site";

const auralis = getProject("auralis")!.media!;

test("a compact card shows the main image and a square for each other image", () => {
  const html = renderToStaticMarkup(<ProjectMedia media={auralis} variant="card" />);
  assert.equal(html.match(/id="media-[^"]*-thumb"/g)?.length, auralis.length, "every image has its own thumbnail");
  assert.match(html, /h-24 w-40/, "the main image keeps the old size");
  assert.match(html, /h-\[2\.75rem\] w-14/, "the others are small squares beside it");
  assert.doesNotMatch(html, /max-lg:hidden/, "images show on phones too");
});

test("each expanded image has previous, next, close and a counter that wrap around", () => {
  const html = renderToStaticMarkup(<ProjectMedia media={auralis} variant="card" />);
  const ids = [...html.matchAll(/<div id="(media-[^"]+)" class="lightbox"/g)].map((m) => m[1]);
  assert.equal(ids.length, auralis.length);
  assert.match(html, new RegExp(`data-prev="${ids[ids.length - 1]}"`), "the first image steps back to the last");
  assert.match(html, /aria-label="Previous image"/);
  assert.match(html, /aria-label="Next image"/);
  assert.match(html, /class="lightbox-close"/);
  assert.match(html, new RegExp(`1 / ${auralis.length}`));
});

test("more images than squares collapse into a +N square that opens the first hidden one", () => {
  const many = Array.from({ length: 8 }, (_, i) => ({ ...auralis[0], src: `/projects/x-${i}.webp`, alt: `Shot ${i}` }));
  const html = renderToStaticMarkup(<ProjectMedia media={many} variant="card" />);
  assert.equal(html.match(/id="media-[^"]*-thumb"/g)?.length, 5, "main plus four squares");
  assert.match(html, />\+4</);
  assert.match(html, /aria-label="4 more images, starting with Shot 4"/);
});

test("a single image has no previous or next links", () => {
  const one = getProject("whack-a-ml")!.media!;
  const html = renderToStaticMarkup(<ProjectMedia media={one} />);
  assert.doesNotMatch(html, /Previous image/);
});
