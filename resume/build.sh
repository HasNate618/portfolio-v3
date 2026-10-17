#!/usr/bin/env bash
#
# Build resume/Resume.tex and publish the result to public/Nathan_Espejo_Resume.pdf.
#
# Ported from HasNate618/Resume (render_resume.sh + flake.nix). That repo is now
# archived: this script is the whole build, minus the interactive menu and the
# herdr session it used to run in.
#
# The published PDF is the artifact the site serves; Resume.tex is its only
# source. Run `npm run build:resume` after any edit to the .tex.
#
# Usage: bash resume/build.sh
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$DIR")"
DEST="$ROOT/public/Nathan_Espejo_Resume.pdf"
JOB="Resume"

# latexmk scatters .aux/.log/.fls next to the source unless it is told where to
# put them. "build/" is already gitignored.
BUILD_DIR="$DIR/build"

if command -v latexmk >/dev/null 2>&1; then
  # System latexmk (any distro, or inside `nix develop resume`).
  latexmk -pdf -interaction=nonstopmode -halt-on-error -outdir="$BUILD_DIR" "$DIR/$JOB.tex"
elif command -v nix >/dev/null 2>&1 && [ -f "$DIR/flake.nix" ]; then
  # NixOS: latexmk isn't installed system-wide, so borrow it from the flake.
  # "path:" rather than a bare directory: a flake reached through a git work
  # tree has to be tracked by git first, and this script should not care whether
  # resume/flake.nix is committed yet.
  nix develop "path:$DIR" --command \
    latexmk -pdf -interaction=nonstopmode -halt-on-error -outdir="$BUILD_DIR" "$DIR/$JOB.tex"
else
  echo "build:resume — need latexmk on PATH, or nix to provide it via resume/flake.nix" >&2
  exit 1
fi

cp "$BUILD_DIR/$JOB.pdf" "$DEST"
echo "build:resume — wrote $DEST"
