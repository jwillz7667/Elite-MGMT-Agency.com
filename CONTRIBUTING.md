# Contributing to Elite MGMT Agency

This repository is **proprietary** software owned by **Viral Ventures LLC** (Maple Grove, MN).
External contributions are not accepted at this time. This document is for **authorized
engineers, contractors, and partners** working on the Elite MGMT Agency web property
(`elite-mgmt-agency.com`).

If you found this repository by accident, please refer to the [LICENSE](./LICENSE) — the
source is published for transparency and operational continuity, not for reuse.

---

## Table of Contents

1. [Ground Rules](#ground-rules)
2. [Local Setup](#local-setup)
3. [Daily Workflow](#daily-workflow)
4. [Branching Model](#branching-model)
5. [Commit Conventions](#commit-conventions)
6. [Pull Requests](#pull-requests)
7. [Code Style](#code-style)
8. [Quality Gates](#quality-gates)
9. [Accessibility](#accessibility)
10. [SEO & Schema](#seo--schema)
11. [Performance Budget](#performance-budget)
12. [Security](#security)
13. [Release Process](#release-process)

---

## Ground Rules

- **Authorized contributors only.** You must be an employee or signed contractor of
  Viral Ventures LLC. Confirm with `engineering@viral-ventures-llc.com` if in doubt.
- **No third-party JS, fonts, or analytics** without an ADR and security review.
- **Privacy first.** No PII may be stored or transmitted by the static site.
  Applicant data submitted through forms is handled by an approved backend only.
- **The site is a marketing surface.** It must not import build tooling at runtime,
  hydrate frameworks, or ship more than what is necessary to render the page.

## Local Setup

```sh
# 1. Match the supported Node version
nvm use            # uses .nvmrc → node 20

# 2. Install dev tools
npm install

# 3. Run the local server
npm run dev        # serves at http://localhost:4173
```

The site is **static**. There is no build step. What you edit is what ships.

## Daily Workflow

1. Pull `main`, branch from it.
2. Make changes.
3. Run `npm run check` before committing (Prettier + linters + validator).
4. Commit using [Conventional Commits](#commit-conventions).
5. Open a PR. CI must be green before review.
6. After approval, squash-merge into `main`.
7. `main` deploys automatically to production (Cloudflare Pages).

## Branching Model

- `main` — always deployable. Protected. Squash-merge only.
- `feat/<slug>` — new feature.
- `fix/<ticket>-<slug>` — bug fix tied to a tracker ticket.
- `chore/<slug>` — tooling, deps, infra.
- `docs/<slug>` — documentation only.
- `hotfix/<slug>` — emergency production patch, fast-tracked review.

Branches are deleted after merge.

## Commit Conventions

[Conventional Commits 1.0](https://www.conventionalcommits.org/).

```
<type>(<scope>): <imperative subject under 72 chars>

<optional body explaining WHY, not WHAT>

<optional footer — e.g. BREAKING CHANGE, Refs #123>
```

**Allowed types:** `feat`, `fix`, `perf`, `refactor`, `style`, `docs`, `test`, `build`,
`ci`, `chore`, `revert`.

**Examples:**

```
feat(forms): add honeypot field to talent application
fix(menu): restore focus to trigger when drawer closes
perf(images): convert hero stack to AVIF + WebP fallback
chore(deps): bump prettier 3.4 → 3.5
```

One logical change per commit. Refactors and behavior changes never share a commit.

## Pull Requests

- Keep PRs small and reviewable. Target < 400 lines diff.
- Fill out the [PR template](.github/PULL_REQUEST_TEMPLATE.md) completely.
- Include before/after screenshots for any visible change.
- All CI checks must pass.
- At least one approval from a CODEOWNER required.
- Squash-merge — the PR title becomes the commit subject; keep it conventional.

## Code Style

- **Prettier** is the single source of truth for formatting. Don't fight it.
- **HTML** — semantic, accessible, validated by `html-validate`. No `<div>` soup.
- **CSS** — design tokens in `:root`. Mobile-first. `@media (prefers-reduced-motion)`
  and `@media (prefers-contrast)` are not optional.
- **JS** — single IIFE in `assets/js/app.js`. Vanilla, ES2022, strict mode.
  No frameworks, no transpilers, no minifiers (yet).
- **No inline scripts** other than the JSON-LD schema block and structured data.
- Filenames: `kebab-case` for everything except brand-mandated PascalCase assets.

## Quality Gates

Every commit must pass:

| Gate | Tool | Command |
|---|---|---|
| Format | Prettier 3 | `npm run format:check` |
| HTML | html-validate (WCAG-aware) | `npm run lint:html` |
| CSS | stylelint-config-standard | `npm run lint:css` |
| JS | ESLint (flat config) | `npm run lint:js` |
| Validate | custom script | `npm run validate` |
| A11y | Pa11y CI | `npm run audit:a11y` |
| Perf | Lighthouse CI | `npm run audit:perf` |

`husky` + `lint-staged` enforce format + lint on `git commit`.

## Accessibility

- WCAG 2.2 Level AA is the floor, not the ceiling.
- All interactive elements must be keyboard-reachable with visible `:focus-visible`.
- Color contrast: 4.5:1 for body text, 3:1 for large text and UI components.
- Every image carries meaningful `alt` text or `alt=""` if decorative.
- `prefers-reduced-motion` disables non-essential animation.
- Modals trap focus and use `inert` on background content.
- Forms have visible labels — never rely on placeholders alone.

## SEO & Schema

- One H1 per page. Heading levels are sequential (no skips).
- Every page has a unique `<title>` (≤ 60 chars) and meta description (≤ 160 chars).
- Open Graph + Twitter Card tags on every page.
- JSON-LD multi-graph: `Organization`, `ProfessionalService`, `WebSite`, `WebPage`,
  `BreadcrumbList`, `FAQPage`.
- `parentOrganization` on Elite MGMT Agency → Viral Ventures LLC.
- `sitemap.xml` and `robots.txt` updated for any new public page.
- `llms.txt` updated when brand canonical context changes.

## Performance Budget

| Metric | Budget | Hard ceiling |
|---|---|---|
| LCP (75th percentile, mobile) | ≤ 1.8s | 2.5s |
| CLS | ≤ 0.05 | 0.1 |
| TBT | ≤ 100ms | 200ms |
| HTML transferred | ≤ 25KB gzip | 40KB |
| JS transferred (first load) | ≤ 8KB gzip | 15KB |
| Total page weight | ≤ 600KB | 1MB |

Any change that pushes a metric past its budget needs a Lighthouse CI override
plus a justification in the PR description.

## Security

- Report security issues via the process in [SECURITY.md](./SECURITY.md).
- Never commit secrets. `.env*` and `*.pem` are gitignored — verify with
  `git check-ignore` if unsure.
- CSP, HSTS, Permissions-Policy, and COOP/CORP headers are non-negotiable.
- Forms include honeypot fields; the backend additionally rate-limits.

## Release Process

1. Merge to `main` triggers the `deploy` workflow.
2. Cloudflare Pages builds and promotes to production.
3. Update [CHANGELOG.md](./CHANGELOG.md) for any visible change.
4. Tag releases that ship a material feature (`v1.x.0`) or patch (`v1.0.x`).

---

Questions: `engineering@viral-ventures-llc.com`
