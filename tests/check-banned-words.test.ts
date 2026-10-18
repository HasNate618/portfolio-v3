import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * The checker is the only thing that keeps a banned word out of the build, so it
 * is tested the way it is used: as a process, by its exit code.
 */

const SCRIPT = path.join(process.cwd(), "scripts", "check-banned-words.mjs");

function runChecker(root: string): { status: number; output: string } {
  try {
    const output = execFileSync(process.execPath, ["--import", "tsx", SCRIPT, "--root", root], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, output };
  } catch (error) {
    const failed = error as { status?: number; stdout?: string; stderr?: string };
    return { status: failed.status ?? 1, output: `${failed.stdout ?? ""}${failed.stderr ?? ""}` };
  }
}

function tempTree(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "check-words-"));
  for (const [name, body] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), body);
  }
  return dir;
}

test("a banned word fails the check and names the file and line", () => {
  const dir = tempTree({ "page.md": "intro\nCampus is the flagship.\n" });

  const { status, output } = runChecker(dir);

  assert.equal(status, 1);
  assert.match(output, /page\.md:2/);
  assert.match(output, /flagship/);
});

test("a clean tree passes", () => {
  const dir = tempTree({ "page.md": "Campus leads the home page.\n" });

  assert.equal(runChecker(dir).status, 0);
});

test("a file type the site never publishes is not scanned", () => {
  const dir = tempTree({ "notes.bin": "Campus is the flagship.\n" });

  assert.equal(runChecker(dir).status, 0);
});
