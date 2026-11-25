#!/usr/bin/env python3
"""Assemble one résumé variant into a single .tex file.

A variant is a manifest, not a document. `variants/<name>.mft` lists which
sections appear, which entries go in them, which heading each entry uses and
which bullets survive. `entries/<file>.tex` holds every phrasing of that block,
once, each tagged with a name. `facts.tex` holds every number once.

    entry campus heading=data bullets=sync-search,harness

Nothing here interprets LaTeX; it only selects and concatenates. That is
deliberate: a selection you can grep beats a conditional you have to compile.

Usage:
    python3 resume/assemble.py <variant> [--out PATH] [--list]

    --out PATH   write the assembled file here (default: stdout)
    --list       print every bullet and which variants use it, then exit
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ENTRIES = HERE / "entries"
VARIANTS = HERE / "variants"
TEMPLATE = HERE / "Resume.tex"
FACTS = HERE / "facts.tex"

# %!heading name / %!bullet name / %!block name start a chunk; a blank line or
# the next marker ends it. Prose lines in between are kept verbatim.
MARKER = re.compile(r"^%!(\w+)[ \t]+(\S+)[ \t]*$")
SECTIONS = {"entries", "prose"}


class AssembleError(Exception):
    pass


def parse_entry(path: Path) -> dict[str, dict[str, str]]:
    data: dict[str, dict[str, str]] = {"heading": {}, "bullet": {}, "block": {}}
    kind: str | None = None
    name = ""
    buf: list[str] = []

    def flush() -> None:
        if kind and name:
            data[kind][name] = "\n".join(buf).strip("\n")

    for raw in path.read_text(encoding="utf-8").splitlines():
        match = MARKER.match(raw.strip())
        if match:
            flush()
            kind, name = match.group(1), match.group(2)
            if kind not in data:
                raise AssembleError(f"{path.name}: unknown marker %!{kind} {name}")
            buf = []
        elif kind:
            buf.append(raw)
    flush()
    return data


def available(path: Path) -> str:
    data = parse_entry(path)
    parts = [f"{kind}s: {', '.join(sorted(names)) or '-'}" for kind, names in data.items()]
    return f"  {path.name}: " + "; ".join(parts)


def parse_manifest(path: Path) -> dict:
    spec: dict = {"output": f"{path.stem}.pdf", "spacing": "loose", "sections": []}
    for number, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        line = raw.split("#", 1)[0].strip()
        if not line:
            continue
        word, _, rest = line.partition(" ")
        if word == "output":
            spec["output"] = rest.strip()
        elif word == "spacing":
            spec["spacing"] = rest.strip()
        elif word == "section":
            style = "entries"
            if " style=" in rest:
                rest, _, style = rest.partition(" style=")
                style = style.strip()
            if style not in SECTIONS:
                raise AssembleError(f"{path.name}:{number}: unknown style {style!r}")
            spec["sections"].append({"title": rest.strip(), "style": style, "items": []})
        elif word in ("entry", "block"):
            if not spec["sections"]:
                raise AssembleError(f"{path.name}:{number}: {word} before any section")
            spec["sections"][-1]["items"].append((word, rest.strip(), number))
        else:
            raise AssembleError(f"{path.name}:{number}: unknown directive {word!r}")
    if not spec["sections"]:
        raise AssembleError(f"{path.name}: no sections")
    return spec


def split_options(text: str) -> tuple[str, dict[str, str]]:
    parts = text.split()
    if not parts:
        raise AssembleError("empty entry line")
    options = {"heading": "", "bullets": ""}
    for part in parts[1:]:
        key, _, value = part.partition("=")
        if key not in options:
            raise AssembleError(f"unknown option {key!r}")
        options[key] = value
    return parts[0], options


def render_entry(name: str, options: dict[str, str], where: str) -> str:
    path = ENTRIES / f"{name}.tex"
    if not path.is_file():
        known = ", ".join(sorted(p.stem for p in ENTRIES.glob("*.tex")))
        raise AssembleError(f"{where}: no entry file {name!r}. Known: {known}")
    data = parse_entry(path)

    heading_name = options["heading"]
    if not heading_name:
        if len(data["heading"]) != 1:
            raise AssembleError(f"{where}: {name} needs heading= ({available(path)})")
        heading_name = next(iter(data["heading"]))
    if heading_name not in data["heading"]:
        raise AssembleError(f"{where}: {name} has no heading {heading_name!r}\n{available(path)}")

    out = [data["heading"][heading_name]]
    wanted = [b for b in options["bullets"].split(",") if b]
    if wanted:
        missing = [b for b in wanted if b not in data["bullet"]]
        if missing:
            raise AssembleError(
                f"{where}: {name} has no bullet {', '.join(missing)}\n{available(path)}"
            )
        out.append(r"\resumeItemListStart")
        out.extend(data["bullet"][b] for b in wanted)
        out.append(r"\resumeItemListEnd")
    return "\n".join(out)


def render_block(name: str, block: str, where: str) -> str:
    path = ENTRIES / f"{name}.tex"
    if not path.is_file():
        raise AssembleError(f"{where}: no entry file {name!r}")
    data = parse_entry(path)
    if block not in data["block"]:
        raise AssembleError(f"{where}: {name} has no block {block!r}\n{available(path)}")
    return data["block"][block]


def assemble(variant: str) -> tuple[str, str]:
    manifest = VARIANTS / f"{variant}.mft"
    if not manifest.is_file():
        known = ", ".join(sorted(p.stem for p in VARIANTS.glob("*.mft")))
        raise AssembleError(f"no variant {variant!r}. Known: {known}")
    spec = parse_manifest(manifest)

    body: list[str] = []
    for section in spec["sections"]:
        body.append(f"\\section{{{section['title']}}}")
        if section["style"] == "entries":
            body.append(r"\resumeSubHeadingListStart")
        else:
            body.append(r"\begin{itemize}[leftmargin=0.15in, label={}]")
        for kind, rest, number in section["items"]:
            where = f"{manifest.name}:{number}"
            if kind == "entry":
                name, options = split_options(rest)
                body.append(render_entry(name, options, where))
            else:
                name, _, block = rest.partition(" ")
                body.append(render_block(name, block.strip(), where))
        body.append(
            r"\resumeSubHeadingListEnd"
            if section["style"] == "entries"
            else r"\end{itemize}"
        )

    spacing = parse_entry(HERE / "spacing.tex")
    if spec["spacing"] not in spacing["block"]:
        known = ", ".join(sorted(spacing["block"]))
        raise AssembleError(f"{manifest.name}: no spacing profile {spec['spacing']!r}. Known: {known}")

    template = TEMPLATE.read_text(encoding="utf-8")
    for hole in ("%%BODY%%", "%%FACTS%%", "%%SPACING%%"):
        if hole not in template:
            raise AssembleError(f"Resume.tex is missing {hole}")
    text = template.replace("%%SPACING%%", spacing["block"][spec["spacing"]])
    text = text.replace("%%FACTS%%", FACTS.read_text(encoding="utf-8"))
    text = text.replace("%%BODY%%", "\n\n".join(body))
    return spec["output"], text


def list_usage() -> None:
    uses: dict[tuple[str, str], list[str]] = {}
    for manifest in sorted(VARIANTS.glob("*.mft")):
        spec = parse_manifest(manifest)
        for section in spec["sections"]:
            for kind, rest, _ in section["items"]:
                if kind != "entry":
                    continue
                name, options = split_options(rest)
                for bullet in filter(None, options["bullets"].split(",")):
                    uses.setdefault((name, bullet), []).append(manifest.stem)
    for (entry, bullet), variants in sorted(uses.items()):
        print(f"{entry}.{bullet:16} {', '.join(variants)}")


def main() -> int:
    args = sys.argv[1:]
    if "--list" in args:
        list_usage()
        return 0
    out = None
    if "--out" in args:
        index = args.index("--out")
        try:
            out = Path(args[index + 1])
        except IndexError:
            print("assemble: --out needs a path", file=sys.stderr)
            return 2
        del args[index : index + 2]
    if len(args) != 1:
        print(__doc__.strip(), file=sys.stderr)
        return 2

    try:
        _, text = assemble(args[0])
    except AssembleError as exc:
        print(f"assemble: {exc}", file=sys.stderr)
        return 1
    if out:
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(text, encoding="utf-8")
        print(f"assemble: wrote {out}")
    else:
        sys.stdout.write(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
