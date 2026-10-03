# Web typography

Apple devices use the native system font stack. Other platforms use the locally hosted Inter variable font, with Segoe UI and system sans-serif fallbacks. The visible headline is “Build your brand. Own your future.”

The source font came from the [official Inter 4.1 release](https://github.com/rsms/inter/releases/tag/v4.1). Its SIL Open Font License remains at `assets/fonts/LICENSE.txt`. The WOFF2 file was reduced with [fontTools subsetting](https://fonttools.readthedocs.io/en/latest/subset/index.html), retaining variable weights, optical size, standard shaping, kerning, ligatures, tabular numbers and hinting, Latin characters and the punctuation, currency symbols, arrows and stars used by the English-language site. Other characters use platform fallbacks.

To reproduce from the original, unmodified release font in an isolated Python environment with `fonttools[woff]` installed:

```sh
pyftsubset InterVariable-full.woff2 \
  --output-file=assets/fonts/InterVariable.woff2 --flavor=woff2 \
  --unicodes='U+0000-024F,U+2000-206F,U+2070-209F,U+20A0-20CF,U+2100-214F,U+2190-21FF,U+2600-26FF' \
  --layout-features+=tnum --notdef-glyph --notdef-outline --recommended-glyphs
```

Expand this subset and review the rendered text when adding another language. Font size and cold-load paint timing are measured in local reports, not claimed as deployed performance guarantees.
