# Changelog

All notable changes to the Elite MGMT Agency web property are documented in this file.

The format follows [Keep a Changelog 1.1](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning 2.0](https://semver.org/spec/v2.0.0.html).

Owner: **Viral Ventures LLC**, Maple Grove, MN.

---

## [Unreleased]

### Added

- Repository scaffolding for proprietary delivery: `LICENSE`, `README.md`,
  `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`.
- Tooling configs: Prettier, ESLint (flat config), stylelint, html-validate,
  Lighthouse CI, Pa11y CI.
- GitHub workflows: `ci.yml` (format + lint + validate + audit) and
  `deploy.yml` (Cloudflare Pages production deploy).
- Dependabot configuration for weekly dependency updates.
- VS Code workspace settings and recommended extensions.
- Pull request and issue templates.

## [1.0.0] - 2026-05-11

### Added

- Production launch of `elite-mgmt-agency.com`.
- Single-page marketing site implemented in semantic HTML5, modern CSS, and a
  single vanilla JS IIFE (no frameworks, no build step).
- Sections: hero, philosophy, services (5 cards), talent gallery with ARIA
  tablist filter, journal (4 articles), pricing, FAQ accordion, talent
  application form, contact, footer with newsletter signup.
- Brand system: dark luxury palette (`#0A0A0A`, `#D4AF37`, `#1B5E20`),
  Playfair Display + Inter typography, glassmorphism, custom cursor, gold
  spotlight hover.
- Side-drawer navigation with focus trap, `inert` background, Esc-to-close,
  scroll lock.
- Accessibility: WCAG 2.2 AA contrast, keyboard-navigable tablist with
  roving tabindex, `prefers-reduced-motion` and `prefers-contrast` support.
- SEO foundation: multi-graph JSON-LD (`Organization`, `ProfessionalService`,
  `WebSite`, `WebPage`, `BreadcrumbList`, `FAQPage`), canonical URL,
  hreflang, Open Graph, Twitter Card, image sitemap.
- AI-crawler policy: `llms.txt`, `robots.txt` directives differentiating
  training scrapers (GPTBot, CCBot, anthropic-ai, Google-Extended,
  Bytespider — denied) from user-agent retrieval (ChatGPT-User, Claude-Web
  — allowed).
- PWA manifest with 10 icon sizes, 3 shortcuts, screenshot, categories.
- `.well-known/security.txt` (RFC 9116), `humans.txt`, `browserconfig.xml`.
- Branded 404 page with announce, navigation, and home/apply CTA.
- HTTP security headers: HSTS 63072000 preload, CSP, Permissions-Policy
  (denies camera, microphone, geolocation, payment, USB), COOP/CORP
  same-origin, `X-Frame-Options: DENY`.
- Deployment configs for Cloudflare Pages (`_headers`, `_redirects`),
  Netlify (`netlify.toml`), and Vercel (`vercel.json`).

### Security

- Honeypot field on talent application and newsletter forms.
- 15-second `AbortController` timeout on form fetch with graceful fallback
  to a `mailto:` link.
- External links open with `target="_blank" rel="noopener noreferrer"`.

[Unreleased]: https://github.com/jwillz7667/Elite-MGMT-Agency.com/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/jwillz7667/Elite-MGMT-Agency.com/releases/tag/v1.0.0
