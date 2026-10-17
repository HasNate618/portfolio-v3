{
  description = "LaTeX toolchain for resume/Resume.tex";

  # Ported from HasNate618/Resume, which this repo supersedes. The package list
  # is exactly what Resume.tex pulls in; texliveSmall plus these keeps the
  # closure small instead of dragging in texliveFull.
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          packages = [
            (pkgs.texliveSmall.withPackages (ps: with ps; [
              latexmk
              lm # lmodern, for fontenc's T1 encoding
              preprint # fullpage.sty
              titlesec
              marvosym
              enumitem
              hyperref
              fancyhdr
              babel-english
              tools # verbatim, tabularx
              graphics # color
              pdftex # glyphtounicode.tex
              # latexsym.sty ships with the base scheme, no extra package needed
            ]))
          ];
        };
      });
}
