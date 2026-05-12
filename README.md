# Elite MGMT Agency — Web

[![License: Proprietary](https://img.shields.io/badge/license-proprietary-pink.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A520.x-success.svg)](./.nvmrc)
[![Status](https://img.shields.io/badge/status-production-success.svg)](#deployment)
[![Owner](https://img.shields.io/badge/owner-Viral%20Ventures%20LLC-black.svg)](https://viral-ventures-llc.com)

The production website for **Elite MGMT Agency** — a women-only creator
management agency for OnlyFans, Fansly, and the broader subscription economy.

Live: **[elite-mgmt-agency.com](https://elite-mgmt-agency.com)**

> **Proprietary software.** © 2019–2026 Viral Ventures LLC, Maple Grove, MN.
> All rights reserved. See [LICENSE](./LICENSE).

---

## Table of contents

- [Stack](#stack)
- [Repository structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Local development](#local-development)
- [Scripts](#scripts)
- [Quality bar](#quality-bar)
- [SEO architecture](#seo-architecture)
- [Security](#security)
- [Deployment](#deployment)
- [Browser support](#browser-support)
- [Performance budget](#performance-budget)
- [Contributing](#contributing)
- [License](#license)

---

## Stack

| Layer            | Choice                                                       |
| ---------------- | ------------------------------------------------------------ |
| Markup           | Static HTML5, hand-authored                                  |
| Styling          | Vanilla CSS (custom properties, container queries, `clamp`)  |
| Behavior         | Vanilla JavaScript, IIFE-scoped, defer-loaded                |
| Fonts            | Instrument Serif, Geist, Geist Mono (Google Fonts CDN)       |
| Images           | AVIF / WebP / JPG (or PNG for alpha) with responsive `srcset`|
| Schema           | JSON-LD multi-graph (`Organization`, `ProfessionalService`, `WebSite`, `WebPage`, `BreadcrumbList`, `FAQPage`) |
| Hosting target   | Cloudflare Pages (primary) · Netlify · Vercel                |
| CDN              | Cloudflare (origin) · platform-managed edge cache            |
| Form backend     | To be wired (`/api/apply`, `/api/subscribe`) — graceful fallback to email |

No build step. No bundler. No framework. The site is checked in as it ships.

## Repository structure

```
.
├── index.html                       # Homepage — single-page application
├── 404.html                         # On-brand not-found page
│
├── assets/
│   ├── css/styles.css               # All non-critical styles
│   ├── js/app.js                    # All client behavior (IIFE, defer-loaded)
│   └── img/
│       ├── hero/                    # AVIF + WebP + JPG, 4 widths each
│       ├── creators/                # AVIF + WebP + PNG (alpha-preserved)
│       ├── logo/                    # 10 sizes for favicon/manifest/Apple-touch
│       └── social/                  # OpenGraph 1200×630 + square 1200×1200
│
├── .well-known/
│   └── security.txt                 # RFC 9116 disclosure contact
│
├── robots.txt                       # Crawler policy + sitemap pointer
├── sitemap.xml                      # XML sitemap w/ image extensions
├── manifest.webmanifest             # PWA manifest
├── browserconfig.xml                # Windows tile configuration
├── humans.txt                       # Team credits
├── llms.txt                         # Canonical context for AI crawlers
├── favicon.ico                      # Multi-size ICO fallback
│
├── _headers                         # Cloudflare Pages / Netlify HTTP headers
├── _redirects                       # Cloudflare Pages / Netlify URL redirects
├── netlify.toml                     # Netlify-specific config
├── vercel.json                      # Vercel-specific config
│
├── .github/                         # CI/CD, code owners, issue + PR templates
├── .vscode/                         # Editor recommendations (committed)
│
├── LICENSE                          # Proprietary, Viral Ventures LLC
├── README.md                        # ← this file
├── CONTRIBUTING.md                  # Internal contribution guide
├── CHANGELOG.md                     # Semver-tagged changes
├── SECURITY.md                      # Vulnerability disclosure policy
│
├── package.json                     # Dev scripts only — no runtime deps shipped
├── .gitignore                       # Standard ignores
├── .gitattributes                   # Line endings + binary detection
├── .editorconfig                    # Cross-editor formatting baseline
├── .nvmrc                           # Pinned Node version for tooling
│
├── .prettierrc.json                 # Format configuration
├── .prettierignore                  # Format exclusions
├── .stylelintrc.json                # CSS lint rules
├── .htmlvalidate.json               # HTML validation rules
├── eslint.config.mjs                # Flat-config ESLint
└── .lighthouserc.json               # Lighthouse CI thresholds
```

## Prerequisites

- **Node.js** ≥ 20 (LTS). Use the version pinned in [`.nvmrc`](./.nvmrc):

  ```sh
  nvm use
  ```

- **npm** ≥ 10. Yarn / pnpm work too, but the lockfile is npm.

That's it. The runtime needs nothing — it's a static site. Node is only for
development tooling (linters, formatters, local server, Lighthouse CI).

## Local development

```sh
git clone git@github.com:jwillz7667/Elite-MGMT-Agency.com.git
cd Elite-MGMT-Agency.com
nvm use
npm install
npm run dev
```

The dev server is a strict-mode static file server at
[`http://localhost:4173`](http://localhost:4173). No live-reload — refresh
manually so you see exactly what production serves.

## Scripts

```sh
npm run dev            # Static server at :4173 (production-like)
npm run preview        # Same as dev, but binds 0.0.0.0 for LAN device testing

npm run format         # Prettier — write
npm run format:check   # Prettier — verify (CI gate)

npm run lint           # Run all linters in order: HTML → CSS → JS
npm run lint:html      # html-validate against `.htmlvalidate.json`
npm run lint:css       # stylelint against `.stylelintrc.json`
npm run lint:js        # eslint against `eslint.config.mjs`

npm run validate       # Structural validators (sitemap, JSON-LD, manifest)
npm run audit:a11y     # Pa11y axe-core run against the local server
npm run audit:perf     # Lighthouse CI against `.lighthouserc.json` budgets
npm run audit          # All of the above (CI runs this on every PR)

npm run check          # format:check + lint + validate — pre-commit gate
```

## Quality bar

A change merges only if **all** of these pass:

| Gate          | Tool             | Threshold                                          |
| ------------- | ---------------- | -------------------------------------------------- |
| Format        | Prettier         | Exact match (`format:check` is non-rewriting)      |
| HTML          | html-validate    | Zero errors, zero warnings                         |
| CSS           | stylelint        | Zero errors                                        |
| JS            | ESLint           | Zero errors, ≤ 0 warnings                          |
| Accessibility | Pa11y axe-core   | Zero WCAG 2.2 AA violations                        |
| Performance   | Lighthouse CI    | LCP ≤ 1.8s · CLS ≤ 0.05 · TBT ≤ 100ms · score ≥ 95 |
| Schema        | Custom validator | All JSON-LD blocks parse and conform               |

CI runs the same matrix in `.github/workflows/ci.yml`.

## SEO architecture

The site is built to rank top-5 for high-intent commercial keywords. The
mechanics:

- **Single primary `<h1>`** with a women-creator-agency keyword pattern; one
  `<h2>` per section, all referenced by `aria-labelledby` of their section.
- **Multi-graph JSON-LD** (`Organization` → `ProfessionalService` → `WebSite` →
  `WebPage` → `BreadcrumbList` → `FAQPage`), deduplicated via `@id`. The
  Organization node also declares `parentOrganization` to Viral Ventures LLC.
- **NYC local-SEO signals** (`geo.region`, `geo.position`, `ICBM`,
  `PostalAddress`) — local + city pages can extend this without a refactor.
- **`hreflang` triplet** (`en`, `en-us`, `x-default`) pointing to the same
  canonical to avoid cross-region cannibalization.
- **`<link rel="preload"`** for the LCP image with `imagesrcset` so modern UAs
  pull only the size they need.
- **`<picture>` everywhere** with AVIF → WebP → JPG/PNG fallback, sized via
  `srcset` + `sizes` to a real device-width.
- **`llms.txt`** at root provides canonical, accurate context to LLM crawlers
  that respect the new convention.
- **Image sitemap** for Google Image indexing of roster portraits.
- **CSP / HSTS / Permissions-Policy / Referrer-Policy** are wired in `_headers`
  + `netlify.toml` + `vercel.json` so security headers ship from every host.

## Security

- Reporting: **security@elite-mgmt-agency.com** (or
  **security@viral-ventures-llc.com**).
- Policy: [`SECURITY.md`](./SECURITY.md) · [`/.well-known/security.txt`](./.well-known/security.txt) (RFC 9116).
- Headers shipped per request:
  - HSTS 2-year preload-ready
  - CSP locked to `'self'` for default/script/img/connect
  - `Permissions-Policy` denies camera, microphone, geolocation, payment,
    USB, FLoC, etc.
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-Frame-Options: DENY` · `frame-ancestors 'none'`
  - COOP / CORP same-origin
- Form posts include a **honeypot field** + 15s timeout + graceful email fallback.
- Dependencies: zero production dependencies; dev deps governed by Dependabot
  ([`.github/dependabot.yml`](./.github/dependabot.yml)).

## Deployment

The site deploys as a static directory. **No build step** — the repo *is* the
artifact.

### Cloudflare Pages (primary)

1. Connect the GitHub repo to Pages.
2. Build command: *(empty)*
3. Build output: *(empty — uses repo root)*
4. Production branch: `main`
5. Custom domain: `elite-mgmt-agency.com`.

The [`_headers`](./_headers) and [`_redirects`](./_redirects) files are picked
up automatically.

### Netlify

`netlify deploy --dir=. --prod` — or use the GUI with [`netlify.toml`](./netlify.toml).

### Vercel

`vercel --prod` — picks up [`vercel.json`](./vercel.json).

### Manual smoke test before promoting

```sh
npm run audit         # Local CI suite
curl -I https://elite-mgmt-agency.com   # Verify HSTS, CSP, cache headers
```

## Browser support

Targets the **last 2 versions** of Chrome, Safari, Firefox, and Edge across
desktop and mobile. iOS Safari 15+, Android Chrome on Android 10+.

Older browsers degrade gracefully:

- AVIF unsupported → WebP → JPG/PNG via `<picture>`.
- IntersectionObserver missing → reveals show immediately.
- `inert` missing → focus-trap continues without main-content inerting.

## Performance budget

| Metric                 | Budget   | Current        |
| ---------------------- | -------- | -------------- |
| LCP (4G median)        | ≤ 1.8 s  | ~1.2 s         |
| CLS                    | ≤ 0.05   | ~0             |
| TBT                    | ≤ 100 ms | ~10 ms         |
| Largest JS (gzipped)   | ≤ 20 KB  | 5.6 KB         |
| Largest CSS (gzipped)  | ≤ 20 KB  | 9.6 KB         |
| LCP image (AVIF)       | ≤ 50 KB  | 28 KB          |

Enforced by [`.lighthouserc.json`](./.lighthouserc.json) in CI.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). In short:

1. Branch from `main` with `feat/<slug>`, `fix/<slug>`, or `chore/<slug>`.
2. Write a [Conventional Commit](https://www.conventionalcommits.org/).
3. Open a PR with the template filled in.
4. CI must be green, and the PR needs at least one CODEOWNERS approval.

Code style is enforced — let Prettier and the linters do the talking.

## License

[Proprietary](./LICENSE) — © 2019–2026 Viral Ventures LLC, Maple Grove, MN.
All rights reserved.

The Elite MGMT name, the Elite MGMT word mark, the Viral Ventures LLC name,
and all related visual identity assets are trademarks of Viral Ventures LLC.
Unauthorized use is prohibited.

---

<div align="center">

Built and maintained by **[Viral Ventures LLC](https://viral-ventures-llc.com)**
· Maple Grove, MN

</div>
