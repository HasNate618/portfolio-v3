#!/usr/bin/env bash
#
# Build a résumé variant and publish the result.
#
# resume/Resume.tex is a template with two holes in it: %%FACTS%% (every number,
# defined once in facts.tex) and %%BODY%% (the sections a variant asks for).
# resume/assemble.py fills those in from resume/variants/<name>.mft, then
# latexmk compiles the result. Nothing is edited twice: adding a bullet means
# adding one named chunk to one entry file and naming it in a manifest.
#
#   bash resume/build.sh            # applied-ai, the variant the site serves
#   bash resume/build.sh data       # one variant, to resume/dist/data.pdf
#   bash resume/build.sh all        # every manifest
#
# Only the default variant is copied to public/, because that is the file
# nathanespejo.com/Nathan_Espejo_Resume.pdf serves. The others stay in
# resume/dist/ for sending to a particular posting.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$DIR")"
DEFAULT_VARIANT="applied-ai"

# latexmk scatters .aux/.log/.fls next to the source unless it is told where to
# put them. "build/" and "dist/" are both gitignored.
BUILD_DIR="$DIR/build"
DIST_DIR="$DIR/dist"

# Reproducible output: with a fixed clock, rebuilding an unchanged résumé gives
# an unchanged PDF, so a diff in public/ always means a real change.
export SOURCE_DATE_EPOCH="${SOURCE_DATE_EPOCH:-1798761600}"

TARGET="${1:-$DEFAULT_VARIANT}"
mkdir -p "$BUILD_DIR" "$DIST_DIR"

build_one() {
  local variant="$1"
  local job="$BUILD_DIR/$variant.tex"

  python3 "$DIR/assemble.py" "$variant" --out "$job"

  if command -v latexmk >/dev/null 2>&1; then
    # System latexmk (any distro, or inside `nix develop resume`).
    latexmk -pdf -interaction=nonstopmode -halt-on-error \
      -outdir="$BUILD_DIR" "$job"
  elif command -v nix >/dev/null 2>&1 && [ -f "$DIR/flake.nix" ]; then
    # NixOS: latexmk isn't installed system-wide, so borrow it from the flake.
    # "path:" rather than a bare directory: a flake reached through a git work
    # tree has to be tracked by git first, and this script should not care
    # whether resume/flake.nix is committed yet.
    nix develop "path:$DIR" --command \
      latexmk -pdf -interaction=nonstopmode -halt-on-error \
      -outdir="$BUILD_DIR" "$job"
  else
    echo "build:resume: need latexmk on PATH, or nix to provide it via resume/flake.nix" >&2
    exit 1
  fi

  cp "$BUILD_DIR/$variant.pdf" "$DIST_DIR/$variant.pdf"
  echo "build:resume: wrote $DIST_DIR/$variant.pdf"

  if [ "$variant" = "$DEFAULT_VARIANT" ]; then
    cp "$BUILD_DIR/$variant.pdf" "$ROOT/public/Nathan_Espejo_Resume.pdf"
    echo "build:resume: published $ROOT/public/Nathan_Espejo_Resume.pdf"
  fi
}

if [ "$TARGET" = "all" ]; then
  for manifest in "$DIR"/variants/*.mft; do
    build_one "$(basename "$manifest" .mft)"
  done
else
  build_one "$TARGET"
fi
